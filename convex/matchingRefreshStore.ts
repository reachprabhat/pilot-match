import {internalMutation} from "./_generated/server";
import {v} from "convex/values";
import {eligibleMatches,selectedSearch} from "./lib/fitList";
import {matchValidator} from "./matchingValidators";
import {internal} from "./_generated/api";
import {excludedOperators} from "./lib/fitList";
export const queueForFounder=internalMutation({args:{linkHash:v.string()},returns:v.boolean(),handler:async(ctx,args)=>{
 const founder=await ctx.db.query("founders").withIndex("by_link_hash",q=>q.eq("linkHash",args.linkHash)).unique();if(!founder)return false;
 const search=await selectedSearch(ctx,founder);if(!search)return false;if(search.refreshState==="queued"||search.refreshState==="running")return true;if(search.refreshState==="failed")return false;
 const available=await eligibleMatches(ctx,founder._id,search.matches??[]);if(available.length>=2)return false;
 const excluded=await excludedOperators(ctx,founder._id),operators=await ctx.db.query("operators").withIndex("by_operator_id").take(501);if(operators.length>500)throw Error("Operator list unavailable");
 if(operators.filter(r=>!excluded.has(r.operatorId)).length<=available.length)return false;
 await ctx.db.patch(search._id,{refreshState:"queued"});await ctx.scheduler.runAfter(0,internal.matchingRefresh.run,{searchId:search._id});return true;
}});
export const begin=internalMutation({
 args:{searchId:v.id("founderSearches")},returns:v.union(v.null(),v.object({founderId:v.id("founders"),ask:v.string()})),
 handler:async(ctx,{searchId})=>{
  const search=await ctx.db.get(searchId);if(!search||search.status!=="completed"||search.refreshState==="running")return null;
  const founder=await ctx.db.get(search.founderId);if(!founder||(await selectedSearch(ctx,founder))?._id!==searchId)return null;
  if((await eligibleMatches(ctx,founder._id,search.matches??[])).length>=2){await ctx.db.patch(searchId,{refreshState:undefined});return null;}
  const recent=await ctx.db.query("aiCalls").withIndex("by_started_at",q=>q.gte("startedAt",Date.now()-3600000)).take(100);if(recent.length>=100){await ctx.scheduler.runAfter(60000,internal.matchingRefresh.run,{searchId});return null;}
  await ctx.db.insert("aiCalls",{founderId:founder._id,startedAt:Date.now(),purpose:"founder_matching"});
  await ctx.db.patch(searchId,{refreshState:"running",refreshVersion:search.candidateVersion??0});return {founderId:founder._id,ask:search.ask};
 }
});
export const finish=internalMutation({
 args:{searchId:v.id("founderSearches"),matches:v.optional(v.array(matchValidator))},returns:v.null(),
 handler:async(ctx,args)=>{const search=await ctx.db.get(args.searchId);if(!search||search.refreshState!=="running")return null;
 if((search.candidateVersion??0)!==search.refreshVersion){await ctx.db.patch(search._id,{refreshState:undefined});return null;}
 if(args.matches){const updates=new Map(args.matches.map(r=>[r.operatorId,r]));for(const r of search.matches??[])if(!updates.has(r.operatorId))updates.set(r.operatorId,r);await ctx.db.patch(search._id,{matches:[...updates.values()],refreshState:undefined});}
 else await ctx.db.patch(search._id,{refreshState:"failed"});return null;}
});

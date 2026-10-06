import {internalMutation,internalQuery} from "./_generated/server";
import {v} from "convex/values";
import {searchState,SEARCH_LIMIT} from "./searchRules";
import {matchValidator,matchingResultValidator} from "./matchingValidators";
import {prepareInput} from "./lib/matching";

export const reserve=internalMutation({
  args:{linkHash:v.string(),requestId:v.string(),ask:v.string()},
  returns:v.union(matchingResultValidator,v.object({status:v.literal("reserved"),searchId:v.id("founderSearches"),founderDocId:v.id("founders")})),
  handler:async(ctx,args)=>{
    if(!/^[a-f0-9]{64}$/.test(args.linkHash))return {status:"invalid_link" as const};
    const ask=args.ask.trim();
    if(!ask || ask.length>12000 || ask.split(/\s+/u).length>300 || !/^[A-Za-z0-9_-]{16,80}$/.test(args.requestId))return {status:"invalid_ask" as const};
    const founder=await ctx.db.query("founders").withIndex("by_link_hash",q=>q.eq("linkHash",args.linkHash)).unique();
    if(!founder)return {status:"invalid_link" as const};
    const state=searchState(founder.searchCount);
    const existing=await ctx.db.query("founderSearches").withIndex("by_founder_request",q=>q.eq("founderId",founder._id).eq("requestId",args.requestId)).unique();
    if(existing && existing.ask!==ask)return {status:"invalid_ask" as const};
    // Pin repeat asks to their first completed result, across quota resets.
    const saved=await ctx.db.query("founderSearches").withIndex("by_founder_ask_status",q=>q.eq("founderId",founder._id).eq("ask",ask).eq("status","completed")).order("asc").first();
    if(saved?.matches){
      if(founder.activeSearchId!==saved._id)await ctx.db.patch(founder._id,{activeSearchId:saved._id});
      return {status:"matched" as const,matches:saved.matches,...state};
    }
    if(existing) {
      if(existing.ask!==ask)return {status:"invalid_ask" as const};
      if(existing.status==="completed" && existing.matches)return {status:"matched" as const,matches:existing.matches,...state};
      return {status:"busy" as const};
    }
    if(state.searchCount>=SEARCH_LIMIT)return {status:"limit_reached" as const,...state};
    const now=Date.now();
    const running=await ctx.db.query("founderSearches").withIndex("by_founder_status",q=>q.eq("founderId",founder._id).eq("status","running")).take(1);
    if(running[0]) {
      if(now-running[0].savedAt<90000)return {status:"busy" as const};
      await ctx.db.patch(running[0]._id,{status:"failed"});
    }
    const recent=await ctx.db.query("aiCalls").withIndex("by_started_at",q=>q.gte("startedAt",now-3600000)).take(100);
    if(recent.length>=100)return {status:"busy" as const};
    const runId=await ctx.db.insert("aiCalls",{founderId:founder._id,startedAt:now,purpose:"founder_matching"});
    const searchId=await ctx.db.insert("founderSearches",{founderId:founder._id,ask,requestId:args.requestId,savedAt:now,status:"running",runId,resetVersion:founder.searchResetVersion??0});
    return {status:"reserved" as const,searchId,founderDocId:founder._id};
  },
});

export const input=internalQuery({
  args:{founderDocId:v.id("founders"),ask:v.string()},
  returns:v.object({ask:v.string(),founder:v.object({founderId:v.string(),profileText:v.string()}),operators:v.array(v.object({operatorId:v.string(),profileText:v.string()})),privateNames:v.array(v.string()),privatePhones:v.array(v.string())}),
  handler:async(ctx,args)=>{
    const founder=await ctx.db.get(args.founderDocId);
    if(!founder)throw Error("Missing founder");
    const operators=await ctx.db.query("operators").withIndex("by_operator_id").take(501);
    if(operators.length<2 || operators.length>500)throw Error("Operator list unavailable");
    return prepareInput(founder,operators,args.ask);
  },
});

export const complete=internalMutation({
  args:{searchId:v.id("founderSearches"),matches:v.array(matchValidator),responseId:v.string()},returns:matchingResultValidator,
  handler:async(ctx,args)=>{
    const search=await ctx.db.get(args.searchId);
    if(!search || search.status!=="running")return {status:"busy" as const};
    const founder=await ctx.db.get(search.founderId);
    if(!founder || (founder.searchResetVersion??0)!==search.resetVersion)return {status:"busy" as const};
    const state=searchState(founder.searchCount);
    if(state.searchCount>=SEARCH_LIMIT)return {status:"limit_reached" as const,...state};
    if(args.matches.length!==2 || new Set(args.matches.map(match=>match.operatorId)).size!==2 || args.matches.some(match=>!Number.isInteger(match.score)||match.score<0||match.score>100))throw Error("Invalid matches");
    await ctx.db.patch(search._id,{status:"completed",matches:args.matches,responseId:args.responseId});
    await ctx.db.patch(founder._id,{searchCount:state.searchCount+1,activeSearchId:search._id});
    return {status:"matched" as const,matches:args.matches,...searchState(state.searchCount+1)};
  },
});
export const fail=internalMutation({
  args:{searchId:v.id("founderSearches")},returns:v.null(),
  handler:async(ctx,args)=>{const search=await ctx.db.get(args.searchId);if(search?.status==="running")await ctx.db.patch(search._id,{status:"failed"});return null;},
});

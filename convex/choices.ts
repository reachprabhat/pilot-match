import {internalQuery, internalMutation} from "./_generated/server";
import {v} from "convex/values";
import {choiceStatusValidator} from "./choiceValidators";
import {matchValidator} from "./matchingValidators";
import {privateOpportunity} from "./lib/opportunity";
import {currentResponse,requestIdentity} from "./lib/meetingResponses";
import {founderResponseValidator} from "./responseValidators";
import type {QueryCtx} from "./_generated/server";
import type {Doc} from "./_generated/dataModel";
import {internal} from "./_generated/api";
import {excludedOperators,originalTopMatches,strongMatches,selectedSearch} from "./lib/fitList";

export const latest = internalQuery({
  args:{linkHash:v.string()},
  returns:v.union(v.null(),v.object({ask:v.string(),searchId:v.union(v.id("founderSearches"),v.null()),bothMatchesRequested:v.boolean(),matches:v.array(v.object({...matchValidator.fields,choice:v.union(choiceStatusValidator,v.null()),response:v.union(founderResponseValidator,v.null())})),refreshPending:v.boolean()})),
  handler:async(ctx,args)=>{
    const founder=await ctx.db.query("founders").withIndex("by_link_hash",q=>q.eq("linkHash",args.linkHash)).unique();
    if(!founder)return null;
    const search=await selectedSearch(ctx,founder);
    const original=search?.originalMatches??search?.matches??[];
    const top=originalTopMatches(original),excluded=await excludedOperators(ctx,founder._id);
    const matches=await Promise.all((await strongMatches(ctx,founder._id,original)).map(async match=>{
      const choice=await ctx.db.query("founderChoices").withIndex("by_founder_operator",q=>q.eq("founderId",founder._id).eq("operatorId",match.operatorId)).unique();
      const response=choice?await currentResponse(ctx,choice):null;
      return {...match,choice:choice?.status??null,response:response?(response.status==="Interested"?"Accepted" as const:"Declined" as const):null};
    }));
    return {ask:search?.ask??"",searchId:search?._id??null,matches,bothMatchesRequested:top.length===2&&top.every(match=>excluded.has(match.operatorId)),refreshPending:false};
  },
});

export const save = internalMutation({
  args:{linkHash:v.string(),operatorId:v.string(),status:choiceStatusValidator},
  returns:v.union(v.object({error:v.literal("invalid_link")}),v.object({error:v.literal("invalid_match")}),v.object({operatorId:v.string(),status:choiceStatusValidator,updatedAt:v.number(),response:v.union(founderResponseValidator,v.null())})),
  handler:async(ctx,args)=>{
    const founder=await ctx.db.query("founders").withIndex("by_link_hash",q=>q.eq("linkHash",args.linkHash)).unique();
    if(!founder)return {error:"invalid_link" as const};
    const search=await selectedSearch(ctx,founder);
    const available=await strongMatches(ctx,founder._id,search?.originalMatches??search?.matches??[]);
    const existing=await ctx.db.query("founderChoices").withIndex("by_founder_operator",q=>q.eq("founderId",founder._id).eq("operatorId",args.operatorId)).unique();
    const sameRequest=existing?.status==="Requested"&&args.status==="Requested"&&(await requestIdentity(ctx,existing))?.searchId===search?._id;
    const cancelExisting=existing&&args.status!=="Requested";
    if(!search||!available.filter(match=>match.score>=80).slice(0,2).some(match=>match.operatorId===args.operatorId)&&!sameRequest&&!cancelExisting)return {error:"invalid_match" as const};
    const previousStatus=existing?.status;
    const updatedAt=Date.now();
    if(existing)await ctx.db.patch(existing._id,{status:args.status,updatedAt});
    else await ctx.db.insert("founderChoices",{founderId:founder._id,operatorId:args.operatorId,status:args.status,updatedAt});
    if(args.status==="Requested"){
      const request=await ctx.db.query("operatorRequests").withIndex("by_founder_operator",q=>q.eq("founderId",founder._id).eq("operatorId",args.operatorId)).unique();
      // Repeating the same saved request preserves its original opportunity.
      if(!request||request.searchId!==search._id||previousStatus!=="Requested"){
        const snapshot={searchId:search._id,ask:privateOpportunity(search.ask,founder),requestedAt:Math.max(updatedAt,(request?.requestedAt??0)+1)};
        if(request)await ctx.db.patch(request._id,snapshot);
        else await ctx.db.insert("operatorRequests",{founderId:founder._id,operatorId:args.operatorId,...snapshot});
      }
    }
    const response=existing?await currentResponse(ctx,{...existing,status:args.status}):null;
    return {operatorId:args.operatorId,status:args.status,updatedAt,response:response?(response.status==="Interested"?"Accepted" as const:"Declined" as const):null};
  },
});

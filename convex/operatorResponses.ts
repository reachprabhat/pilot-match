import {internalMutation} from "./_generated/server";
import {v} from "convex/values";
import {operatorResponseValidator} from "./responseValidators";
import {requestIdentity} from "./lib/meetingResponses";
import {privateOpportunity} from "./lib/opportunity";
import {ensureAccess} from "./lib/revealAccess";

export const save=internalMutation({
  args:{linkHash:v.string(),requestId:v.id("founderChoices"),requestedAt:v.number(),status:operatorResponseValidator},
  returns:v.union(v.object({error:v.union(v.literal("invalid_link"),v.literal("invalid_request"),v.literal("stale_request"))}),v.object({requestId:v.id("founderChoices"),status:operatorResponseValidator,updatedAt:v.number()})),
  handler:async(ctx,args)=>{
    const link=await ctx.db.query("operatorLinks").withIndex("by_link_hash",q=>q.eq("linkHash",args.linkHash)).unique();
    if(!link)return {error:"invalid_link" as const};
    const operator=await ctx.db.query("operators").withIndex("by_operator_id",q=>q.eq("operatorId",link.operatorId)).unique();
    if(!operator)return {error:"invalid_link" as const};
    const choice=await ctx.db.get(args.requestId);
    if(!choice||choice.operatorId!==link.operatorId||choice.status!=="Requested")return {error:"invalid_request" as const};
    const identity=await requestIdentity(ctx,choice);
    if(!identity)return {error:"invalid_request" as const};
    if(identity.requestedAt!==args.requestedAt)return {error:"stale_request" as const};
    const search=await ctx.db.get(identity.searchId);
    if(!search||search.founderId!==choice.founderId||search.status!=="completed"||!search.matches?.some(match=>match.operatorId===link.operatorId))return {error:"invalid_request" as const};
    const existing=await ctx.db.query("operatorResponses").withIndex("by_request",q=>q.eq("requestId",choice._id)).unique();
    if(existing&&existing.searchId===identity.searchId&&existing.requestedAt===identity.requestedAt&&existing.status===args.status){if(args.status==="Interested")await ensureAccess(ctx,choice);return {requestId:choice._id,status:existing.status,updatedAt:existing.updatedAt};}
    // Anchor legacy requests without changing the founder's saved choice.
    const saved=await ctx.db.query("operatorRequests").withIndex("by_founder_operator",q=>q.eq("founderId",choice.founderId).eq("operatorId",link.operatorId)).unique();
    if(!saved){
      const founder=await ctx.db.get(choice.founderId);
      if(!founder)return {error:"invalid_request" as const};
      await ctx.db.insert("operatorRequests",{founderId:choice.founderId,operatorId:link.operatorId,...identity,ask:privateOpportunity(search.ask,founder)});
    }
    const updatedAt=Date.now();
    const fields={...identity,status:args.status,updatedAt};
    if(existing)await ctx.db.patch(existing._id,fields);
    else await ctx.db.insert("operatorResponses",{requestId:choice._id,...fields});
    if(args.status==="Interested")await ensureAccess(ctx,choice);
    return {requestId:choice._id,status:args.status,updatedAt};
  },
});

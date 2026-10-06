import {internalQuery} from "./_generated/server";
import {paginationOptsValidator} from "convex/server";
import {v} from "convex/values";
import {privateOpportunity} from "./lib/opportunity";
import {currentResponse} from "./lib/meetingResponses";
import {operatorResponseValidator} from "./responseValidators";

export const list=internalQuery({
  args:{linkHash:v.string(),paginationOpts:paginationOptsValidator},
  returns:v.union(v.null(),v.object({requests:v.array(v.object({requestId:v.id("founderChoices"),ask:v.string(),requestedAt:v.number(),response:v.union(operatorResponseValidator,v.null()),industry:v.optional(v.string()),topFeatures:v.optional(v.array(v.string())),pilotsDone:v.optional(v.string()),why:v.optional(v.string())})),continueCursor:v.string(),isDone:v.boolean()})),
  handler:async(ctx,args)=>{
    const link=await ctx.db.query("operatorLinks").withIndex("by_link_hash",q=>q.eq("linkHash",args.linkHash)).unique();
    if(!link)return null;
    const operator=await ctx.db.query("operators").withIndex("by_operator_id",q=>q.eq("operatorId",link.operatorId)).unique();
    if(!operator)return null;
    const page=await ctx.db.query("founderChoices").withIndex("by_operator_status",q=>q.eq("operatorId",link.operatorId).eq("status","Requested")).order("desc").paginate({...args.paginationOpts,numItems:Math.min(20,Math.max(1,args.paginationOpts.numItems))});
    const requests=[];
    for(const choice of page.page){
      const founder=await ctx.db.get(choice.founderId);
      if(!founder)continue;
      const saved=await ctx.db.query("operatorRequests").withIndex("by_founder_operator",q=>q.eq("founderId",choice.founderId).eq("operatorId",link.operatorId)).unique();
      // Old Requested choices remain visible without rewriting any saved choice.
      const search=saved?await ctx.db.get(saved.searchId):await ctx.db.query("founderSearches").withIndex("by_founder_status_saved_at",q=>q.eq("founderId",choice.founderId).eq("status","completed").lte("savedAt",choice.updatedAt)).order("desc").first();
      if(!saved&&!search?.matches?.some(match=>match.operatorId===link.operatorId))continue;
      const present=(value:string|undefined)=>Boolean(value?.trim()&&!/^(not found|unknown|n\/a|none|-)$/i.test(value.trim()));
      const clean=(value:string)=>privateOpportunity(privateOpportunity(value,founder),operator);
      const features=(founder.topFeatures??"").split(/\r?\n|;|[•●]/).map(value=>value.replace(/^\s*(?:[-*]|\d+[.)])\s*/,"").trim()).filter(value=>present(value)).slice(0,2);
      const pilots=(founder.pilotDone??"").trim();
      const why=search?.founderId===founder._id?search.matches?.find(match=>match.operatorId===link.operatorId)?.why:undefined;
      const requestedAt=saved?.requestedAt??choice.updatedAt;
      const response=await currentResponse(ctx,choice,search?{searchId:search._id,requestedAt}:null);
      requests.push({requestId:choice._id,ask:clean(saved?.ask??search?.ask??""),requestedAt,response:response?.status??null,
        ...(present(founder.industry)?{industry:clean(founder.industry)}:{}),
        ...(features.length?{topFeatures:features.map(clean)}:{}),
        ...(/^\d+(?:\s+pilots?(?:\s+(?:done|completed))?)?$/i.test(pilots)?{pilotsDone:pilots.match(/^\d+/)![0]}:{}),
        ...(present(why)?{why:clean(why!)}:{}),
      });
    }
    return {requests,continueCursor:page.continueCursor,isDone:page.isDone};
  },
});

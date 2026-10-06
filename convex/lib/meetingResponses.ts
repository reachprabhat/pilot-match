import type {QueryCtx} from "../_generated/server";
import type {Doc,Id} from "../_generated/dataModel";

export async function requestIdentity(ctx:QueryCtx,choice:Doc<"founderChoices">){
  const saved=await ctx.db.query("operatorRequests").withIndex("by_founder_operator",q=>q.eq("founderId",choice.founderId).eq("operatorId",choice.operatorId)).unique();
  if(saved)return {searchId:saved.searchId,requestedAt:saved.requestedAt};
  const search=await ctx.db.query("founderSearches").withIndex("by_founder_status_saved_at",q=>q.eq("founderId",choice.founderId).eq("status","completed").lte("savedAt",choice.updatedAt)).order("desc").first();
  if(!search?.matches?.some(match=>match.operatorId===choice.operatorId))return null;
  return {searchId:search._id,requestedAt:choice.updatedAt};
}

export async function currentResponse(ctx:QueryCtx,choice:Doc<"founderChoices">,identity?:{searchId:Id<"founderSearches">;requestedAt:number}|null){
  if(choice.status!=="Requested")return null;
  const response=await ctx.db.query("operatorResponses").withIndex("by_request",q=>q.eq("requestId",choice._id)).unique();
  if(!response)return null;
  const request=identity===undefined?await requestIdentity(ctx,choice):identity;
  return request&&response.searchId===request.searchId&&response.requestedAt===request.requestedAt?response:null;
}

import type {QueryCtx} from "../_generated/server";
import type {Doc,Id} from "../_generated/dataModel";
import type {Match} from "./matching";

export async function excludedOperators(ctx:QueryCtx,founderId:Id<"founders">){
  const requests=await ctx.db.query("operatorRequests").withIndex("by_founder",q=>q.eq("founderId",founderId)).take(501);
  const intros=await ctx.db.query("introductions").withIndex("by_founder",q=>q.eq("founderId",founderId)).take(501);
  if(requests.length>500||intros.length>500)throw Error("Request history unavailable");
  return new Set([...requests,...intros].map(r=>r.operatorId));
}
export async function eligibleMatches(ctx:QueryCtx,founderId:Id<"founders">,matches:Match[]){
  const excluded=await excludedOperators(ctx,founderId);
  const eligible:Match[]=[];
  for(const match of matches)if(!excluded.has(match.operatorId)&&await ctx.db.query("operators").withIndex("by_operator_id",q=>q.eq("operatorId",match.operatorId)).unique())eligible.push(match);
  return eligible.sort((a,b)=>b.score-a.score||a.operatorId.localeCompare(b.operatorId));
}
// Keep the saved scoring pool intact; the cutoff controls visible/requestable results.
export function originalTopMatches(matches:Match[]){
  return [...matches].sort((a,b)=>b.score-a.score||a.operatorId.localeCompare(b.operatorId)).slice(0,2).filter(match=>match.score>=80);
}
export async function strongMatches(ctx:QueryCtx,founderId:Id<"founders">,matches:Match[]){
  return eligibleMatches(ctx,founderId,originalTopMatches(matches));
}
export async function selectedSearch(ctx:QueryCtx,founder:Doc<"founders">){
  return ctx.db.query("founderSearches").withIndex("by_founder_status",q=>q.eq("founderId",founder._id).eq("status","completed")).order("desc").first();
}

import {internalMutation} from "./_generated/server";
import {v} from "convex/values";
import {indiaDay} from "./searchRules";
import {publicOperatorNumber} from "./lib/operatorNumbers";

// Authenticated CLI only; this release must never mutate the dev deployment.
export const finalize=internalMutation({
  args:{founderLinks:v.array(v.object({founderId:v.string(),linkHash:v.string()})),deleteAiCallIds:v.array(v.id("aiCalls"))},
  returns:v.object({deletedAiCalls:v.number(),resetFounders:v.number(),assignedNumbers:v.number()}),
  handler:async(ctx,args)=>{
    if(process.env.CONVEX_CLOUD_URL!=="https://first-guanaco-957.convex.cloud")throw Error("Production release target mismatch.");
    if(args.deleteAiCallIds.length!==4||new Set(args.deleteAiCallIds).size!==4)throw Error("Expected the four approved usage records.");
    const founders=await ctx.db.query("founders").withIndex("by_founder_id").take(501);
    if(founders.length>500||founders.length!==args.founderLinks.length)throw Error("Founder set changed; review before release.");
    for(const founder of founders)if(!args.founderLinks.some(expected=>expected.founderId===founder.founderId&&expected.linkHash===founder.linkHash))throw Error("Founder link changed; review before release.");
    const target=founders.find(founder=>founder.founderId==="1");
    if(!target)throw Error("Cleanup founder unavailable.");
    const searches=await ctx.db.query("founderSearches").withIndex("by_founder_status",q=>q.eq("founderId",target._id)).take(1);
    const requests=await ctx.db.query("operatorRequests").withIndex("by_founder",q=>q.eq("founderId",target._id)).take(1);
    const introductions=await ctx.db.query("introductions").withIndex("by_founder",q=>q.eq("founderId",target._id)).take(1);
    const choices=await ctx.db.query("founderChoices").withIndex("by_founder_operator",q=>q.eq("founderId",target._id)).take(1);
    if(searches.length||requests.length||introductions.length||choices.length)throw Error("New activity exists; review the deletion list again.");
    const calls=[];
    for(const id of args.deleteAiCallIds){const call=await ctx.db.get(id);if(call&&(call.founderId!==target._id||call.purpose!=="founder_matching"))throw Error("Usage record is outside the approved cleanup.");if(call)calls.push(call);}
    const operators=await ctx.db.query("operators").withIndex("by_operator_id").take(10001);
    if(operators.length>10000)throw Error("Operator set too large.");
    let next=Math.max(0,...operators.map(operator=>publicOperatorNumber(operator)??0))+1,assignedNumbers=0;
    for(const operator of operators)if(publicOperatorNumber(operator)===null){await ctx.db.patch(operator._id,{operatorNumber:next++});assignedNumbers++;}
    for(const call of calls)await ctx.db.delete(call._id);
    for(const founder of founders)await ctx.db.patch(founder._id,{searchCount:0,searchDay:indiaDay(),searchResetVersion:(founder.searchResetVersion??0)+1});
    return {deletedAiCalls:calls.length,resetFounders:founders.length,assignedNumbers};
  },
});

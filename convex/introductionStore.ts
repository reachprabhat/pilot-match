import {internalMutation} from "./_generated/server";
import {internal} from "./_generated/api";
import {v} from "convex/values";
import {currentResponse} from "./lib/meetingResponses";
import {prepareInput} from "./lib/matching";

export const reserve=internalMutation({
  args:{introductionId:v.id("introductions")},returns:v.union(v.null(),v.object({profileText:v.string()})),
  handler:async(ctx,args)=>{
    const intro=await ctx.db.get(args.introductionId);
    if(!intro||intro.status!=="queued")return null;
    const choice=await ctx.db.get(intro.requestId),response=choice?await currentResponse(ctx,choice):null;
    if(response?.status!=="Interested"||response.requestedAt!==intro.requestedAt||response.searchId!==intro.searchId)return null;
    const calls=await ctx.db.query("aiCalls").withIndex("by_started_at",q=>q.gte("startedAt",Date.now()-3600000)).take(100);
    if(calls.length>=100){await ctx.scheduler.runAfter(60000,internal.introductionWelcome.generate,args);return null;}
    const founder=await ctx.db.get(intro.founderId),operator=await ctx.db.query("operators").withIndex("by_operator_id",q=>q.eq("operatorId",intro.operatorId)).unique();
    if(!founder||!operator)return null;
    const safe=prepareInput(founder,[operator],"");
    // Record the sole attempt before external IO. No provider retries or repeat generations.
    const callId=intro.callId??await ctx.db.insert("aiCalls",{startedAt:Date.now(),purpose:"accepted_welcome",introductionId:intro._id,founderId:intro.founderId,operatorId:intro.operatorId});
    await ctx.db.patch(intro._id,{status:"running",callId});
    return {profileText:JSON.stringify({founder:safe.founder,operator:safe.operators[0]})};
  },
});
export const finish=internalMutation({
  args:{introductionId:v.id("introductions"),welcome:v.optional(v.string()),responseId:v.optional(v.string())},returns:v.null(),
  handler:async(ctx,args)=>{
    const intro=await ctx.db.get(args.introductionId);
    if(intro?.status==="running")await ctx.db.patch(intro._id,args.welcome?{status:"ready",welcome:args.welcome,responseId:args.responseId}:{status:"failed"});
    return null;
  },
});
export const providerCall=internalMutation({
  args:{introductionId:v.id("introductions")},returns:v.boolean(),
  handler:async(ctx,args)=>{
    const intro=await ctx.db.get(args.introductionId);
    if(!intro||intro.status!=="running"||intro.providerCallCount)return false;
    await ctx.db.patch(intro._id,{providerCallCount:1});
    return true;
  },
});

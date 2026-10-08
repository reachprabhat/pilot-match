import {internalQuery} from "./_generated/server";
import {revenueText} from "./lib/revenueLabels";
import {paginationOptsValidator} from "convex/server";
import {v} from "convex/values";
import {requestIdentity,currentResponse} from "./lib/meetingResponses";
import {publicOperatorNumber} from "./lib/operatorNumbers";
import {paymentLabel} from "./lib/paymentLabel";
import {privateOpportunity} from "./lib/opportunity";

export const list=internalQuery({
  args:{linkHash:v.string(),paginationOpts:paginationOptsValidator},
  returns:v.union(v.null(),v.object({requests:v.array(v.union(v.object({
    requestId:v.id("founderChoices"),founderId:v.string(),operatorId:v.string(),operatorNumber:v.union(v.number(),v.null()),requestedAt:v.number(),
    status:v.union(v.literal("Requested"),v.literal("Accepted")),ask:v.string(),
    operatorName:v.string(),operatorPhone:v.string(),founderName:v.optional(v.string()),founderPhone:v.optional(v.string()),founderRole:v.optional(v.string()),operatorRole:v.optional(v.string()),operatorCompany:v.optional(v.string()),introduced:v.optional(v.boolean()),founderOpenedAt:v.optional(v.number()),operatorOpenedAt:v.optional(v.number()),
    industry:v.optional(v.string()),topFeatures:v.optional(v.array(v.string())),pilotsDone:v.optional(v.string()),why:v.optional(v.string()),founderCompany:v.optional(v.string()),operatorLinkHash:v.optional(v.string()),encryptedCode:v.optional(v.string()),notifiedAt:v.optional(v.number()),paymentStatus:v.optional(v.union(v.literal("Free"),v.literal("Paid"),v.literal("Locked"))),paymentLabel:v.optional(v.string()),
  }),v.object({
    requestId:v.id("founderChoices"),founderId:v.string(),operatorId:v.string(),operatorNumber:v.union(v.number(),v.null()),requestedAt:v.number(),
    status:v.literal("Declined"),founderName:v.string(),operatorName:v.string(),declinedAt:v.number(),
  }))),continueCursor:v.string(),isDone:v.boolean()})),
  handler:async(ctx,args)=>{
    // Never read requests or contacts until this separate admin link is verified.
    const link=await ctx.db.query("adminLinks").withIndex("by_link_hash",q=>q.eq("linkHash",args.linkHash)).unique();
    if(!link||link.owner!=="Prabhat")return null;
    const page=await ctx.db.query("founderChoices").withIndex("by_status_updated_at",q=>q.eq("status","Requested")).order("desc")
      .paginate({...args.paginationOpts,numItems:Math.min(20,Math.max(1,args.paginationOpts.numItems))});
    const requests=[];
    for(const choice of page.page){
      const identity=await requestIdentity(ctx,choice);if(!identity)continue;
      const response=await currentResponse(ctx,choice,identity);
      const founder=await ctx.db.get(choice.founderId);
      const operator=await ctx.db.query("operators").withIndex("by_operator_id",q=>q.eq("operatorId",choice.operatorId)).unique();
      const search=await ctx.db.get(identity.searchId);
      const match=search?.matches?.find(match=>match.operatorId===choice.operatorId);
      if(!founder||!operator||search?.founderId!==founder._id||search.status!=="completed"||!match)continue;
      if(response?.status==="Not relevant"){
        requests.push({requestId:choice._id,founderId:founder.founderId,operatorId:choice.operatorId,operatorNumber:publicOperatorNumber(operator),
          requestedAt:identity.requestedAt,status:"Declined" as const,founderName:founder.name,
          operatorName:operator.name,declinedAt:response.updatedAt});
        continue;
      }
      const clean=(value:string)=>privateOpportunity(privateOpportunity(value,founder),operator);
      const present=(value:string|undefined)=>Boolean(value?.trim()&&!/^(not found|unknown|n\/a|none|-)$/i.test(value.trim()));
      const features=(founder.topFeatures??"").split(/\r?\n|;|[â€¢â—]/).map(value=>value.replace(/^\s*(?:[-*]|\d+[.)])\s*/,"").trim()).filter(value=>present(value)).slice(0,2);
      const pilots=(founder.pilotDone??"").trim();
      const operatorLink=await ctx.db.query("operatorLinks").withIndex("by_operator_id",q=>q.eq("operatorId",operator.operatorId)).unique();
      const secret=await ctx.db.query("operatorLinkSecrets").withIndex("by_operator_id",q=>q.eq("operatorId",operator.operatorId)).unique();
      const notification=await ctx.db.query("adminRequestNotifications").withIndex("by_request_identity",q=>q.eq("requestId",choice._id).eq("requestedAt",identity.requestedAt)).unique();
      const access=response?.status==="Interested"?await ctx.db.query("founderOperatorAccess").withIndex("by_founder_operator",q=>q.eq("founderId",founder._id).eq("operatorId",choice.operatorId)).unique():null;
      const allowance=await ctx.db.query("founderRevealAllowances").withIndex("by_founder",q=>q.eq("founderId",founder._id)).unique();
      const manual=response?.status==="Interested"?await ctx.db.query("adminIntroductions").withIndex("by_request_identity",q=>q.eq("requestId",choice._id).eq("requestedAt",identity.requestedAt)).unique():null;
      const paymentStatus=access?.free||access?.grandfathered||!access&&!allowance||!access&&allowance?.firstOperatorId===choice.operatorId?"Free" as const:access?.paidAt?"Paid" as const:"Locked" as const;
      requests.push({requestId:choice._id,founderId:founder.founderId,operatorId:choice.operatorId,operatorNumber:publicOperatorNumber(operator),requestedAt:identity.requestedAt,
        status:response?.status==="Interested"?"Accepted" as const:"Requested" as const,
        ask:clean(search.ask),operatorName:operator.name,operatorPhone:operator.whatsappNumber,founderCompany:founder.company,
        ...(operatorLink?{operatorLinkHash:operatorLink.linkHash}:{}),...(secret?{encryptedCode:secret.encryptedCode}:{}),...(notification?{notifiedAt:notification.notifiedAt}:{}),
        ...(response?.status==="Interested"?{founderName:founder.name,founderPhone:founder.whatsappNumber,founderRole:founder.currentRole,operatorRole:operator.currentRole,operatorCompany:operator.company,introduced:manual?.founderOpenedAt!==undefined&&(paymentStatus==="Paid"||manual?.operatorOpenedAt!==undefined),...(manual?.founderOpenedAt!==undefined?{founderOpenedAt:manual.founderOpenedAt}:{}),...(manual?.operatorOpenedAt!==undefined?{operatorOpenedAt:manual.operatorOpenedAt}:{}),paymentStatus,paymentLabel:paymentLabel(access,!access&&(!allowance||allowance.firstOperatorId===choice.operatorId))}:{}),
        ...(present(founder.industry)?{industry:clean(founder.industry)}:{}),
        ...(features.length?{topFeatures:features.map(clean)}:{}),
        ...(/^\d+(?:\s+pilots?(?:\s+(?:done|completed))?)?$/i.test(pilots)?{pilotsDone:pilots.match(/^\d+/)![0]}:{}),
        ...(present(match.why)?{why:revenueText(clean(match.why))}:{}),
      });
    }
    return {requests,continueCursor:page.continueCursor,isDone:page.isDone};
  },
});

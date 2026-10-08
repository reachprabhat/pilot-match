import {internalMutation,internalQuery} from "./_generated/server";
import {v} from "convex/values";
import {paginationOptsValidator} from "convex/server";
import {currentResponse} from "./lib/meetingResponses";
import {accessFor} from "./revealPayments";
import {publicOperatorNumber} from "./lib/operatorNumbers";
import {paymentLabel} from "./lib/paymentLabel";
import {firstName,whatsappUrl} from './lib/manualIntroduction';
export const roleValidator=v.union(v.literal("founder"),v.literal("operator"));
const rowValidator=v.object({requestId:v.id("founderChoices"),requestedAt:v.number(),status:v.union(v.literal("Requested"),v.literal("Accepted"),v.literal("Declined")),seen:v.literal(true),messageUrl:v.optional(v.string()),operatorFirstName:v.optional(v.string()),operatorId:v.optional(v.string()),operatorNumber:v.optional(v.union(v.number(),v.null())),paymentLabel:v.optional(v.string()),locked:v.optional(v.literal(true)),qrUrl:v.optional(v.union(v.string(),v.null()))});
// Acceptance reserves the existing free-first/payment allowance. No contacts or AI welcome are generated.
export const ensureAccepted=internalMutation({args:{requestId:v.id("founderChoices")},returns:v.null(),handler:async(ctx,args)=>{
  const choice=await ctx.db.get(args.requestId),response=choice?await currentResponse(ctx,choice):null;
  if(choice&&response?.status==="Interested")await accessFor(ctx,choice.founderId,choice.operatorId);
  return null;
}});
// Public personal-link replies contain statuses only, including old ready/paid introductions.
export const list=internalQuery({
  args:{linkHash:v.string(),role:roleValidator,paginationOpts:paginationOptsValidator},
  returns:v.union(v.null(),v.object({introductions:v.array(rowValidator),pending:v.boolean(),failed:v.boolean(),isDone:v.boolean(),continueCursor:v.string()})),
  handler:async(ctx,args)=>{
    const founder=args.role==="founder"?await ctx.db.query("founders").withIndex("by_link_hash",q=>q.eq("linkHash",args.linkHash)).unique():null;
    const link=args.role==="operator"?await ctx.db.query("operatorLinks").withIndex("by_link_hash",q=>q.eq("linkHash",args.linkHash)).unique():null;
    if(!founder&&!link)return null;
    if(link&&!await ctx.db.query("operators").withIndex("by_operator_id",q=>q.eq("operatorId",link.operatorId)).unique())return null;
    const page=founder?await ctx.db.query("operatorRequests").withIndex("by_founder",q=>q.eq("founderId",founder._id)).paginate(args.paginationOpts):await ctx.db.query("founderChoices").withIndex("by_operator_status",q=>q.eq("operatorId",link!.operatorId).eq("status","Requested")).paginate(args.paginationOpts);
    const introductions=[];
    for(const row of page.page){
      const choice=founder?await ctx.db.query("founderChoices").withIndex("by_founder_operator",q=>q.eq("founderId",founder._id).eq("operatorId",row.operatorId)).unique():row as import("./_generated/dataModel").Doc<"founderChoices">;
      if(!choice)continue;
      const operator=founder?await ctx.db.query("operators").withIndex("by_operator_id",q=>q.eq("operatorId",choice.operatorId)).unique():null;
      const label=founder?{operatorId:choice.operatorId,operatorNumber:operator?publicOperatorNumber(operator):null}:{};
      const response=await currentResponse(ctx,choice);
      if(response?.status!=="Interested"){
        if(founder)introductions.push({...label,requestId:choice._id,requestedAt:"requestedAt" in row?row.requestedAt:choice.updatedAt,status:response?.status==="Not relevant"?"Declined" as const:"Requested" as const,seen:true as const});
        continue;
      }
      let paymentInfo:{paymentLabel?:string;locked?:true;qrUrl?:string|null;messageUrl?:string;operatorFirstName?:string}={};
      if(founder){
        const access=await ctx.db.query("founderOperatorAccess").withIndex("by_founder_operator",q=>q.eq("founderId",founder._id).eq("operatorId",choice.operatorId)).unique();
        const allowance=await ctx.db.query("founderRevealAllowances").withIndex("by_founder",q=>q.eq("founderId",founder._id)).unique();
        const freeFallback=!access&&(!allowance||allowance.firstOperatorId===choice.operatorId);
        paymentInfo={paymentLabel:paymentLabel(access,freeFallback)};        const manual=await ctx.db.query('adminIntroductions').withIndex('by_request_identity',q=>q.eq('requestId',choice._id).eq('requestedAt',response.requestedAt)).unique();
        if(access?.paidAt&&!access.free&&manual?.founderOpenedAt!==undefined&&operator){
          const draft=await ctx.db.query('introductionDrafts').withIndex('by_identity',q=>q.eq('requestId',choice._id).eq('requestedAt',response.requestedAt).eq('kind','outreach')).unique();
          if(draft?.status==='ready')paymentInfo={...paymentInfo,messageUrl:whatsappUrl(operator.whatsappNumber,draft.message),operatorFirstName:firstName(operator.name)};
        }
        if(!access?.free&&!access?.paidAt&&!access?.grandfathered&&!freeFallback){
          const settings=await ctx.db.query("revealSettings").withIndex("by_key",q=>q.eq("key","payment")).unique();
          paymentInfo={...paymentInfo,locked:true,qrUrl:settings?await ctx.storage.getUrl(settings.qrStorageId):null};
        }
      }
      introductions.push({...label,...paymentInfo,requestId:choice._id,requestedAt:response.requestedAt,status:"Accepted" as const,seen:true as const});
    }
    return {introductions,pending:false,failed:false,isDone:page.isDone,continueCursor:page.continueCursor};
  },
});
// Old cached clients may still call this endpoint. Acknowledging it never reveals contacts or changes data.
export const seen=internalMutation({args:{linkHash:v.string(),role:roleValidator,requestId:v.id("founderChoices"),requestedAt:v.number()},returns:v.boolean(),handler:async(ctx,args)=>{
  const founder=args.role==="founder"?await ctx.db.query("founders").withIndex("by_link_hash",q=>q.eq("linkHash",args.linkHash)).unique():null;
  const link=args.role==="operator"?await ctx.db.query("operatorLinks").withIndex("by_link_hash",q=>q.eq("linkHash",args.linkHash)).unique():null;
  if(!founder&&!link)return false;
  const choice=await ctx.db.get(args.requestId);if(!choice||(founder?choice.founderId!==founder._id:choice.operatorId!==link!.operatorId))return false;
  const response=await currentResponse(ctx,choice);return response?.status==="Interested"&&response.requestedAt===args.requestedAt;
}});

import {internalMutation} from "./_generated/server";
import {internal} from "./_generated/api";
import {v} from "convex/values";
import {paginationOptsValidator} from "convex/server";
import {currentResponse} from "./lib/meetingResponses";
import {ensureAccess} from "./lib/revealAccess";

export const roleValidator=v.union(v.literal("founder"),v.literal("operator"));
const contactValidator=v.object({requestId:v.id("founderChoices"),requestedAt:v.number(),welcome:v.string(),name:v.string(),whatsappNumber:v.string(),company:v.optional(v.string()),location:v.optional(v.string()),seen:v.boolean()});
const lockedValidator=v.object({requestId:v.id("founderChoices"),requestedAt:v.number(),locked:v.literal(true),price:v.optional(v.number()),paymentLink:v.optional(v.string()),seen:v.literal(false)});
const known=(value:string)=>!/^\s*(?:not found|not provided|unknown|n\/?a|none|-)?\s*$/i.test(value);

export const ensureAccepted=internalMutation({
  args:{requestId:v.id("founderChoices")},returns:v.null(),
  handler:async(ctx,args)=>{
    const choice=await ctx.db.get(args.requestId),response=choice?await currentResponse(ctx,choice):null;
    if(!choice||response?.status!=="Interested")return null;
    await ensureAccess(ctx,choice);
    const existing=await ctx.db.query("introductions").withIndex("by_request_identity",q=>q.eq("requestId",choice._id).eq("requestedAt",response.requestedAt)).unique();
    if(!existing){
      const introductionId=await ctx.db.insert("introductions",{requestId:choice._id,searchId:response.searchId,requestedAt:response.requestedAt,founderId:choice.founderId,operatorId:choice.operatorId,status:"queued"});
      await ctx.scheduler.runAfter(0,internal.introductionWelcome.generate,{introductionId});
    }else if(existing.status==="queued"){
      await ctx.scheduler.runAfter(0,internal.introductionWelcome.generate,{introductionId:existing._id});
    }
    return null;
  },
});

// A link is checked before any request or contact is read. Raw codes never reach storage.
export const list=internalMutation({
  args:{linkHash:v.string(),role:roleValidator,paginationOpts:paginationOptsValidator},
  returns:v.union(v.null(),v.object({introductions:v.array(v.union(contactValidator,lockedValidator)),pending:v.boolean(),isDone:v.boolean(),continueCursor:v.string()})),
  handler:async(ctx,args)=>{
    const founder=args.role==="founder"?await ctx.db.query("founders").withIndex("by_link_hash",q=>q.eq("linkHash",args.linkHash)).unique():null;
    const operatorLink=args.role==="operator"?await ctx.db.query("operatorLinks").withIndex("by_link_hash",q=>q.eq("linkHash",args.linkHash)).unique():null;
    if(!founder&&!operatorLink)return null;
    const page=founder
      ?await ctx.db.query("founderChoices").withIndex("by_founder_status",q=>q.eq("founderId",founder._id).eq("status","Requested")).paginate(args.paginationOpts)
      :await ctx.db.query("founderChoices").withIndex("by_operator_status",q=>q.eq("operatorId",operatorLink!.operatorId).eq("status","Requested")).paginate(args.paginationOpts);
    const introductions=[];let pending=false;
    for(const choice of page.page){
      const response=await currentResponse(ctx,choice);
      if(response?.status!=="Interested")continue;
      const access=founder?await ensureAccess(ctx,choice):null;
      let intro=await ctx.db.query("introductions").withIndex("by_request_identity",q=>q.eq("requestId",choice._id).eq("requestedAt",response.requestedAt)).unique();
      if(!intro){
        const id=await ctx.db.insert("introductions",{requestId:choice._id,searchId:response.searchId,requestedAt:response.requestedAt,founderId:choice.founderId,operatorId:choice.operatorId,status:"queued"});
        await ctx.scheduler.runAfter(0,internal.introductionWelcome.generate,{introductionId:id});
        intro=await ctx.db.get(id);
      }
      if(!intro||intro.searchId!==response.searchId)continue;
      if(founder&&intro.founderSeenAt===undefined&&access?.status==="locked"){
        introductions.push({requestId:choice._id,requestedAt:response.requestedAt,locked:true as const,seen:false as const,...(access.price!==undefined?{price:access.price,paymentLink:access.paymentLink}:{})});continue;
      }
      if(intro.status!=="ready"||!intro.welcome){pending=true;continue;}
      const person=founder?await ctx.db.query("operators").withIndex("by_operator_id",q=>q.eq("operatorId",choice.operatorId)).unique():await ctx.db.get(choice.founderId);
      if(!person)continue;
      introductions.push({requestId:choice._id,requestedAt:response.requestedAt,welcome:intro.welcome,name:person.name,whatsappNumber:person.whatsappNumber,...(known(person.company)?{company:person.company}:{}),...(known(person.location)?{location:person.location}:{}),seen:(founder?intro.founderSeenAt:intro.operatorSeenAt)!==undefined});
    }
    return {introductions,pending,isDone:page.isDone,continueCursor:page.continueCursor};
  },
});

export const seen=internalMutation({
  args:{linkHash:v.string(),role:roleValidator,requestId:v.id("founderChoices"),requestedAt:v.number()},returns:v.boolean(),
  handler:async(ctx,args)=>{
    const founder=args.role==="founder"?await ctx.db.query("founders").withIndex("by_link_hash",q=>q.eq("linkHash",args.linkHash)).unique():null;
    const link=args.role==="operator"?await ctx.db.query("operatorLinks").withIndex("by_link_hash",q=>q.eq("linkHash",args.linkHash)).unique():null;
    if(!founder&&!link)return false;
    const choice=await ctx.db.get(args.requestId);
    if(!choice||(founder?choice.founderId!==founder._id:choice.operatorId!==link!.operatorId))return false;
    const response=await currentResponse(ctx,choice);
    if(response?.status!=="Interested"||response.requestedAt!==args.requestedAt)return false;
    const intro=await ctx.db.query("introductions").withIndex("by_request_identity",q=>q.eq("requestId",choice._id).eq("requestedAt",args.requestedAt)).unique();
    if(!intro||intro.status!=="ready"||intro.searchId!==response.searchId)return false;
    if(founder&&intro.founderSeenAt===undefined&&(await ensureAccess(ctx,choice)).status==="locked")return false;
    const field=founder?"founderSeenAt":"operatorSeenAt";
    if(intro[field]===undefined)await ctx.db.patch(intro._id,{[field]:Date.now()});
    return true;
  },
});

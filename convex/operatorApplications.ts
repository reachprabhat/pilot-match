import {internalMutation,internalQuery} from "./_generated/server";
import {paginationOptsValidator} from "convex/server";
import {v} from "convex/values";
import {applicationFields,applicationInput} from "./operatorApplicationValidators";
import {validateApplication,matchingProfile,consentText} from "./lib/operatorApplication";
import {internal} from "./_generated/api";
import {nextOperatorNumber} from "./lib/operatorNumbers";
import {revenueLabel} from "./lib/revenueLabels";

export const submit=internalMutation({
  args:{input:applicationInput,submissionId:v.string()},returns:v.object({applicationId:v.id("operatorApplications"),status:v.literal("Pending")}),
  handler:async(ctx,args)=>{
    const input=validateApplication(args.input);
    if(!/^[a-f0-9-]{36}$/.test(args.submissionId))throw Error("Invalid submission.");
    const existing=await ctx.db.query("operatorApplications").withIndex("by_submission_id",q=>q.eq("submissionId",args.submissionId)).unique();
    if(existing)return {applicationId:existing._id,status:"Pending" as const};
    const applicationId=await ctx.db.insert("operatorApplications",{...input,industrySelectionVersion:1,submissionId:args.submissionId,consentText,consentedAt:Date.now(),status:"Pending"});
    return {applicationId,status:"Pending" as const};
  },
});
export const list=internalQuery({
  args:{linkHash:v.string(),paginationOpts:paginationOptsValidator},
  returns:v.union(v.null(),v.object({applications:v.array(v.object({...applicationFields,applicationId:v.id("operatorApplications"),status:v.literal("Pending"),consentedAt:v.number(),consentText:v.string(),possibleDuplicate:v.boolean()})),continueCursor:v.string(),isDone:v.boolean()})),
  handler:async(ctx,args)=>{
    const owner=await ctx.db.query("adminLinks").withIndex("by_link_hash",q=>q.eq("linkHash",args.linkHash)).unique();
    if(owner?.owner!=="Prabhat")return null;
    const page=await ctx.db.query("operatorApplications").withIndex("by_status",q=>q.eq("status","Pending")).order("desc").paginate({...args.paginationOpts,numItems:Math.min(20,Math.max(1,args.paginationOpts.numItems))});
    const operators=await ctx.db.query("operators").withIndex("by_operator_id").take(501);
    const phone=(s:string)=>{const digits=s.replace(/\D/g,"");return digits.length===10?"91"+digits:digits;};
    const linkedin=(s:string)=>s.toLowerCase().replace(/\/$/,"");
    return {applications:page.page.map(row=>({applicationId:row._id,name:row.name,company:row.company,role:row.role,city:row.city,whatsapp:row.whatsapp,linkedin:row.linkedin,revenue:revenueLabel(row.revenue),preferences:row.preferences,industryOther:row.industryOther??"",areas:row.areas,painPoints:row.painPoints??"",consent:row.consent,status:"Pending" as const,consentedAt:row.consentedAt,consentText:row.consentText,
      possibleDuplicate:operators.some(op=>phone(op.whatsappNumber)===phone(row.whatsapp)||linkedin(op.sourceLink)===linkedin(row.linkedin))})),continueCursor:page.continueCursor,isDone:page.isDone};
  },
});
export const approve=internalMutation({
  args:{linkHash:v.string(),applicationId:v.id("operatorApplications"),newLinkHash:v.string(),encryptedLink:v.string()},returns:v.union(v.null(),v.object({status:v.literal("Approved"),operatorId:v.string()})),
  handler:async(ctx,args)=>{
    const owner=await ctx.db.query("adminLinks").withIndex("by_link_hash",q=>q.eq("linkHash",args.linkHash)).unique();
    if(owner?.owner!=="Prabhat")return null;
    const application=await ctx.db.get(args.applicationId);
    if(!application)return null;
    if(!/^[a-f0-9]{64}$/.test(args.newLinkHash)||!/^v1\.[A-Za-z0-9_-]{16}\.[A-Za-z0-9_-]{79}$/.test(args.encryptedLink))throw Error("Invalid protected link.");
    // Older Pending applications keep their original industry choices and approval behavior.
    const legacyIndustry=application.industrySelectionVersion!==1;
    const operatorId=application.operatorId??"joined-"+application._id;
    if(application.status!=="Approved"){
      const input=validateApplication(application,legacyIndustry);
      const operatorNumber=await nextOperatorNumber(ctx);
      await ctx.db.insert("operators",{operatorId,operatorNumber,...matchingProfile(input,legacyIndustry)});
      await ctx.db.patch(application._id,{status:"Approved",operatorId,approvedAt:Date.now()});
      await ctx.db.insert("operatorMatchJobs",{operatorId,status:"queued",providerCallCount:0});
      await ctx.scheduler.runAfter(0,internal.operatorApprovalMatching.run,{operatorId});
    }
    const existingLink=await ctx.db.query("operatorLinks").withIndex("by_operator_id",q=>q.eq("operatorId",operatorId)).unique();
    if(!existingLink){
      const duplicate=await ctx.db.query("operatorLinks").withIndex("by_link_hash",q=>q.eq("linkHash",args.newLinkHash)).unique();
      const founder=await ctx.db.query("founders").withIndex("by_link_hash",q=>q.eq("linkHash",args.newLinkHash)).unique();
      const admin=await ctx.db.query("adminLinks").withIndex("by_link_hash",q=>q.eq("linkHash",args.newLinkHash)).unique();
      if(duplicate||founder||admin)throw Error("Link already belongs to someone else.");
      await ctx.db.insert("operatorLinks",{operatorId,linkHash:args.newLinkHash});
      await ctx.db.insert("operatorLinkSecrets",{operatorId,encryptedCode:args.encryptedLink});
    }
    return {status:"Approved" as const,operatorId};
  },
});

export const approved=internalQuery({
  args:{linkHash:v.string(),paginationOpts:paginationOptsValidator},
  returns:v.union(v.null(),v.object({operators:v.array(v.object({applicationId:v.id("operatorApplications"),operatorId:v.string(),name:v.string(),company:v.string(),industry:v.string(),approvedAt:v.number(),whatsappNumber:v.string(),operatorLinkHash:v.optional(v.string()),encryptedCode:v.optional(v.string())})),continueCursor:v.string(),isDone:v.boolean()})),
  handler:async(ctx,args)=>{
    const owner=await ctx.db.query("adminLinks").withIndex("by_link_hash",q=>q.eq("linkHash",args.linkHash)).unique();if(owner?.owner!=="Prabhat")return null;
    const page=await ctx.db.query("operatorApplications").withIndex("by_status",q=>q.eq("status","Approved")).order("desc").paginate({...args.paginationOpts,numItems:Math.min(20,Math.max(1,args.paginationOpts.numItems))});
    const operators=[];
    for(const application of page.page){
      if(!application.operatorId)continue;
      const operator=await ctx.db.query("operators").withIndex("by_operator_id",q=>q.eq("operatorId",application.operatorId!)).unique();if(!operator)continue;
      const link=await ctx.db.query("operatorLinks").withIndex("by_operator_id",q=>q.eq("operatorId",operator.operatorId)).unique();
      const secret=await ctx.db.query("operatorLinkSecrets").withIndex("by_operator_id",q=>q.eq("operatorId",operator.operatorId)).unique();
      operators.push({applicationId:application._id,operatorId:operator.operatorId,name:operator.name,company:operator.company,industry:operator.industry,approvedAt:application.approvedAt??application._creationTime,whatsappNumber:operator.whatsappNumber,...(link?{operatorLinkHash:link.linkHash}:{}),...(secret?{encryptedCode:secret.encryptedCode}:{})});
    }
    return {operators,continueCursor:page.continueCursor,isDone:page.isDone};
  },
});

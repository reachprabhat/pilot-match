import {internalMutation,internalQuery} from "./_generated/server";
import {paginationOptsValidator} from "convex/server";
import {v} from "convex/values";
import {applicationFields,applicationInput} from "./operatorApplicationValidators";
import {validateApplication,matchingProfile,consentText} from "./lib/operatorApplication";

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
    return {applications:page.page.map(row=>({applicationId:row._id,name:row.name,company:row.company,role:row.role,city:row.city,whatsapp:row.whatsapp,linkedin:row.linkedin,revenue:row.revenue,preferences:row.preferences,industryOther:row.industryOther??"",areas:row.areas,painPoints:row.painPoints??"",consent:row.consent,status:"Pending" as const,consentedAt:row.consentedAt,consentText:row.consentText,
      possibleDuplicate:operators.some(op=>phone(op.whatsappNumber)===phone(row.whatsapp)||linkedin(op.sourceLink)===linkedin(row.linkedin))})),continueCursor:page.continueCursor,isDone:page.isDone};
  },
});
export const approve=internalMutation({
  args:{linkHash:v.string(),applicationId:v.id("operatorApplications")},returns:v.union(v.null(),v.object({status:v.literal("Approved"),operatorId:v.string()})),
  handler:async(ctx,args)=>{
    const owner=await ctx.db.query("adminLinks").withIndex("by_link_hash",q=>q.eq("linkHash",args.linkHash)).unique();
    if(owner?.owner!=="Prabhat")return null;
    const application=await ctx.db.get(args.applicationId);
    if(!application)return null;
    if(application.status==="Approved"&&application.operatorId)return {status:"Approved" as const,operatorId:application.operatorId};
    // Older Pending applications keep their original industry choices and approval behavior.
    const legacyIndustry=application.industrySelectionVersion!==1;
    const input=validateApplication(application,legacyIndustry),operatorId="joined-"+application._id;
    await ctx.db.insert("operators",{operatorId,...matchingProfile(input,legacyIndustry)});
    await ctx.db.patch(application._id,{status:"Approved",operatorId,approvedAt:Date.now()});
    return {status:"Approved" as const,operatorId};
  },
});

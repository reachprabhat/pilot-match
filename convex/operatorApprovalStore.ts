import {internalMutation,internalQuery} from "./_generated/server";
import {internal} from "./_generated/api";
import {v} from "convex/values";
import {prepareInput} from "./lib/matching";
import {excludedOperators,strongMatches,selectedSearch} from "./lib/fitList";
import {matchValidator} from "./matchingValidators";
const batchFounder=v.object({founderId:v.id("founders"),searchId:v.id("founderSearches"),ask:v.string(),profileText:v.string(),excludedOperatorIds:v.array(v.string())});
export const begin=internalMutation({args:{operatorId:v.string()},returns:v.union(v.null(),v.object({jobId:v.id("operatorMatchJobs"),operator:v.object({operatorId:v.string(),profileText:v.string()}),operators:v.array(v.object({operatorId:v.string(),profileText:v.string()})),founders:v.array(batchFounder),privateNames:v.array(v.string()),privatePhones:v.array(v.string())})),handler:async(ctx,args)=>{
 const job=await ctx.db.query("operatorMatchJobs").withIndex("by_operator",q=>q.eq("operatorId",args.operatorId)).unique();if(!job||job.status!=="queued")return null;
 const operator=await ctx.db.query("operators").withIndex("by_operator_id",q=>q.eq("operatorId",args.operatorId)).unique();if(!operator)return null;
 const founders=await ctx.db.query("founders").withIndex("by_founder_id").take(501);if(founders.length>500){await ctx.db.patch(job._id,{status:"failed"});return null;}
 const allOperators=await ctx.db.query("operators").withIndex("by_operator_id").take(501);if(allOperators.length>500){await ctx.db.patch(job._id,{status:"failed"});return null;}
 const ordered=[operator,...allOperators.filter(r=>r.operatorId!==operator.operatorId)],people=[...ordered,...founders],batch=[];let profiles:{operatorId:string;profileText:string}[]=[];
 for(const founder of founders){const search=await selectedSearch(ctx,founder),excluded=await excludedOperators(ctx,founder._id);if(!search?.ask||excluded.has(args.operatorId))continue;
 const safe=prepareInput(founder,people,search.ask);profiles=safe.operators.slice(0,ordered.length);batch.push({founderId:founder._id,searchId:search._id,ask:safe.ask,profileText:safe.founder.profileText,excludedOperatorIds:[...excluded]});}
 if(!batch.length){await ctx.db.patch(job._id,{status:"ready",providerCallCount:0});return null;}
 const recent=await ctx.db.query("aiCalls").withIndex("by_started_at",q=>q.gte("startedAt",Date.now()-3600000)).take(100);
 if(recent.length>=100){await ctx.scheduler.runAfter(60000,internal.operatorApprovalMatching.run,args);return null;}
 const callId=await ctx.db.insert("aiCalls",{operatorId:args.operatorId,startedAt:Date.now(),purpose:"operator_approval_matching"});await ctx.db.patch(job._id,{status:"running",callId,providerCallCount:1,founderCount:batch.length});
 return {jobId:job._id,operator:profiles[0],operators:profiles,founders:batch,privateNames:people.map(p=>p.name),privatePhones:people.map(p=>p.whatsappNumber)};
}});
export const finish=internalMutation({args:{jobId:v.id("operatorMatchJobs"),responseId:v.optional(v.string()),results:v.optional(v.array(v.object({founderId:v.id("founders"),searchId:v.id("founderSearches"),score:v.number(),why:v.string(),best:v.array(matchValidator)})))},returns:v.null(),handler:async(ctx,args)=>{
 const job=await ctx.db.get(args.jobId);if(!job||job.status!=="running")return null;
 if(!args.results){await ctx.db.patch(job._id,{status:"failed"});return null;}
 for(const result of args.results){if(!Number.isInteger(result.score)||result.score<0||result.score>100)throw Error("Invalid score");
 const founder=await ctx.db.get(result.founderId),search=await ctx.db.get(result.searchId);if(!founder||!search||(await selectedSearch(ctx,founder))?._id!==search._id||(await excludedOperators(ctx,founder._id)).has(job.operatorId))continue;
 const excluded=await excludedOperators(ctx,founder._id),pool=new Map((search.matches??[]).filter(r=>excluded.has(r.operatorId)).map(r=>[r.operatorId,r]));
 for(const match of result.best)if(!excluded.has(match.operatorId))pool.set(match.operatorId,{...match,why:match.operatorId===job.operatorId?result.why:search.matches?.find(r=>r.operatorId===match.operatorId)?.why??'Estimated fit from your saved ask and this operator’s profile.'});
 pool.set(job.operatorId,{operatorId:job.operatorId,score:result.score,why:result.why});const matches=[...pool.values()];await ctx.db.patch(search._id,{originalMatches:search.originalMatches??search.matches??[],matches,candidateVersion:(search.candidateVersion??0)+1});
 if((await strongMatches(ctx,founder._id,search.originalMatches??search.matches??[])).slice(0,2).some(r=>r.operatorId===job.operatorId)){
 const existing=await ctx.db.query("founderMatchNotifications").withIndex("by_founder_operator",q=>q.eq("founderId",founder._id).eq("operatorId",job.operatorId)).unique();if(!existing)await ctx.db.insert("founderMatchNotifications",{founderId:founder._id,operatorId:job.operatorId,searchId:search._id,score:result.score,createdAt:Date.now()});
 }}await ctx.db.patch(job._id,{status:"ready",responseId:args.responseId});return null;
}});
export const saveFounderSecret=internalMutation({args:{linkHash:v.string(),founderId:v.id("founders"),encryptedCode:v.string()},returns:v.boolean(),handler:async(ctx,args)=>{
 if((await ctx.db.query("adminLinks").withIndex("by_link_hash",q=>q.eq("linkHash",args.linkHash)).unique())?.owner!=="Prabhat")return false;
 if(!await ctx.db.get(args.founderId)||!/^v1\.[A-Za-z0-9_-]{16}\.[A-Za-z0-9_-]{79}$/.test(args.encryptedCode))throw Error("Invalid founder link");
 const existing=await ctx.db.query("founderLinkSecrets").withIndex("by_founder",q=>q.eq("founderId",args.founderId)).unique();if(!existing)await ctx.db.insert("founderLinkSecrets",{founderId:args.founderId,encryptedCode:args.encryptedCode});return true;
}});
export const notifications=internalQuery({args:{linkHash:v.string()},returns:v.union(v.null(),v.object({jobs:v.array(v.object({operatorId:v.string(),status:v.string(),providerCallCount:v.number()})),founders:v.array(v.object({notificationId:v.id("founderMatchNotifications"),operatorId:v.string(),operatorName:v.string(),founderId:v.id("founders"),name:v.string(),company:v.string(),whatsappNumber:v.string(),score:v.number(),linkHash:v.optional(v.string()),encryptedCode:v.optional(v.string())}))})),handler:async(ctx,args)=>{
 if((await ctx.db.query("adminLinks").withIndex("by_link_hash",q=>q.eq("linkHash",args.linkHash)).unique())?.owner!=="Prabhat")return null;
 const notifications=await ctx.db.query("founderMatchNotifications").withIndex("by_operator").take(501);if(notifications.length>500)throw Error("Notification list unavailable");const rows=[];
 for(const notification of notifications){const founder=await ctx.db.get(notification.founderId),operator=await ctx.db.query("operators").withIndex("by_operator_id",q=>q.eq("operatorId",notification.operatorId)).unique();if(!founder||!operator)continue;
 const search=await selectedSearch(ctx,founder);if(search?._id!==notification.searchId||!(await strongMatches(ctx,founder._id,search.originalMatches??search.matches??[])).slice(0,2).some(r=>r.operatorId===operator.operatorId))continue;
 const secret=await ctx.db.query("founderLinkSecrets").withIndex("by_founder",q=>q.eq("founderId",founder._id)).unique();rows.push({notificationId:notification._id,operatorId:operator.operatorId,operatorName:operator.name,founderId:founder._id,name:founder.name,company:founder.company,whatsappNumber:founder.whatsappNumber,score:notification.score,linkHash:founder.linkHash,...(secret?{encryptedCode:secret.encryptedCode}:{})});}
 const jobs=await ctx.db.query("operatorMatchJobs").withIndex("by_operator").take(501);if(jobs.length>500)throw Error("Approval list unavailable");return {founders:rows,jobs:jobs.map(j=>({operatorId:j.operatorId,status:j.status,providerCallCount:j.providerCallCount??0}))};
}});

import {internalMutation,type MutationCtx} from './_generated/server';
import {v} from 'convex/values';
import type {Id} from './_generated/dataModel';
import {currentResponse} from './lib/meetingResponses';
import {accessFor} from './revealPayments';
import {compose,templateParts,validateProse,type Kind} from './lib/manualIntroduction';
import {privateOpportunity} from './lib/opportunity';
import {plainIntroductionText} from './lib/introductionLanguage';
export const kind=v.union(v.literal('founder'),v.literal('operator'),v.literal('outreach'));
type Identity={linkHash:string;requestId:Id<'founderChoices'>;requestedAt:number;kind:Kind};
async function acceptedProfile(ctx:MutationCtx,args:Identity){
  if((await ctx.db.query('adminLinks').withIndex('by_link_hash',q=>q.eq('linkHash',args.linkHash)).unique())?.owner!=='Prabhat')return null;
  const choice=await ctx.db.get(args.requestId),response=choice?await currentResponse(ctx,choice):null;
  if(!choice||response?.status!=='Interested'||response.requestedAt!==args.requestedAt)return null;
  const search=await ctx.db.get(response.searchId),match=search?.matches?.find(m=>m.operatorId===choice.operatorId);
  if(search?.founderId!==choice.founderId||search.status!=='completed'||!match)return null;
  const founder=await ctx.db.get(choice.founderId),operator=await ctx.db.query('operators').withIndex('by_operator_id',q=>q.eq('operatorId',choice.operatorId)).unique();
  return founder&&operator?{founder,operator,search,match}:null;
}
export async function context(ctx:MutationCtx,args:Identity){
  const input=await acceptedProfile(ctx,args);if(!input)return null;
  const access=await accessFor(ctx,input.founder._id,input.operator.operatorId);
  if(!access.free&&!access.paidAt&&!access.grandfathered)return null;
  const free=access.free||Boolean(access.grandfathered&&!access.paidAt);
  if(args.kind==='operator'&&!free||args.kind==='outreach'&&free)return null;
  return {...input,free};
}
export const reserve=internalMutation({args:{linkHash:v.string(),requestId:v.id('founderChoices'),requestedAt:v.number(),kind,rebuild:v.optional(v.literal(true))},returns:v.union(v.null(),v.object({id:v.id('introductionDrafts'),claimed:v.boolean(),ready:v.boolean(),message:v.string(),profileText:v.optional(v.string())})),handler:async(ctx,args)=>{
  // Only the private owner-authorized regeneration may prepare unused kinds. Sending still uses context/payment guards.
  const input=args.rebuild?await acceptedProfile(ctx,args):await context(ctx,args);if(!input)return null;
  let row=await ctx.db.query('introductionDrafts').withIndex('by_identity',q=>q.eq('requestId',args.requestId).eq('requestedAt',args.requestedAt).eq('kind',args.kind)).unique();
  if(row&&(!args.rebuild||row.copyVersion===3&&validateProse(row.message,row.kind))){
    if(row.status==='running'&&Date.now()-row.startedAt>60000){await ctx.db.patch(row._id,{status:'ready'});row=await ctx.db.get(row._id);}
    return {ready:row!.status==='ready',message:row!.message,id:row!._id,claimed:false};
  }
  if(row?.status==='running')throw Error('Wait for the existing draft before rebuilding.');
  const parts=templateParts(input.founder,input.search.ask,input.match.why),message=compose(input.founder,input.operator,args.kind,parts);
  const calls=await ctx.db.query('aiCalls').withIndex('by_started_at',q=>q.gte('startedAt',Date.now()-3600000)).take(100);
  const callId=calls.length<100?await ctx.db.insert('aiCalls',{startedAt:Date.now(),purpose:'introduction_draft',founderId:input.founder._id,operatorId:input.operator.operatorId}):undefined;
  const fields={message,status:callId?'running' as const:'ready' as const,source:'template' as const,startedAt:Date.now(),copyVersion:3 as const};
  let id:Id<'introductionDrafts'>;
  if(row){id=row._id;await ctx.db.patch(id,{...fields,callId,providerCalled:undefined});}
  else id=await ctx.db.insert('introductionDrafts',{requestId:args.requestId,requestedAt:args.requestedAt,kind:args.kind,...fields,...(callId?{callId}:{})});
  const clean=(s:string)=>plainIntroductionText(privateOpportunity(privateOpportunity(s??'',input.founder),input.operator)).slice(0,2200);
  return {id,claimed:Boolean(callId),ready:!callId,message,profileText:JSON.stringify({kind:args.kind,product:clean(parts.product),pilot:clean(parts.pilot),why:clean(parts.why),operatorRole:clean(input.operator.currentRole),operatorAbout:clean(input.operator.about),identityWordCount:input.operator.currentRole.trim().split(/\s+/).length+input.operator.company.trim().split(/\s+/).length+input.founder.company.trim().split(/\s+/).length})};
}});
export const providerCall=internalMutation({args:{id:v.id('introductionDrafts')},returns:v.boolean(),handler:async(ctx,{id})=>{const row=await ctx.db.get(id);if(!row||row.status!=='running'||row.providerCalled)return false;await ctx.db.patch(id,{providerCalled:true});return true;}});
export const finish=internalMutation({args:{id:v.id('introductionDrafts'),paragraphs:v.optional(v.array(v.string()))},returns:v.null(),handler:async(ctx,args)=>{
  const row=await ctx.db.get(args.id);if(!row||row.status!=='running')return null;
  const choice=await ctx.db.get(row.requestId),founder=choice?await ctx.db.get(choice.founderId):null,operator=choice?await ctx.db.query('operators').withIndex('by_operator_id',q=>q.eq('operatorId',choice.operatorId)).unique():null;
  let message:string|undefined;
  if(args.paragraphs&&founder&&operator)try{message=compose(founder,operator,row.kind,{product:'',pilot:'',why:'',nextStep:'',paragraphs:args.paragraphs});}catch{/* Preserve the already-saved clean fallback. */}
  await ctx.db.patch(row._id,{status:'ready',...(message?{message,source:'ai' as const}:{})});return null;
}});
export const mode=internalMutation({args:{linkHash:v.string(),requestId:v.id('founderChoices'),requestedAt:v.number()},returns:v.union(v.null(),v.boolean()),handler:async(ctx,args)=>{const input=await context(ctx,{...args,kind:'founder'});return input?input.free:null;}});

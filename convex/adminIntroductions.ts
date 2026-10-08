import {internalMutation,httpAction} from './_generated/server';
import {internal} from './_generated/api';
import {v} from 'convex/values';
import {context} from './introductionDraftStore';
import {hashCode} from './lib/operatorLinkSecrets';
import {whatsappUrl} from './lib/manualIntroduction';
export const mark=internalMutation({args:{linkHash:v.string(),requestId:v.id('founderChoices'),requestedAt:v.number(),recipient:v.union(v.literal('founder'),v.literal('operator'))},returns:v.union(v.null(),v.object({url:v.string(),message:v.string(),introduced:v.boolean(),founderOpenedAt:v.optional(v.number()),operatorOpenedAt:v.optional(v.number())})),handler:async(ctx,args)=>{
 const input=await context(ctx,{...args,kind:args.recipient});if(!input)return null;
 const draft=await ctx.db.query('introductionDrafts').withIndex('by_identity',q=>q.eq('requestId',args.requestId).eq('requestedAt',args.requestedAt).eq('kind',args.recipient)).unique();
 const outreach=!input.free?await ctx.db.query('introductionDrafts').withIndex('by_identity',q=>q.eq('requestId',args.requestId).eq('requestedAt',args.requestedAt).eq('kind','outreach')).unique():null;
 if(!draft||draft.status!=='ready'||!input.free&&outreach?.status!=='ready')return null;
 const url=whatsappUrl(args.recipient==='founder'?input.founder.whatsappNumber:input.operator.whatsappNumber,draft.message);
 let row=await ctx.db.query('adminIntroductions').withIndex('by_request_identity',q=>q.eq('requestId',args.requestId).eq('requestedAt',args.requestedAt)).unique();const field=args.recipient==='founder'?'founderOpenedAt':'operatorOpenedAt';
 if(!row){const id=await ctx.db.insert('adminIntroductions',{requestId:args.requestId,requestedAt:args.requestedAt,[field]:Date.now()});row=await ctx.db.get(id);}else if(row[field]===undefined){await ctx.db.patch(row._id,{[field]:Date.now()});row=await ctx.db.get(row._id);}
 return {url,message:draft.message,introduced:row!.founderOpenedAt!==undefined&&(!input.free||row!.operatorOpenedAt!==undefined),...(row!.founderOpenedAt!==undefined?{founderOpenedAt:row!.founderOpenedAt}:{}),...(row!.operatorOpenedAt!==undefined?{operatorOpenedAt:row!.operatorOpenedAt}:{})};
}});
export const http=httpAction(async(ctx,request)=>{
 const headers={'Content-Type':'application/json','Cache-Control':'no-store','Referrer-Policy':'no-referrer'};const reply=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers});
 try{const text=await request.text();if(text.length>2048)return reply({error:'Invalid request.'},400);const body=JSON.parse(text);
 if(typeof body.code!=='string'||!/^[A-Za-z0-9_-]{43}$/.test(body.code))return reply({error:'Access denied.'},404);
 if(typeof body.requestId!=='string'||!Number.isFinite(body.requestedAt)||!['founder','operator'].includes(body.recipient))return reply({error:'Invalid request.'},400);
 const args={linkHash:await hashCode(body.code),requestId:body.requestId,requestedAt:body.requestedAt};
 if(!await ctx.runAction(internal.introductionDraftAI.ensure,{...args,kind:body.recipient}))return reply({error:'Confirm payment or wait a moment and try again.'},409);
 // Paid requests need their saved founder-voice draft ready before exposing the button.
 const free=await ctx.runMutation(internal.introductionDraftStore.mode,args);
 const paid=free===false;
 if(paid&&!await ctx.runAction(internal.introductionDraftAI.ensure,{...args,kind:'outreach'}))return reply({error:'The message is being prepared. Tap again shortly.'},409);
 const result=await ctx.runMutation(internal.adminIntroductions.mark,{...args,recipient:body.recipient});return result?reply(result):reply({error:'Confirm payment and refresh this accepted request before introducing.'},409);
 }catch{return reply({error:'Could not open the introduction. Try again.'},503);}
});

import {httpAction} from "./_generated/server";
import {internal} from "./_generated/api";
import {hashCode,decryptCode} from "./lib/operatorLinkSecrets";
export const http=httpAction(async(ctx,request)=>{
 const headers={"Content-Type":"application/json","Cache-Control":"no-store","Referrer-Policy":"no-referrer"};const reply=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers});
 try{const text=await request.text();if(text.length>4096)return reply({error:"Invalid request."},400);const body=JSON.parse(text);if(typeof body.code!=="string"||!/^[A-Za-z0-9_-]{43}$/.test(body.code))return reply({error:"Access denied."},404);
 const linkHash=await hashCode(body.code);if(!await ctx.runQuery(internal.revealPayments.owner,{linkHash}))return reply({error:"Access denied."},404);
 const path=new URL(request.url).pathname;
 if(path.endsWith("/payment-upload"))return reply({uploadUrl:await ctx.runMutation(internal.revealPayments.upload,{linkHash})});
 if(path.endsWith("/payment-save")){if(typeof body.storageId!=="string")return reply({error:"Invalid QR."},400);return reply({saved:await ctx.runMutation(internal.revealPayments.saveQr,{linkHash,storageId:body.storageId})});}
 if(path.endsWith("/mark-paid")){if(typeof body.requestId!=="string"||!Number.isFinite(body.requestedAt))return reply({error:"Invalid request."},400);const saved=await ctx.runMutation(internal.revealPayments.markPaid,{linkHash,requestId:body.requestId,requestedAt:body.requestedAt});if(!saved)return reply({error:"This request is no longer accepted."},409);const label=await ctx.runQuery(internal.revealPayments.label,{linkHash,requestId:body.requestId,requestedAt:body.requestedAt});return reply({paid:true,...label});}
 if(path.endsWith("/founder-matches")){const result=await ctx.runQuery(internal.operatorApprovalStore.notifications,{linkHash});if(!result)return reply({error:"Access denied."},404);const founders=[];for(const row of result.founders){const {encryptedCode,linkHash:founderHash,...fields}=row;const code=encryptedCode&&founderHash?await decryptCode(body.code,'founder:'+row.founderId,encryptedCode,founderHash):null;founders.push({...fields,founderLink:code?new URL('/?screen=results#f='+code,request.url).href:null});}return reply({...result,founders});}
 return reply(await ctx.runQuery(internal.revealPayments.settings,{linkHash}));
 }catch{return reply({error:"Could not save or load. Try again in a few minutes."},503);}
});

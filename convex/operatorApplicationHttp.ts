import {httpAction} from "./_generated/server";
import {internal} from "./_generated/api";
import {validateApplication,pilotPreferences,helpAreas,revenueRanges,consentText} from "./lib/operatorApplication";
import {proposedLink,decryptCode} from "./lib/operatorLinkSecrets";
import {revenueLabels} from "./lib/revenueLabels";
const headers={"Content-Type":"application/json","Cache-Control":"no-store","Referrer-Policy":"no-referrer"};
const reply=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers});
export const options=httpAction(async()=>reply({pilotPreferences,helpAreas,revenueRanges,revenueLabels,consentText}));
export const submit=httpAction(async(ctx,request)=>{
  try{
    if(Number(request.headers.get("content-length"))>8192)return reply({error:"Check your answers and try again."},400);
    const text=await request.text();if(text.length>8192)return reply({error:"Check your answers and try again."},400);
    let body,input;try{body=JSON.parse(text);input=validateApplication(body);if(typeof body.submissionId!=="string"||!/^[a-f0-9-]{36}$/.test(body.submissionId))throw Error("Reload the page and try again.");}catch(error){return reply({error:error instanceof Error?error.message:"Check your answers and try again."},400);}
    await ctx.runMutation(internal.operatorApplications.submit,{input,submissionId:body.submissionId});
    // Do not return application IDs, profiles, links or existing contacts to the public.
    return reply({status:"Pending"});
  }catch{return reply({error:"Could not submit. Try again in a few minutes."},503);}
});
export const admin=httpAction(async(ctx,request)=>{
  try{
    const text=await request.text();if(text.length>2048)return reply({error:"Invalid request."},400);
    let body;try{body=JSON.parse(text);}catch{return reply({error:"Invalid request."},400);}
    if(typeof body?.code!=="string"||!/^[A-Za-z0-9_-]{43}$/.test(body.code))return reply({error:"Access denied."},404);
    const digest=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(body.code)),linkHash=Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,"0")).join("");
    if(new URL(request.url).pathname.endsWith("/approve")){
      if(typeof body.applicationId!=="string"||body.applicationId.length>100)return reply({error:"Invalid application."},400);
      const result=await ctx.runMutation(internal.operatorApplications.approve,{linkHash,applicationId:body.applicationId,...await proposedLink(body.code,"joined-"+body.applicationId)});
      if(!result)return reply({error:"Access denied or application unavailable."},404);
      const [operatorNumber]=await ctx.runQuery(internal.operatorNumbers.labels,{operatorIds:[result.operatorId]});
      return reply({...result,operatorNumber});
    }
    if(body.cursor!=null&&(typeof body.cursor!=="string"||body.cursor.length>1500))return reply({error:"Invalid request."},400);
    if(new URL(request.url).pathname.endsWith("/approved-operators")){
      let result=await ctx.runQuery(internal.operatorApplications.approved,{linkHash,paginationOpts:{numItems:20,cursor:body.cursor??null}});
      if(!result)return reply({error:"Access denied."},404);
      // Older approved applications may predate automatic link creation. Preserve all existing links.
      for(const operator of result.operators)if(!operator.operatorLinkHash)await ctx.runMutation(internal.operatorApplications.approve,{linkHash,applicationId:operator.applicationId,...await proposedLink(body.code,operator.operatorId)});
      result=await ctx.runQuery(internal.operatorApplications.approved,{linkHash,paginationOpts:{numItems:20,cursor:body.cursor??null}});
      if(!result)return reply({error:"Access denied."},404);
      const operators=[];for(const operator of result.operators){const {encryptedCode,operatorLinkHash,...fields}=operator;const code=encryptedCode&&operatorLinkHash?await decryptCode(body.code,operator.operatorId,encryptedCode,operatorLinkHash):null;operators.push({...fields,requestsLink:code?new URL("/operator.html#o="+code,request.url).href:null});}
      return reply({...result,operators});
    }
    const result=await ctx.runQuery(internal.operatorApplications.list,{linkHash,paginationOpts:{numItems:20,cursor:body.cursor??null}});
    return result?reply(result):reply({error:"Access denied."},404);
  }catch{return reply({error:"Busy right now. Try again in a few minutes."},503);}
});

import {internalMutation,internalQuery,httpAction} from "./_generated/server";
import {internal} from "./_generated/api";
import {v} from "convex/values";
import type {MutationCtx,QueryCtx} from "./_generated/server";
import type {Id} from "./_generated/dataModel";
import {currentResponse} from "./lib/meetingResponses";
import {ensureAccess} from "./lib/revealAccess";

const owner=(ctx:QueryCtx,linkHash:string)=>ctx.db.query("adminLinks").withIndex("by_link_hash",q=>q.eq("linkHash",linkHash)).unique();
const settingValidator=v.object({price:v.number(),paymentLink:v.string()});
const accessValidator=v.object({status:v.union(v.literal("free"),v.literal("grandfathered"),v.literal("locked"),v.literal("paid")),price:v.optional(v.number()),paymentLink:v.optional(v.string()),paidAt:v.optional(v.number())});
const args={linkHash:v.string(),requestId:v.id("founderChoices"),requestedAt:v.number()};
async function accepted(ctx:MutationCtx,requestId:Id<"founderChoices">,requestedAt:number){
  const choice=await ctx.db.get(requestId);if(!choice)return null;
  const response=await currentResponse(ctx,choice);
  if(response?.status!=="Interested"||response.requestedAt!==requestedAt)return null;
  const search=await ctx.db.get(response.searchId);
  if(search?.founderId!==choice.founderId||search.status!=="completed"||!search.matches?.some(row=>row.operatorId===choice.operatorId))return null;
  return choice;
}
export const settings=internalQuery({args:{linkHash:v.string()},returns:v.union(v.null(),v.object({settings:v.union(v.null(),settingValidator)})),handler:async(ctx,args)=>{
  const link=await owner(ctx,args.linkHash);if(link?.owner!=="Prabhat")return null;
  const row=await ctx.db.query("revealSettings").withIndex("by_key",q=>q.eq("key","founder_reveals")).unique();
  return {settings:row?{price:row.price,paymentLink:row.paymentLink}:null};
}});
export const saveSettings=internalMutation({args:{linkHash:v.string(),price:v.number(),paymentLink:v.string()},returns:v.union(v.null(),settingValidator),handler:async(ctx,args)=>{
  const link=await owner(ctx,args.linkHash);if(link?.owner!=="Prabhat")return null;
  if(!Number.isFinite(args.price)||args.price<=0||args.price>10000000||Math.abs(args.price*100-Math.round(args.price*100))>0.000001)throw new Error("Enter a positive rupee amount with at most two decimal places.");
  const paymentLink=args.paymentLink.trim();let url;try{url=new URL(paymentLink);}catch{throw new Error("Enter a valid HTTPS payment link.");}
  if(url.protocol!=="https:"||url.username||url.password||paymentLink.length>2000)throw new Error("Enter a valid HTTPS payment link.");
  const fields={price:args.price,paymentLink,updatedAt:Date.now()};
  const existing=await ctx.db.query("revealSettings").withIndex("by_key",q=>q.eq("key","founder_reveals")).unique();
  if(existing)await ctx.db.patch(existing._id,fields);else await ctx.db.insert("revealSettings",{key:"founder_reveals",...fields});
  return {price:fields.price,paymentLink};
}});
export const requestAccess=internalMutation({args,returns:v.union(v.null(),accessValidator),handler:async(ctx,args)=>{
  const link=await owner(ctx,args.linkHash);if(link?.owner!=="Prabhat")return null;
  const choice=await accepted(ctx,args.requestId,args.requestedAt);if(!choice)return null;
  const access=await ensureAccess(ctx,choice);
  return {status:access.status,...(access.price!==undefined?{price:access.price,paymentLink:access.paymentLink}:{}),...(access.paidAt!==undefined?{paidAt:access.paidAt}:{})};
}});
export const markPaid=internalMutation({args,returns:v.union(v.null(),v.object({paidAt:v.number()})),handler:async(ctx,args)=>{
  const link=await owner(ctx,args.linkHash);if(link?.owner!=="Prabhat")return null;
  const choice=await accepted(ctx,args.requestId,args.requestedAt);if(!choice)return null;
  const access=await ensureAccess(ctx,choice);
  if(access.status==="paid")return {paidAt:access.paidAt!};
  if(access.status!=="locked"||access.price===undefined||!access.paymentLink)return null;
  const paidAt=Date.now();await ctx.db.patch(access._id,{status:"paid",paidAt,paidRequestId:choice._id,paidRequestedAt:args.requestedAt});return {paidAt};
}});
export const http=httpAction(async(ctx,request)=>{
  const headers={"Content-Type":"application/json","Cache-Control":"no-store","Referrer-Policy":"no-referrer"};
  const reply=(body:unknown,status:number)=>new Response(JSON.stringify(body),{status,headers});
  try{
    if(Number(request.headers.get("content-length"))>4096)return reply({error:"Invalid request."},400);
    const text=await request.text();if(text.length>4096)return reply({error:"Invalid request."},400);
    let body;try{body=JSON.parse(text);}catch{return reply({error:"Invalid request."},400);}
    if(typeof body?.code!=="string"||!/^[A-Za-z0-9_-]{43}$/.test(body.code))return reply({error:"Access denied."},404);
    const digest=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(body.code));const linkHash=Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,"0")).join("");
    const allowed=await ctx.runQuery(internal.revealPayments.settings,{linkHash});if(!allowed)return reply({error:"Access denied."},404);
    const path=new URL(request.url).pathname;
    if(path.endsWith("/mark-paid")){
      if(typeof body.requestId!=="string"||body.requestId.length>100||!Number.isFinite(body.requestedAt))return reply({error:"Invalid request."},400);
      const result=await ctx.runMutation(internal.revealPayments.markPaid,{linkHash,requestId:body.requestId,requestedAt:body.requestedAt});return result?reply(result,200):reply({error:"This request is no longer locked and accepted."},409);
    }
    if(path.endsWith("/save")){
      if(typeof body.price!=="number"||typeof body.paymentLink!=="string")return reply({error:"Enter the price and payment link."},400);
      try{const result=await ctx.runMutation(internal.revealPayments.saveSettings,{linkHash,price:body.price,paymentLink:body.paymentLink});return reply({settings:result},200);}catch{return reply({error:"Use a positive price with at most two decimal places and a valid HTTPS payment link."},400);}
    }
    return reply(allowed,200);
  }catch{return reply({error:"Busy right now. Try again in a few minutes."},503);}
});

import {internalMutation,httpAction} from "./_generated/server";
import {internal} from "./_generated/api";
import {v} from "convex/values";
import {requestIdentity,currentResponse} from "./lib/meetingResponses";
import {hashCode} from "./lib/operatorLinkSecrets";
export const mark=internalMutation({
  args:{linkHash:v.string(),requestId:v.id("founderChoices"),requestedAt:v.number()},returns:v.union(v.null(),v.object({notifiedAt:v.number()})),
  handler:async(ctx,args)=>{
    const owner=await ctx.db.query("adminLinks").withIndex("by_link_hash",q=>q.eq("linkHash",args.linkHash)).unique();if(owner?.owner!=="Prabhat")return null;
    const choice=await ctx.db.get(args.requestId);if(!choice||choice.status!=="Requested")return null;
    const identity=await requestIdentity(ctx,choice);if(!identity||identity.requestedAt!==args.requestedAt||await currentResponse(ctx,choice,identity))return null;
    const search=await ctx.db.get(identity.searchId);if(search?.founderId!==choice.founderId||search.status!=="completed"||!search.matches?.some(match=>match.operatorId===choice.operatorId))return null;
    const existing=await ctx.db.query("adminRequestNotifications").withIndex("by_request_identity",q=>q.eq("requestId",args.requestId).eq("requestedAt",args.requestedAt)).unique();
    if(existing)return {notifiedAt:existing.notifiedAt};
    const notifiedAt=Date.now();await ctx.db.insert("adminRequestNotifications",{requestId:args.requestId,requestedAt:args.requestedAt,notifiedAt});return {notifiedAt};
  },
});
export const http=httpAction(async(ctx,request)=>{
  const headers={"Content-Type":"application/json","Cache-Control":"no-store","Referrer-Policy":"no-referrer"},reply=(body:unknown,status:number)=>new Response(JSON.stringify(body),{status,headers});
  try{const text=await request.text();if(text.length>2048)return reply({error:"Invalid request."},400);let body;try{body=JSON.parse(text);}catch{return reply({error:"Invalid request."},400);}
    if(typeof body?.code!=="string"||!/^[A-Za-z0-9_-]{43}$/.test(body.code))return reply({error:"Access denied."},404);
    if(typeof body.requestId!=="string"||body.requestId.length>100||!Number.isFinite(body.requestedAt))return reply({error:"Invalid request."},400);
    const result=await ctx.runMutation(internal.adminNotifications.mark,{linkHash:await hashCode(body.code),requestId:body.requestId,requestedAt:body.requestedAt});
    return result?reply(result,200):reply({error:"Access denied or request changed. Refresh requests."},409);
  }catch{return reply({error:"Could not mark Notified. Tap again to retry."},503);}
});

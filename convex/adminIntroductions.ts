import {internalMutation,httpAction} from "./_generated/server";
import {internal} from "./_generated/api";
import {v} from "convex/values";
import {currentResponse} from "./lib/meetingResponses";
import {accessFor} from "./revealPayments";
import {hashCode} from "./lib/operatorLinkSecrets";
import {introductionDraft} from "./lib/manualIntroduction";
export const mark=internalMutation({
  args:{linkHash:v.string(),requestId:v.id("founderChoices"),requestedAt:v.number(),recipient:v.union(v.literal("founder"),v.literal("operator"))},
  returns:v.union(v.null(),v.object({url:v.string(),message:v.string(),introduced:v.boolean(),founderOpenedAt:v.optional(v.number()),operatorOpenedAt:v.optional(v.number())})),
  handler:async(ctx,args)=>{
    if((await ctx.db.query("adminLinks").withIndex("by_link_hash",q=>q.eq("linkHash",args.linkHash)).unique())?.owner!=="Prabhat")return null;
    const choice=await ctx.db.get(args.requestId),response=choice?await currentResponse(ctx,choice):null;
    if(!choice||response?.status!=="Interested"||response.requestedAt!==args.requestedAt)return null;
    const search=await ctx.db.get(response.searchId);
    if(search?.founderId!==choice.founderId||search.status!=="completed"||!search.matches?.some(m=>m.operatorId===choice.operatorId))return null;
    const access=await accessFor(ctx,choice.founderId,choice.operatorId);
    if(!access.free&&!access.paidAt&&!access.grandfathered)return null;
    const founder=await ctx.db.get(choice.founderId),operator=await ctx.db.query("operators").withIndex("by_operator_id",q=>q.eq("operatorId",choice.operatorId)).unique();
    if(!founder||!operator)return null;
    const draft=introductionDraft(founder,operator,args.recipient);
    let row=await ctx.db.query("adminIntroductions").withIndex("by_request_identity",q=>q.eq("requestId",choice._id).eq("requestedAt",args.requestedAt)).unique();
    const field=args.recipient==='founder'?'founderOpenedAt':'operatorOpenedAt';
    if(!row){const id=await ctx.db.insert("adminIntroductions",{requestId:choice._id,requestedAt:args.requestedAt,[field]:Date.now()});row=await ctx.db.get(id);}
    else if(row[field]===undefined){await ctx.db.patch(row._id,{[field]:Date.now()});row=await ctx.db.get(row._id);}
    return {...draft,introduced:row!.founderOpenedAt!==undefined&&row!.operatorOpenedAt!==undefined,...(row!.founderOpenedAt!==undefined?{founderOpenedAt:row!.founderOpenedAt}:{}),...(row!.operatorOpenedAt!==undefined?{operatorOpenedAt:row!.operatorOpenedAt}:{})};
  },
});
export const http=httpAction(async(ctx,request)=>{
  const headers={"Content-Type":"application/json","Cache-Control":"no-store","Referrer-Policy":"no-referrer"};
  const reply=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers});
  try{
    const text=await request.text();if(text.length>2048)return reply({error:"Invalid request."},400);const body=JSON.parse(text);
    if(typeof body.code!=="string"||!/^[A-Za-z0-9_-]{43}$/.test(body.code))return reply({error:"Access denied."},404);
    if(typeof body.requestId!=="string"||!Number.isFinite(body.requestedAt)||!["founder","operator"].includes(body.recipient))return reply({error:"Invalid request."},400);
    const result=await ctx.runMutation(internal.adminIntroductions.mark,{linkHash:await hashCode(body.code),requestId:body.requestId,requestedAt:body.requestedAt,recipient:body.recipient});
    return result?reply(result):reply({error:"Confirm payment and refresh this accepted request before introducing."},409);
  }catch{return reply({error:"Could not open the introduction. Try again."},503);}
});

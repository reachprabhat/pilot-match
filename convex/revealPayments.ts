import {internalMutation,internalQuery} from "./_generated/server";
import {v} from "convex/values";
import type {MutationCtx} from "./_generated/server";
import type {Id} from "./_generated/dataModel";
import {currentResponse} from "./lib/meetingResponses";
export async function accessFor(ctx:MutationCtx,founderId:Id<"founders">,operatorId:string){
 const existing=await ctx.db.query("founderOperatorAccess").withIndex("by_founder_operator",q=>q.eq("founderId",founderId).eq("operatorId",operatorId)).unique();if(existing)return existing;
 let allowance=await ctx.db.query("founderRevealAllowances").withIndex("by_founder",q=>q.eq("founderId",founderId)).unique();
 if(!allowance){const id=await ctx.db.insert("founderRevealAllowances",{founderId,firstOperatorId:operatorId});allowance=await ctx.db.get(id);}
 const id=await ctx.db.insert("founderOperatorAccess",{founderId,operatorId,free:allowance!.firstOperatorId===operatorId});return (await ctx.db.get(id))!;
}
export const owner=internalQuery({args:{linkHash:v.string()},returns:v.boolean(),handler:async(ctx,args)=>(await ctx.db.query("adminLinks").withIndex("by_link_hash",q=>q.eq("linkHash",args.linkHash)).unique())?.owner==="Prabhat"});
export const settings=internalQuery({args:{linkHash:v.string()},returns:v.union(v.null(),v.object({qrUrl:v.union(v.string(),v.null())})),handler:async(ctx,args)=>{
 if((await ctx.db.query("adminLinks").withIndex("by_link_hash",q=>q.eq("linkHash",args.linkHash)).unique())?.owner!=="Prabhat")return null;
 const row=await ctx.db.query("revealSettings").withIndex("by_key",q=>q.eq("key","payment")).unique();return {qrUrl:row?await ctx.storage.getUrl(row.qrStorageId):null};
}});
export const saveQr=internalMutation({args:{linkHash:v.string(),storageId:v.id("_storage")},returns:v.boolean(),handler:async(ctx,args)=>{
 if((await ctx.db.query("adminLinks").withIndex("by_link_hash",q=>q.eq("linkHash",args.linkHash)).unique())?.owner!=="Prabhat")return false;
 const metadata=await ctx.db.system.get(args.storageId);if(!metadata||metadata.size>2097152||!['image/png','image/jpeg','image/webp'].includes(metadata.contentType??''))throw Error("Upload a PNG, JPG or WebP under 2 MB.");
 const row=await ctx.db.query("revealSettings").withIndex("by_key",q=>q.eq("key","payment")).unique();if(row)await ctx.db.patch(row._id,{qrStorageId:args.storageId});else await ctx.db.insert("revealSettings",{key:"payment",qrStorageId:args.storageId});return true;
}});
export const upload=internalMutation({args:{linkHash:v.string()},returns:v.union(v.null(),v.string()),handler:async(ctx,args)=>{
 if((await ctx.db.query("adminLinks").withIndex("by_link_hash",q=>q.eq("linkHash",args.linkHash)).unique())?.owner!=="Prabhat")return null;return ctx.storage.generateUploadUrl();
}});
export const markPaid=internalMutation({args:{linkHash:v.string(),requestId:v.id("founderChoices"),requestedAt:v.number()},returns:v.boolean(),handler:async(ctx,args)=>{
 if((await ctx.db.query("adminLinks").withIndex("by_link_hash",q=>q.eq("linkHash",args.linkHash)).unique())?.owner!=="Prabhat")return false;
 const choice=await ctx.db.get(args.requestId),response=choice?await currentResponse(ctx,choice):null;if(!choice||response?.status!=="Interested"||response.requestedAt!==args.requestedAt)return false;
 const access=await accessFor(ctx,choice.founderId,choice.operatorId);if(!access.free&&!access.grandfathered&&!access.paidAt)await ctx.db.patch(access._id,{paidAt:Date.now()});return true;
}});
export const preserveRevealed=internalMutation({args:{},returns:v.number(),handler:async(ctx)=>{
 const intros=await ctx.db.query("introductions").withIndex("by_founder").take(501);if(intros.length>500)throw Error("Too many introductions");let preserved=0;
 for(const intro of intros)if(intro.founderSeenAt!==undefined||intro.operatorSeenAt!==undefined){const access=await accessFor(ctx,intro.founderId,intro.operatorId);if(!access.grandfathered){await ctx.db.patch(access._id,{grandfathered:true});preserved++;}}return preserved;
}});

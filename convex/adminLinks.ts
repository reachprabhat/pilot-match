import {internalQuery,internalMutation} from "./_generated/server";
import {v} from "convex/values";

export const existing=internalQuery({
  args:{},returns:v.union(v.null(),v.string()),
  handler:async ctx=>(await ctx.db.query("adminLinks").withIndex("by_owner",q=>q.eq("owner","Prabhat")).unique())?.linkHash??null,
});

export const setPersonalLink=internalMutation({
  args:{linkHash:v.string()},returns:v.null(),
  handler:async(ctx,args)=>{
    if(!/^[a-f0-9]{64}$/.test(args.linkHash))throw new Error("Invalid link hash.");
    const existing=await ctx.db.query("adminLinks").withIndex("by_owner",q=>q.eq("owner","Prabhat")).unique();
    if(existing){if(existing.linkHash!==args.linkHash)throw new Error("An existing admin link cannot be replaced.");return null;}
    const founder=await ctx.db.query("founders").withIndex("by_link_hash",q=>q.eq("linkHash",args.linkHash)).unique();
    const operator=await ctx.db.query("operatorLinks").withIndex("by_link_hash",q=>q.eq("linkHash",args.linkHash)).unique();
    if(founder||operator)throw new Error("Personal link already belongs to someone else.");
    await ctx.db.insert("adminLinks",{owner:"Prabhat",linkHash:args.linkHash});
    return null;
  },
});

import { internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import { searchState, searchStateValidator } from "./searchRules";

export const setPersonalLink = internalMutation({
  args:{founderId:v.string(),linkHash:v.string()},returns:v.null(),
  handler:async(ctx,args)=>{
    if(!/^[a-f0-9]{64}$/.test(args.linkHash))throw new Error("Invalid link fingerprint.");
    const founder=await ctx.db.query("founders").withIndex("by_founder_id",q=>q.eq("founderId",args.founderId)).unique();
    if(!founder)throw new Error("Founder not found.");
    if(founder.linkHash)throw new Error("Founder already has a personal link.");
    const duplicate=await ctx.db.query("founders").withIndex("by_link_hash",q=>q.eq("linkHash",args.linkHash)).unique();
    if(duplicate)throw new Error("Link fingerprint already in use.");
    await ctx.db.patch(founder._id,{linkHash:args.linkHash});
    return null;
  },
});

export const resolvePersonalLink = internalQuery({
  args:{linkHash:v.string()},returns:v.union(v.null(),v.object({company:v.string(),...searchStateValidator.fields})),
  handler:async(ctx,args)=>{
    if(!/^[a-f0-9]{64}$/.test(args.linkHash))return null;
    const founder=await ctx.db.query("founders").withIndex("by_link_hash",q=>q.eq("linkHash",args.linkHash)).unique();
    return founder?{company:founder.company,...searchState(founder.searchCount)}:null;
  },
});

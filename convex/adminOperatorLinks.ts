import {internalMutation} from "./_generated/server";
import {v} from "convex/values";
// Owner-only import of protected copies of existing codes; no profile or link rotation.
export const rememberExisting=internalMutation({
  args:{linkHash:v.string(),operatorId:v.string(),operatorLinkHash:v.string(),encryptedCode:v.string()},returns:v.boolean(),
  handler:async(ctx,args)=>{
    const owner=await ctx.db.query("adminLinks").withIndex("by_link_hash",q=>q.eq("linkHash",args.linkHash)).unique();if(owner?.owner!=="Prabhat")return false;
    const link=await ctx.db.query("operatorLinks").withIndex("by_operator_id",q=>q.eq("operatorId",args.operatorId)).unique();
    if(!link||link.linkHash!==args.operatorLinkHash||!/^v1\.[A-Za-z0-9_-]{16}\.[A-Za-z0-9_-]{79}$/.test(args.encryptedCode))return false;
    const existing=await ctx.db.query("operatorLinkSecrets").withIndex("by_operator_id",q=>q.eq("operatorId",args.operatorId)).unique();
    if(!existing)await ctx.db.insert("operatorLinkSecrets",{operatorId:args.operatorId,encryptedCode:args.encryptedCode});
    return true;
  },
});

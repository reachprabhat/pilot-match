import {internalQuery,internalMutation} from "./_generated/server";
import {v} from "convex/values";

export const listForOwner=internalQuery({
  args:{},returns:v.array(v.object({operatorId:v.string(),linkHash:v.union(v.string(),v.null())})),
  handler:async(ctx)=>{
    const operators=await ctx.db.query("operators").withIndex("by_operator_id").take(501);
    if(operators.length>500)throw new Error("Generate links in batches before adding more operators.");
    return Promise.all(operators.map(async operator=>{
      const link=await ctx.db.query("operatorLinks").withIndex("by_operator_id",q=>q.eq("operatorId",operator.operatorId)).unique();
      return {operatorId:operator.operatorId,linkHash:link?.linkHash??null};
    }));
  },
});

export const setPersonalLink=internalMutation({
  args:{operatorId:v.string(),linkHash:v.string()},returns:v.null(),
  handler:async(ctx,args)=>{
    if(!/^[a-f0-9]{64}$/.test(args.linkHash))throw new Error("Invalid link hash.");
    const operator=await ctx.db.query("operators").withIndex("by_operator_id",q=>q.eq("operatorId",args.operatorId)).unique();
    if(!operator)throw new Error("Operator not found.");
    const existing=await ctx.db.query("operatorLinks").withIndex("by_operator_id",q=>q.eq("operatorId",args.operatorId)).unique();
    if(existing){if(existing.linkHash!==args.linkHash)throw new Error("An existing personal link cannot be replaced.");return null;}
    const duplicate=await ctx.db.query("operatorLinks").withIndex("by_link_hash",q=>q.eq("linkHash",args.linkHash)).unique();
    const founder=await ctx.db.query("founders").withIndex("by_link_hash",q=>q.eq("linkHash",args.linkHash)).unique();
    if(duplicate||founder)throw new Error("Personal link already belongs to someone else.");
    await ctx.db.insert("operatorLinks",args);
    return null;
  },
});

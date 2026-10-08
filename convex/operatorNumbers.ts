import {internalMutation,internalQuery} from "./_generated/server";
import {v} from "convex/values";
import {nextOperatorNumber,publicOperatorNumber} from "./lib/operatorNumbers";

export const assignMissing=internalMutation({
  args:{operatorId:v.string()},returns:v.number(),
  handler:async(ctx,args)=>{
    const operator=await ctx.db.query("operators").withIndex("by_operator_id",q=>q.eq("operatorId",args.operatorId)).unique();
    if(!operator)throw Error("Operator not found.");
    const existing=publicOperatorNumber(operator);
    if(existing!==null)return existing;
    const operatorNumber=await nextOperatorNumber(ctx);
    await ctx.db.patch(operator._id,{operatorNumber});
    return operatorNumber;
  },
});

export const labels=internalQuery({
  args:{operatorIds:v.array(v.string())},returns:v.array(v.union(v.number(),v.null())),
  handler:async(ctx,args)=>{
    if(args.operatorIds.length>2)throw Error("Too many operator labels.");
    return Promise.all(args.operatorIds.map(async operatorId=>{
      const operator=await ctx.db.query("operators").withIndex("by_operator_id",q=>q.eq("operatorId",operatorId)).unique();
      return operator?publicOperatorNumber(operator):null;
    }));
  },
});

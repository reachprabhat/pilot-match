import {internalQuery, internalMutation} from "./_generated/server";
import {v} from "convex/values";
import {choiceStatusValidator} from "./choiceValidators";
import {matchValidator} from "./matchingValidators";

export const latest = internalQuery({
  args:{linkHash:v.string()},
  returns:v.union(v.null(),v.object({ask:v.string(),matches:v.array(v.object({...matchValidator.fields,choice:v.union(choiceStatusValidator,v.null())}))})),
  handler:async(ctx,args)=>{
    const founder=await ctx.db.query("founders").withIndex("by_link_hash",q=>q.eq("linkHash",args.linkHash)).unique();
    if(!founder)return null;
    const search=await ctx.db.query("founderSearches").withIndex("by_founder_status",q=>q.eq("founderId",founder._id).eq("status","completed")).order("desc").first();
    const matches=await Promise.all((search?.matches??[]).map(async match=>{
      const choice=await ctx.db.query("founderChoices").withIndex("by_founder_operator",q=>q.eq("founderId",founder._id).eq("operatorId",match.operatorId)).unique();
      return {...match,choice:choice?.status??null};
    }));
    return {ask:search?.ask??"",matches};
  },
});

export const save = internalMutation({
  args:{linkHash:v.string(),operatorId:v.string(),status:choiceStatusValidator},
  returns:v.union(v.object({error:v.literal("invalid_link")}),v.object({error:v.literal("invalid_match")}),v.object({operatorId:v.string(),status:choiceStatusValidator,updatedAt:v.number()})),
  handler:async(ctx,args)=>{
    const founder=await ctx.db.query("founders").withIndex("by_link_hash",q=>q.eq("linkHash",args.linkHash)).unique();
    if(!founder)return {error:"invalid_link" as const};
    const search=await ctx.db.query("founderSearches").withIndex("by_founder_status",q=>q.eq("founderId",founder._id).eq("status","completed")).order("desc").first();
    if(!search?.matches?.some(match=>match.operatorId===args.operatorId))return {error:"invalid_match" as const};
    const existing=await ctx.db.query("founderChoices").withIndex("by_founder_operator",q=>q.eq("founderId",founder._id).eq("operatorId",args.operatorId)).unique();
    const updatedAt=Date.now();
    if(existing)await ctx.db.patch(existing._id,{status:args.status,updatedAt});
    else await ctx.db.insert("founderChoices",{founderId:founder._id,operatorId:args.operatorId,status:args.status,updatedAt});
    return {operatorId:args.operatorId,status:args.status,updatedAt};
  },
});

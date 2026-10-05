import { internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { factValidator } from "./enrichmentValidators";
import { NOT_FOUND } from "./lib/enrichment";

export const reserve = internalMutation({
  args:{operatorId:v.string(),retryFailed:v.optional(v.boolean())},
  returns:v.union(v.null(),v.object({runId:v.id("aiCalls"),company:v.string()})),
  handler:async(ctx,args)=>{
    const row=await ctx.db.query("operators").withIndex("by_operator_id",q=>q.eq("operatorId",args.operatorId)).unique();
    if(!row)throw new Error("Operator not found.");
    if(row.companyProblems!==NOT_FOUND||(row.riskSearch&&!(args.retryFailed&&row.riskSearch.status==="failed"))) return null;
    if(row.enrichment?.status==="running")throw new Error("Another search is running.");
    const now=Date.now();
    if((await ctx.db.query("aiCalls").withIndex("by_started_at",q=>q.gte("startedAt",now-3600000)).take(100)).length>=100)
      throw new Error("Busy right now. Try again in a few minutes.");
    const runId=await ctx.db.insert("aiCalls",{operatorId:args.operatorId,startedAt:now,purpose:"operator_enrichment"});
    await ctx.db.patch(row._id,{riskSearch:{status:"running",attempts:(row.riskSearch?.attempts??0)+1,runId,startedAt:now}});
    return {runId,company:row.researchCompany??row.company};
  }
});

export const finish = internalMutation({
  args:{operatorId:v.string(),runId:v.id("aiCalls"),risks:v.array(factValidator),sources:v.array(v.string()),responseId:v.string()},
  returns:v.null(),
  handler:async(ctx,args)=>{
    const row=await ctx.db.query("operators").withIndex("by_operator_id",q=>q.eq("operatorId",args.operatorId)).unique();
    if(!row?.riskSearch||row.riskSearch.runId!==args.runId||row.riskSearch.status!=="running"||!row.enrichment?.facts)
      throw new Error("Risk search reservation changed.");
    if(args.risks.length>3||args.risks.some(r=>!r.sourceUrl||!args.sources.includes(r.sourceUrl)))
      throw new Error("Up to three sourced risks required.");
    // Only risks and their evidence change; financial and industry fields are never patched.
    await ctx.db.patch(row._id,{
      companyProblems:args.risks.map(r=>r.value).join("; ")||NOT_FOUND,
      enrichment:{...row.enrichment,facts:{...row.enrichment.facts,companyProblems:args.risks},
        consultedSources:[...new Set([...(row.enrichment.consultedSources??[]),...args.sources])]},
      riskSearch:{...row.riskSearch,status:"completed",completedAt:Date.now(),webSearchCalls:1,responseId:args.responseId,consultedSources:args.sources}
    });
    return null;
  }
});

export const fail = internalMutation({
 args:{operatorId:v.string(),runId:v.id("aiCalls")},returns:v.null(),
 handler:async(ctx,args)=>{
 const row=await ctx.db.query("operators").withIndex("by_operator_id",q=>q.eq("operatorId",args.operatorId)).unique();
 if(row?.riskSearch?.runId===args.runId)await ctx.db.patch(row._id,{riskSearch:{...row.riskSearch,status:"failed",completedAt:Date.now(),error:"Search failed. No automatic retry."}});
 return null;
 }
});

export const recover = internalMutation({
 args:{operatorId:v.string(),risks:v.array(factValidator)},returns:v.null(),
 handler:async(ctx,args)=>{
 const row=await ctx.db.query("operators").withIndex("by_operator_id",q=>q.eq("operatorId",args.operatorId)).unique();
 if(row?.riskSearch?.status!=="completed"||!row.enrichment?.facts||args.risks.length>3||
 args.risks.some(r=>!r.sourceUrl||!row.riskSearch?.consultedSources?.includes(r.sourceUrl)))throw new Error("Use sources from the completed risks search.");
 await ctx.db.patch(row._id,{companyProblems:args.risks.map(r=>r.value).join("; ")||NOT_FOUND,
 enrichment:{...row.enrichment,facts:{...row.enrichment.facts,companyProblems:args.risks}}});
 return null;
 }
});

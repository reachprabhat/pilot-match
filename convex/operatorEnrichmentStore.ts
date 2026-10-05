import { internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import { factsValidator, factValidator } from "./enrichmentValidators";
import { mayStart, NOT_FOUND } from "./lib/enrichment";

// Reserve before contacting OpenAI. Convex serializes conflicting reservations.
export const reserve = internalMutation({
  args: { operatorId: v.string(), rerun: v.boolean() },
  returns: v.union(v.null(), v.object({ runId: v.id("aiCalls"), company: v.string(), allowGlobalRevenue: v.boolean() })),
  handler: async (ctx, args) => {
    const row = await ctx.db.query("operators")
      .withIndex("by_operator_id", q => q.eq("operatorId", args.operatorId)).unique();
    if (!row) throw new Error("Operator not found.");
    if (!mayStart(row.enrichment, args.rerun)) return null;
    if (!row.company.trim() || row.company.toLowerCase() === NOT_FOUND) throw new Error("Company is missing.");
    const now = Date.now();
    const recent = await ctx.db.query("aiCalls")
      .withIndex("by_started_at", q => q.gte("startedAt", now - 3600000)).take(100);
    if (recent.length >= 100) throw new Error("Busy right now. Try again in a few minutes.");
    const runId = await ctx.db.insert("aiCalls", {operatorId:args.operatorId, startedAt:now, purpose:"operator_enrichment"});
    await ctx.db.patch(row._id, { enrichment: {
      status: "running", attempts: (row.enrichment?.attempts ?? 0) + 1,
      runId, startedAt: now,
    }});
    return { runId, company: row.researchCompany ?? row.company, allowGlobalRevenue: row.allowGlobalRevenue ?? false };
  },
});

export const finish = internalMutation({
  args: { operatorId: v.string(), runId: v.id("aiCalls"), responseId: v.string(),
    facts: factsValidator, consultedSources: v.array(v.string()), webSearchCalls: v.number() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const row = await ctx.db.query("operators")
      .withIndex("by_operator_id", q => q.eq("operatorId", args.operatorId)).unique();
    if (!row?.enrichment || row.enrichment.runId !== args.runId || row.enrichment.status !== "running")
      throw new Error("Search reservation does not match.");
    if (args.webSearchCalls !== 1) throw new Error("Exactly one web search is required.");
    const sources = [args.facts.revenueBand, args.facts.industry, ...args.facts.companyProblems]
      .flatMap(f => f.sourceUrl ? [f.sourceUrl] : []);
    await ctx.db.patch(row._id, {
      revenueBand: args.facts.revenueBand.value,
      industry: args.facts.industry.value,
      companyProblems: args.facts.companyProblems.map(f => f.value).join("; ") || NOT_FOUND,
      sourceLink: sources[0] || NOT_FOUND,
      enrichment: { ...row.enrichment, status:"completed", completedAt:Date.now(),
        responseId:args.responseId, webSearchCalls:args.webSearchCalls,
        facts:args.facts, consultedSources:args.consultedSources },
    });
    return null;
  },
});

export const fail = internalMutation({
  args: {operatorId:v.string(), runId:v.id("aiCalls"), error:v.string()},
  returns: v.null(),
  handler: async (ctx, args) => {
    const row = await ctx.db.query("operators")
      .withIndex("by_operator_id", q => q.eq("operatorId", args.operatorId)).unique();
    if (row?.enrichment?.runId === args.runId && row.enrichment.status === "running")
      await ctx.db.patch(row._id, {enrichment:{...row.enrichment,status:"failed",completedAt:Date.now(),error:args.error}});
    return null;
  },
});

// Lets the owner correct extraction from a source already found by this search.
// It never runs a new search or sends a new AI request.
export const existingEvidence = internalQuery({
  args:{operatorId:v.string()},
  returns:v.union(v.null(),v.object({runId:v.id("aiCalls"),sources:v.array(v.string())})),
  handler:async(ctx,args)=>{
    const row=await ctx.db.query("operators").withIndex("by_operator_id",q=>q.eq("operatorId",args.operatorId)).unique();
    if(row?.enrichment?.status!=="completed")return null;
    return {runId:row.enrichment.runId,sources:row.enrichment.consultedSources??[]};
  },
});

export const correctRevenue = internalMutation({
  args:{operatorId:v.string(),runId:v.id("aiCalls"),fact:factValidator},
  returns:v.null(),
  handler:async(ctx,args)=>{
    const row=await ctx.db.query("operators").withIndex("by_operator_id",q=>q.eq("operatorId",args.operatorId)).unique();
    if(!row?.enrichment?.facts||row.enrichment.status!=="completed"||row.enrichment.runId!==args.runId||
      !args.fact.sourceUrl||!row.enrichment.consultedSources?.includes(args.fact.sourceUrl))
      throw new Error("Evidence must come from the completed search.");
    await ctx.db.patch(row._id,{revenueBand:args.fact.value,sourceLink:args.fact.sourceUrl,
      enrichment:{...row.enrichment,facts:{...row.enrichment.facts,revenueBand:args.fact}}});
    return null;
  },
});

export const configureResearch = internalMutation({
 args:{operatorId:v.string(),researchCompany:v.string(),allowGlobalRevenue:v.optional(v.boolean()),repairCompanyAccent:v.optional(v.boolean())},returns:v.null(),
 handler:async(ctx,args)=>{
 const row=await ctx.db.query("operators").withIndex("by_operator_id",q=>q.eq("operatorId",args.operatorId)).unique();
 if(!row)throw new Error("Operator not found.");
 await ctx.db.patch(row._id,{researchCompany:args.researchCompany,allowGlobalRevenue:args.allowGlobalRevenue??false,
 ...(args.repairCompanyAccent?{company:row.company.replace(/(?<=Nestl)[?\uFFFD]/g,"\u00e9")}: {})});
 return null;
 }
});

export const recoverFacts = internalMutation({
 args:{operatorId:v.string(),runId:v.id("aiCalls"),facts:factsValidator},returns:v.null(),
 handler:async(ctx,args)=>{
 const row=await ctx.db.query("operators").withIndex("by_operator_id",q=>q.eq("operatorId",args.operatorId)).unique();
 if(!row?.enrichment?.facts||row.enrichment.status!=="completed"||row.enrichment.runId!==args.runId)throw new Error("Search changed.");
 for(const fact of [args.facts.revenueBand,args.facts.industry,...args.facts.companyProblems])
 if(fact.sourceUrl&&!row.enrichment.consultedSources?.includes(fact.sourceUrl))throw new Error("Source was not searched.");
 const old=row.enrichment.facts;
 const facts={revenueBand:args.facts.revenueBand.value===NOT_FOUND?old.revenueBand:args.facts.revenueBand,
 industry:args.facts.industry.value===NOT_FOUND?old.industry:args.facts.industry,
 companyProblems:args.facts.companyProblems.length?args.facts.companyProblems:old.companyProblems};
 await ctx.db.patch(row._id,{revenueBand:facts.revenueBand.value,industry:facts.industry.value,
 companyProblems:facts.companyProblems.map(f=>f.value).join("; ")||NOT_FOUND,
 sourceLink:facts.revenueBand.sourceUrl??facts.industry.sourceUrl??facts.companyProblems[0]?.sourceUrl??NOT_FOUND,
 enrichment:{...row.enrichment,facts}});
 return null;
 }
});

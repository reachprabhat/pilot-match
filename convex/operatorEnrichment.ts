"use node";
import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { readEvidenceSource } from "./lib/evidenceSource";
import { v } from "convex/values";
import { factsValidator, factValidator } from "./enrichmentValidators";
import { createSearchRequest, safeSourceUrl, pageText, validateFacts, type Facts } from "./lib/enrichment";

type OutputItem = {
  type: string; status?: string;
  action?: {type?: string; sources?: {url?: string}[]};
  content?: {type?: string; text?: string; annotations?: {type?: string; url?: string}[]}[];
};

export const run = internalAction({
  args: {operatorId:v.string(), rerun:v.optional(v.boolean())},
  returns: v.object({status:v.union(v.literal("completed"),v.literal("already_searched")),
    operatorId:v.string(),facts:v.optional(factsValidator)}),
  handler: async (ctx, args): Promise<{status:"completed"|"already_searched";operatorId:string;facts?:Facts}> => {
    const key = process.env.OPENAI_API_KEY;
    if (!key) throw new Error("OPENAI_API_KEY is missing in this Convex deployment.");
    const reservation = await ctx.runMutation(internal.operatorEnrichmentStore.reserve,
      {operatorId:args.operatorId,rerun:args.rerun ?? false});
    if (!reservation) return {status:"already_searched",operatorId:args.operatorId};
    try {
      // Native fetch makes one request only: no SDK retries and no automatic reruns.
      const response = await fetch("https://api.openai.com/v1/responses", {
        method:"POST", headers:{Authorization:`Bearer ${key}`,"Content-Type":"application/json"},
        body:JSON.stringify(createSearchRequest(reservation.company,reservation.allowGlobalRevenue)),
        signal:AbortSignal.timeout(120000),
      });
      if (!response.ok) throw new Error(`OpenAI request failed (HTTP ${response.status}).`);
      const result = await response.json() as {id:string;status:string;output:OutputItem[]};
      if (result.status !== "completed") throw new Error("OpenAI response was incomplete; no facts saved.");
      const searches = result.output.filter(i => i.type === "web_search_call");
      if (searches.length !== 1 || searches[0].status !== "completed" || searches[0].action?.type !== "search")
        throw new Error("Expected exactly one completed web search.");
      const sources = new Set<string>();
      for (const item of result.output) {
        for (const source of item.action?.sources ?? []) {
          const url = source.url && safeSourceUrl(source.url); if (url) sources.add(url);
        }
        for (const content of item.content ?? []) for (const citation of content.annotations ?? []) {
          const url = citation.url && safeSourceUrl(citation.url); if (url) sources.add(url);
        }
      }
      const text = result.output.flatMap(i => i.content ?? [])
        .filter(c => c.type === "output_text").map(c => c.text ?? "").join("\n");
      const raw = JSON.parse(text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, ""));
      const candidates = [raw.revenueBand,raw.industry,...(Array.isArray(raw.companyProblems)?raw.companyProblems.slice(0,3):[])];
      const urls = [...new Set(candidates.flatMap(f => {
        const url = typeof f?.sourceUrl === "string" && safeSourceUrl(f.sourceUrl);
        return url && sources.has(url) ? [url] : [];
      }))];
      // Opening cited pages is evidence checking, not an additional web search.
      const pages = new Map<string,string>();
      await Promise.all(urls.map(async url => {
        try {
          pages.set(url,await readEvidenceSource(url));
        } catch { /* Unverifiable pages leave the corresponding fact as not found. */ }
      }));
      const facts = validateFacts(raw,sources,pages);
      if(raw.revenueScope === "global group") {
        if(reservation.allowGlobalRevenue && facts.revenueBand.value !== "not found") facts.revenueBand.value = "global group: " + facts.revenueBand.value;
        else facts.revenueBand = {value:"not found",sourceUrl:null,evidence:""};
      }
      await ctx.runMutation(internal.operatorEnrichmentStore.finish,{
        operatorId:args.operatorId,runId:reservation.runId,responseId:result.id,
        webSearchCalls:searches.length,facts,consultedSources:[...sources],
      });
      return {status:"completed",operatorId:args.operatorId,facts};
    } catch (error) {
      const message = error instanceof Error && /^OpenAI request failed \(HTTP \d+\)\.$/.test(error.message)
        ? error.message : "Search failed or evidence could not be parsed. No automatic retry.";
      await ctx.runMutation(internal.operatorEnrichmentStore.fail,
        {operatorId:args.operatorId,runId:reservation.runId,error:message});
      throw new Error(message);
    }
  },
});

export const verifyRevenueFromExistingSource = internalAction({
  args:{operatorId:v.string(),fact:factValidator},
  returns:factValidator,
  handler:async(ctx,args):Promise<Facts["revenueBand"]>=>{
    const existing=await ctx.runQuery(internal.operatorEnrichmentStore.existingEvidence,{operatorId:args.operatorId});
    const url=args.fact.sourceUrl&&safeSourceUrl(args.fact.sourceUrl);
    if(!existing||!url||!existing.sources.includes(url))throw new Error("Use a source from the completed search.");
    const text=await readEvidenceSource(url);
    const facts=validateFacts({revenueBand:args.fact},new Set(existing.sources),
      new Map([[url,text]]));
    if(facts.revenueBand.value==="not found")throw new Error("Revenue does not match the source passage.");
    await ctx.runMutation(internal.operatorEnrichmentStore.correctRevenue,
      {operatorId:args.operatorId,runId:existing.runId,fact:facts.revenueBand});
    return facts.revenueBand;
  },
});

export const checkSource = internalAction({
  args:{url:v.string(),quote:v.string()},
  returns:v.object({characters:v.number(),quoteFound:v.boolean()}),
  handler:async(_ctx,args)=>{
    const text=await readEvidenceSource(args.url);
    return {characters:text.length,quoteFound:text.includes(pageText(args.quote))};
  },
});

export const sourcePassages = internalAction({
 args:{operatorId:v.string(),url:v.string(),term:v.string()},returns:v.array(v.string()),
 handler:async(ctx,args)=>{
 const existing=await ctx.runQuery(internal.operatorEnrichmentStore.existingEvidence,{operatorId:args.operatorId});
 if(!existing?.sources.includes(args.url))throw new Error("Use an already searched source.");
 const text=await readEvidenceSource(args.url);
 const term=pageText(args.term);const passages:string[]=[];
 let position=0;
 while(passages.length<8){const i=text.indexOf(term,position);if(i<0)break;passages.push(text.slice(Math.max(0,i-100),i+450));position=i+term.length;}
 return passages;
 }
});

export const recoverFromExistingSources = internalAction({
 args:{operatorId:v.string(),facts:factsValidator},returns:factsValidator,
 handler:async(ctx,args):Promise<Facts>=>{
 const existing=await ctx.runQuery(internal.operatorEnrichmentStore.existingEvidence,{operatorId:args.operatorId});
 if(!existing)throw new Error("Completed search required.");
 const urls=[...new Set([args.facts.revenueBand,args.facts.industry,...args.facts.companyProblems].flatMap(f=>f.sourceUrl?[f.sourceUrl]:[]))];
 if(urls.some(url=>!existing.sources.includes(url)))throw new Error("Use already searched sources.");
 const pages=new Map<string,string>();
 for(const url of urls)pages.set(url,await readEvidenceSource(url));
 const facts=validateFacts(args.facts,new Set(existing.sources),pages);
 await ctx.runMutation(internal.operatorEnrichmentStore.recoverFacts,{operatorId:args.operatorId,runId:existing.runId,facts});
 return facts;
 }
});

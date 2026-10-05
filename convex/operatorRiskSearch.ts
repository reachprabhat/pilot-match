"use node";
import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import { factValidator } from "./enrichmentValidators";
import { createRiskSearchRequest, safeSourceUrl, validateRisks, type Fact } from "./lib/enrichment";
import { readEvidenceSource } from "./lib/evidenceSource";

export const run = internalAction({
 args:{operatorId:v.string(),retryFailed:v.optional(v.boolean())},
 returns:v.object({status:v.string(),risks:v.optional(v.array(factValidator))}),
 handler:async(ctx,args):Promise<{status:string;risks?:Fact[]}>=>{
 const key=process.env.OPENAI_API_KEY;
 if(!key)throw new Error("OPENAI_API_KEY is missing.");
 const reservation=await ctx.runMutation(internal.operatorRiskStore.reserve,args);
 if(!reservation)return {status:"skipped"};
 try{
 const response=await fetch("https://api.openai.com/v1/responses",{method:"POST",headers:{Authorization:`Bearer ${key}`,"Content-Type":"application/json"},body:JSON.stringify(createRiskSearchRequest(reservation.company)),signal:AbortSignal.timeout(120000)});
 if(!response.ok)throw new Error("Provider request failed.");
 const result=await response.json();
 const searches=result.output?.filter((i:any)=>i.type==="web_search_call");
 if(result.status!=="completed"||searches?.length!==1||searches[0].status!=="completed"||searches[0].action?.type!=="search")throw new Error("Expected one completed search.");
 const sources=new Set<string>();
 for(const item of result.output){
 for(const s of item.action?.sources??[]){const url=s.url&&safeSourceUrl(s.url);if(url)sources.add(url);}
 for(const c of item.content??[])for(const s of c.annotations??[]){const url=s.url&&safeSourceUrl(s.url);if(url)sources.add(url);}
 }
 const text=result.output.flatMap((i:any)=>i.content??[]).filter((c:any)=>c.type==="output_text").map((c:any)=>c.text??"").join("\n");
 const raw=JSON.parse(text.replace(/^```(?:json)?\s*/i,"").replace(/\s*```$/,""));
 const pages=new Map<string,string>();
 const urls=[...new Set<string>((raw.companyProblems??[]).slice(0,3).flatMap((f:any)=>{const url=f.sourceUrl&&safeSourceUrl(f.sourceUrl);return url&&sources.has(url)?[url]:[];}))];
 for(const url of urls){try{pages.set(url,await readEvidenceSource(url));}catch{/* Keep unsupported risks missing. */}}
 const risks=validateRisks(raw,sources,pages);
 await ctx.runMutation(internal.operatorRiskStore.finish,{operatorId:args.operatorId,runId:reservation.runId,risks,sources:[...sources],responseId:result.id});
 return {status:"completed",risks};
 }catch{
 await ctx.runMutation(internal.operatorRiskStore.fail,{operatorId:args.operatorId,runId:reservation.runId});
 throw new Error("Risk search failed. No automatic retry.");
 }
 }
});

export const recover = internalAction({
 args:{operatorId:v.string(),risks:v.array(factValidator)},returns:v.array(factValidator),
 handler:async(ctx,args):Promise<Fact[]>=>{
 const existing=await ctx.runQuery(internal.operatorEnrichmentStore.existingEvidence,{operatorId:args.operatorId});
 if(!existing)throw new Error("Completed enrichment required.");
 const urls=[...new Set(args.risks.flatMap(r=>r.sourceUrl?[r.sourceUrl]:[]))];
 if(urls.some(url=>!existing.sources.includes(url)))throw new Error("Use already searched sources.");
 const pages=new Map<string,string>();for(const url of urls)pages.set(url,await readEvidenceSource(url));
 const risks=validateRisks({companyProblems:args.risks},new Set(existing.sources),pages);
 if(risks.length!==args.risks.length)throw new Error("Risk evidence does not match.");
 await ctx.runMutation(internal.operatorRiskStore.recover,{operatorId:args.operatorId,risks});
 return risks;
 }
});

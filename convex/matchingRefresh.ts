"use node";
import {internalAction} from "./_generated/server";
import {internal} from "./_generated/api";
import {v} from "convex/values";
import {createMatchingRequest,validateMatches} from "./lib/matching";
export const run=internalAction({args:{searchId:v.id("founderSearches")},returns:v.null(),handler:async(ctx,args)=>{
 const job=await ctx.runMutation(internal.matchingRefreshStore.begin,args);if(!job)return null;
 try{if(!process.env.OPENAI_API_KEY)throw Error("Provider unavailable");const input=await ctx.runQuery(internal.matchingStore.input,{founderDocId:job.founderId,ask:job.ask});
 if(!input.operators.length){await ctx.runMutation(internal.matchingRefreshStore.finish,{...args,matches:[]});return null;}
 const response=await fetch("https://api.openai.com/v1/responses",{method:"POST",headers:{Authorization:`Bearer ${process.env.OPENAI_API_KEY}`,"Content-Type":"application/json"},body:JSON.stringify(createMatchingRequest(input)),signal:AbortSignal.timeout(45000)});
 if(!response.ok)throw Error("Provider failed");const result=await response.json();if(result.status!=="completed")throw Error("Incomplete");
 const text=result.output.filter((r:any)=>r.type==="message").flatMap((r:any)=>r.content??[]).filter((r:any)=>r.type==="output_text").map((r:any)=>r.text??"").join("");
 await ctx.runMutation(internal.matchingRefreshStore.finish,{...args,matches:validateMatches(JSON.parse(text),input)});
 }catch{await ctx.runMutation(internal.matchingRefreshStore.finish,args);}return null;
}});

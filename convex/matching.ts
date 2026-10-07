"use node";
import {internalAction} from "./_generated/server";
import {internal} from "./_generated/api";
import {v} from "convex/values";
import {matchingResultValidator} from "./matchingValidators";
import {createMatchingRequest,validateMatches,type Match} from "./lib/matching";

type Result={status:"matched";matches:Match[];searchCount:number;searchLimit:number;searchesRemaining:number}|{status:"limit_reached";searchCount:number;searchLimit:number;searchesRemaining:number}|{status:"busy"|"invalid_link"|"invalid_ask"};
export const run=internalAction({
  args:{linkHash:v.string(),ask:v.string(),requestId:v.string()},returns:matchingResultValidator,
  handler:async(ctx,args):Promise<Result>=>{
    if(!process.env.OPENAI_API_KEY)return {status:"busy"};
    const reservation=await ctx.runMutation(internal.matchingStore.reserve,args);
    if(reservation.status!=="reserved")return reservation;
    try {
      const input=await ctx.runQuery(internal.matchingStore.input,{founderDocId:reservation.founderDocId,ask:args.ask.trim()});
      if(!input.operators.length)return await ctx.runMutation(internal.matchingStore.complete,{searchId:reservation.searchId,matches:[],responseId:"no-eligible-operators"});
      const response=await fetch("https://api.openai.com/v1/responses",{
        method:"POST",headers:{Authorization:`Bearer ${process.env.OPENAI_API_KEY}`,"Content-Type":"application/json"},
        body:JSON.stringify(createMatchingRequest(input)),signal:AbortSignal.timeout(45000),
      });
      if(!response.ok)throw Error("Provider failure");
      const result=await response.json() as {id:string;status:string;output:{type:string;content?:{type:string;text?:string}[]}[]};
      if(result.status!=="completed" || typeof result.id!=="string" || !Array.isArray(result.output))throw Error("Incomplete reply");
      const text=result.output.filter(item=>item.type==="message").flatMap(item=>item.content??[]).filter(item=>item.type==="output_text").map(item=>item.text??"").join("");
      const matches=validateMatches(JSON.parse(text),input);
      const finished=await ctx.runMutation(internal.matchingStore.complete,{searchId:reservation.searchId,matches,responseId:result.id});
      if(finished.status!=="matched")await ctx.runMutation(internal.matchingStore.fail,{searchId:reservation.searchId});
      return finished;
    } catch {
      await ctx.runMutation(internal.matchingStore.fail,{searchId:reservation.searchId});
      return {status:"busy"};
    }
  },
});

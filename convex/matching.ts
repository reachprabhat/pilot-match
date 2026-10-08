"use node";
import {internalAction} from "./_generated/server";
import {internal} from "./_generated/api";
import {v} from "convex/values";
import {matchingResultValidator} from "./matchingValidators";
import {createMatchingRequest,validateMatches,type Match,type MatchingInput} from "./lib/matching";
import {safeWelcomeError as safeAiError} from "./lib/safeWelcomeError";

type Result={status:"matched";matches:Match[];searchCount:number;searchLimit:number;searchesRemaining:number}|{status:"limit_reached";searchCount:number;searchLimit:number;searchesRemaining:number}|{status:"busy"|"invalid_link"|"invalid_ask"};

// Shared by the normal search and the owner-only, non-saving diagnostic replay.
export async function readMatchingReply(input:MatchingInput,setStage:(stage:string)=>void){
  setStage("provider");
  const response=await fetch("https://api.openai.com/v1/responses",{
    method:"POST",headers:{Authorization:`Bearer ${process.env.OPENAI_API_KEY}`,"Content-Type":"application/json"},
    body:JSON.stringify(createMatchingRequest(input)),signal:AbortSignal.timeout(45000),
  });
  if(!response.ok)throw Error(`Provider failure: HTTP ${response.status}; ${await response.text()}`);
  setStage("response");
  const result=await response.json() as {id:string;status:string;incomplete_details?:{reason?:string};output:{type:string;content?:{type:string;text?:string}[]}[]};
  if(result.status!=="completed" || typeof result.id!=="string" || !Array.isArray(result.output))throw Error(`Incomplete reply: status=${result.status}; reason=${result.incomplete_details?.reason??"not supplied"}`);
  const text=result.output.filter(item=>item.type==="message").flatMap(item=>item.content??[]).filter(item=>item.type==="output_text").map(item=>item.text??"").join("");
  setStage("validation");
  return {matches:validateMatches(JSON.parse(text),input),responseId:result.id};
}
export const run=internalAction({
  args:{linkHash:v.string(),ask:v.string(),requestId:v.string()},returns:matchingResultValidator,
  handler:async(ctx,args):Promise<Result>=>{
    if(!process.env.OPENAI_API_KEY){console.warn("Founder search unavailable",{requestId:safeAiError(args.requestId,process.env.OPENAI_API_KEY),errorMessage:"OPENAI_API_KEY is not configured"});return {status:"busy"};}
    let reservation;
    try{reservation=await ctx.runMutation(internal.matchingStore.reserve,args);}
    catch(error){console.warn("Founder search reservation failed",{requestId:safeAiError(args.requestId,process.env.OPENAI_API_KEY),errorMessage:safeAiError(error,process.env.OPENAI_API_KEY)});throw error;}
    if(reservation.status!=="reserved")return reservation;
    let stage="input";
    console.info("Founder search attempt",{requestId:safeAiError(args.requestId,process.env.OPENAI_API_KEY),searchId:reservation.searchId,status:"started"});
    try {
      const input=await ctx.runQuery(internal.matchingStore.input,{founderDocId:reservation.founderDocId,ask:args.ask.trim()});
      if(!input.operators.length)return await ctx.runMutation(internal.matchingStore.complete,{searchId:reservation.searchId,matches:[],responseId:"no-eligible-operators"});
      const result=await readMatchingReply(input,value=>{stage=value;});
      const matches=result.matches;
      stage="save";
      const finished=await ctx.runMutation(internal.matchingStore.complete,{searchId:reservation.searchId,matches,responseId:result.responseId});
      if(finished.status!=="matched")await ctx.runMutation(internal.matchingStore.fail,{searchId:reservation.searchId});
      console.info("Founder search attempt",{requestId:safeAiError(args.requestId,process.env.OPENAI_API_KEY),searchId:reservation.searchId,status:finished.status});
      return finished;
    } catch(error) {
      console.warn("Founder search failed",{requestId:safeAiError(args.requestId,process.env.OPENAI_API_KEY),searchId:reservation.searchId,stage,errorType:error instanceof Error?error.name:"unknown",errorMessage:safeAiError(error,process.env.OPENAI_API_KEY)});
      await ctx.runMutation(internal.matchingStore.fail,{searchId:reservation.searchId});
      return {status:"busy"};
    }
  },
});

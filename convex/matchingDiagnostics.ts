"use node";
import {internalAction} from "./_generated/server";
import {internal} from "./_generated/api";
import {v} from "convex/values";
import {readMatchingReply} from "./matching";
import {safeWelcomeError as safeAiError} from "./lib/safeWelcomeError";

// Owner CLI only. Uses the exact stored ask/current exclusions without saving matches or charging quota.
export const replayOnce=internalAction({
  args:{searchId:v.id("founderSearches")},
  returns:v.object({status:v.string(),stage:v.string(),errorMessage:v.union(v.string(),v.null()),eligibleOperatorCount:v.number()}),
  handler:async(ctx,args)=>{
    let stage="reserve",eligibleOperatorCount=0;
    try{
      if(!process.env.OPENAI_API_KEY)throw Error("OPENAI_API_KEY is not configured.");
      const saved=await ctx.runMutation(internal.matchingDiagnosticStore.reserveOnce,args);
      stage="input";
      const input=await ctx.runQuery(internal.matchingStore.input,saved);
      eligibleOperatorCount=input.operators.length;
      console.info("Founder search diagnostic",{searchId:args.searchId,status:"started",eligibleOperatorCount});
      if(input.operators.length)await readMatchingReply(input,value=>{stage=value;});
      console.info("Founder search diagnostic",{searchId:args.searchId,status:"succeeded",scoresSaved:false,quotaCharged:false});
      return {status:"succeeded",stage:"completed",errorMessage:null,eligibleOperatorCount};
    }catch(error){
      const errorMessage=safeAiError(error,process.env.OPENAI_API_KEY);
      console.warn("Founder search diagnostic failed",{searchId:args.searchId,stage,errorType:error instanceof Error?error.name:"unknown",errorMessage});
      return {status:"failed",stage,errorMessage,eligibleOperatorCount};
    }
  },
});

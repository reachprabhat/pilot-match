import {internalMutation} from "./_generated/server";
import type {Id} from "./_generated/dataModel";
import {v} from "convex/values";
import {matchValidator} from "./matchingValidators";
// A completed search keeps its original two slots. Retire old queued/in-flight refills.
export const queueForFounder=internalMutation({args:{linkHash:v.string()},returns:v.boolean(),handler:async()=>false});
export const begin=internalMutation({args:{searchId:v.id("founderSearches")},returns:v.union(v.null(),v.object({founderId:v.id("founders"),ask:v.string()})),handler:async():Promise<{founderId:Id<"founders">;ask:string}|null>=>null});
export const finish=internalMutation({args:{searchId:v.id("founderSearches"),matches:v.optional(v.array(matchValidator))},returns:v.null(),handler:async()=>null});

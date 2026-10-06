import {v} from "convex/values";
import {searchStateValidator} from "./searchRules";
export const matchValidator=v.object({operatorId:v.string(),score:v.number(),why:v.string()});
export const matchedValidator=v.object({status:v.literal("matched"),matches:v.array(matchValidator),...searchStateValidator.fields});
export const matchingResultValidator=v.union(matchedValidator,
  v.object({status:v.literal("limit_reached"),...searchStateValidator.fields}),
  v.object({status:v.literal("busy")}),v.object({status:v.literal("invalid_link")}),v.object({status:v.literal("invalid_ask")}));

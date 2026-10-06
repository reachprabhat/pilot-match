import {v} from "convex/values";
export const choiceStatusValidator=v.union(v.literal("Requested"),v.literal("Parked"),v.literal("Rejected"));

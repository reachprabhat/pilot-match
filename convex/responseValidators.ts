import {v} from "convex/values";
export const operatorResponseValidator=v.union(v.literal("Interested"),v.literal("Not relevant"));
export const founderResponseValidator=v.union(v.literal("Accepted"),v.literal("Declined"));

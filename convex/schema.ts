import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { enrichmentValidator } from "./enrichmentValidators";

export default defineSchema({
  founders: defineTable({
    founderId:v.string(), name:v.string(), whatsappNumber:v.string(),
    headline:v.string(),company:v.string(),currentRole:v.string(),location:v.string(),
    about:v.string(),industry:v.string(),pilotDone:v.string(),topFeatures:v.string(),
    freeTextSearches:v.string(),linkHash:v.optional(v.string()),
  }).index("by_founder_id",["founderId"]).index("by_link_hash",["linkHash"]),
  operators: defineTable({
    operatorId: v.string(),
    name: v.string(),
    whatsappNumber: v.string(),
    headline: v.string(),
    company: v.string(),
    researchCompany: v.optional(v.string()),
    allowGlobalRevenue: v.optional(v.boolean()),
    currentRole: v.string(),
    location: v.string(),
    about: v.string(),
    industry: v.string(),
    revenueBand: v.string(),
    companyProblems: v.string(),
    sourceLink: v.string(),
    enrichment: v.optional(enrichmentValidator),
    riskSearch: v.optional(enrichmentValidator),
  }).index("by_operator_id", ["operatorId"]),
  aiCalls: defineTable({
    operatorId: v.string(),
    startedAt: v.number(),
    purpose: v.literal("operator_enrichment"),
  }).index("by_started_at", ["startedAt"]),
});

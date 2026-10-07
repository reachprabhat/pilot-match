import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { enrichmentValidator } from "./enrichmentValidators";
import {matchValidator} from "./matchingValidators";
import {choiceStatusValidator} from "./choiceValidators";
import {operatorResponseValidator} from "./responseValidators";
import {applicationFields} from "./operatorApplicationValidators";

export default defineSchema({
  operatorApplications:defineTable({...applicationFields,submissionId:v.string(),consentText:v.string(),consentedAt:v.number(),status:v.union(v.literal("Pending"),v.literal("Approved")),operatorId:v.optional(v.string()),approvedAt:v.optional(v.number())})
    .index("by_status",["status"]).index("by_submission_id",["submissionId"]),
  introductions: defineTable({requestId:v.id("founderChoices"),searchId:v.id("founderSearches"),requestedAt:v.number(),founderId:v.id("founders"),operatorId:v.string(),status:v.union(v.literal("queued"),v.literal("running"),v.literal("ready"),v.literal("failed")),welcome:v.optional(v.string()),responseId:v.optional(v.string()),callId:v.optional(v.id("aiCalls")),providerCallCount:v.optional(v.number()),founderSeenAt:v.optional(v.number()),operatorSeenAt:v.optional(v.number())})
    .index("by_request_identity",["requestId","requestedAt"]),
  adminLinks: defineTable({owner:v.literal("Prabhat"),linkHash:v.string()})
    .index("by_owner",["owner"]).index("by_link_hash",["linkHash"]),
  operatorResponses: defineTable({requestId:v.id("founderChoices"),searchId:v.id("founderSearches"),requestedAt:v.number(),status:operatorResponseValidator,updatedAt:v.number()})
    .index("by_request",["requestId"]),
  operatorLinks: defineTable({operatorId:v.string(),linkHash:v.string()})
    .index("by_operator_id",["operatorId"]).index("by_link_hash",["linkHash"]),
  operatorRequests: defineTable({founderId:v.id("founders"),operatorId:v.string(),searchId:v.id("founderSearches"),ask:v.string(),requestedAt:v.number()})
    .index("by_founder_operator",["founderId","operatorId"]),
  founderChoices: defineTable({founderId:v.id("founders"),operatorId:v.string(),status:choiceStatusValidator,updatedAt:v.number()})
    .index("by_founder_operator",["founderId","operatorId"]).index("by_founder_status",["founderId","status"]).index("by_operator_status",["operatorId","status"]).index("by_status_updated_at",["status","updatedAt"]),
  founders: defineTable({
    founderId:v.string(), name:v.string(), whatsappNumber:v.string(),
    headline:v.string(),company:v.string(),currentRole:v.string(),location:v.string(),
    about:v.string(),industry:v.string(),pilotDone:v.string(),topFeatures:v.string(),productType:v.optional(v.string()),
    freeTextSearches:v.string(),linkHash:v.optional(v.string()),searchCount:v.optional(v.number()),searchResetVersion:v.optional(v.number()),activeSearchId:v.optional(v.id("founderSearches")),
  }).index("by_founder_id",["founderId"]).index("by_link_hash",["linkHash"]),
  founderSearches: defineTable({
    founderId: v.id("founders"), requestId: v.string(), ask: v.string(), savedAt: v.number(),
    status:v.optional(v.union(v.literal("running"),v.literal("completed"),v.literal("failed"))),
    matches:v.optional(v.array(matchValidator)),runId:v.optional(v.id("aiCalls")),resetVersion:v.optional(v.number()),responseId:v.optional(v.string()),
  }).index("by_founder_request", ["founderId", "requestId"]).index("by_founder_status",["founderId","status"]).index("by_founder_status_saved_at",["founderId","status","savedAt"]).index("by_founder_ask_status",["founderId","ask","status"]),
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
    operatorId: v.optional(v.string()),founderId:v.optional(v.id("founders")),
    startedAt: v.number(),
    purpose: v.union(v.literal("operator_enrichment"),v.literal("founder_matching"),v.literal("accepted_welcome")),
    introductionId:v.optional(v.id("introductions")),
  }).index("by_started_at", ["startedAt"]),
});

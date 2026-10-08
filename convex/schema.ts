import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { enrichmentValidator } from "./enrichmentValidators";
import {matchValidator} from "./matchingValidators";
import {choiceStatusValidator} from "./choiceValidators";
import {operatorResponseValidator} from "./responseValidators";
import {applicationFields} from "./operatorApplicationValidators";

export default defineSchema({
  introductionDrafts:defineTable({requestId:v.id("founderChoices"),requestedAt:v.number(),kind:v.union(v.literal("founder"),v.literal("operator"),v.literal("outreach")),message:v.string(),status:v.union(v.literal("running"),v.literal("ready")),source:v.union(v.literal("ai"),v.literal("template")),startedAt:v.number(),callId:v.optional(v.id("aiCalls")),providerCalled:v.optional(v.boolean())}).index("by_identity",["requestId","requestedAt","kind"]),
  adminIntroductions:defineTable({requestId:v.id("founderChoices"),requestedAt:v.number(),founderOpenedAt:v.optional(v.number()),operatorOpenedAt:v.optional(v.number())}).index("by_request_identity",["requestId","requestedAt"]),
  founderLinkSecrets:defineTable({founderId:v.id("founders"),encryptedCode:v.string()}).index("by_founder",["founderId"]),
  operatorMatchJobs:defineTable({operatorId:v.string(),status:v.union(v.literal("queued"),v.literal("running"),v.literal("ready"),v.literal("failed")),callId:v.optional(v.id("aiCalls")),providerCallCount:v.optional(v.number()),founderCount:v.optional(v.number()),responseId:v.optional(v.string())}).index("by_operator",["operatorId"]),
  founderMatchNotifications:defineTable({founderId:v.id("founders"),operatorId:v.string(),searchId:v.id("founderSearches"),score:v.number(),createdAt:v.number()}).index("by_operator",["operatorId"]).index("by_founder_operator",["founderId","operatorId"]),
  revealSettings:defineTable({key:v.literal("payment"),qrStorageId:v.id("_storage")}).index("by_key",["key"]),
  founderRevealAllowances:defineTable({founderId:v.id("founders"),firstOperatorId:v.string()}).index("by_founder",["founderId"]),
  founderOperatorAccess:defineTable({founderId:v.id("founders"),operatorId:v.string(),free:v.boolean(),paidAt:v.optional(v.number()),grandfathered:v.optional(v.boolean())}).index("by_founder_operator",["founderId","operatorId"]),
  operatorLinkSecrets:defineTable({operatorId:v.string(),encryptedCode:v.string()}).index("by_operator_id",["operatorId"]),
  adminRequestNotifications:defineTable({requestId:v.id("founderChoices"),requestedAt:v.number(),notifiedAt:v.number()}).index("by_request_identity",["requestId","requestedAt"]),
  operatorApplications:defineTable({...applicationFields,industrySelectionVersion:v.optional(v.literal(1)),submissionId:v.string(),consentText:v.string(),consentedAt:v.number(),status:v.union(v.literal("Pending"),v.literal("Approved")),operatorId:v.optional(v.string()),approvedAt:v.optional(v.number())})
    .index("by_status",["status"]).index("by_submission_id",["submissionId"]),
  introductions: defineTable({requestId:v.id("founderChoices"),searchId:v.id("founderSearches"),requestedAt:v.number(),founderId:v.id("founders"),operatorId:v.string(),status:v.union(v.literal("queued"),v.literal("running"),v.literal("ready"),v.literal("failed")),welcome:v.optional(v.string()),responseId:v.optional(v.string()),callId:v.optional(v.id("aiCalls")),providerCallCount:v.optional(v.number()),automaticRetryUsed:v.optional(v.boolean()),automaticRetryProviderCallCount:v.optional(v.number()),retryNotBefore:v.optional(v.number()),diagnosticRetryUsed:v.optional(v.boolean()),diagnosticProviderCallCount:v.optional(v.number()),founderSeenAt:v.optional(v.number()),operatorSeenAt:v.optional(v.number())})
    .index("by_request_identity",["requestId","requestedAt"]).index("by_founder",["founderId"]),
  adminLinks: defineTable({owner:v.literal("Prabhat"),linkHash:v.string()})
    .index("by_owner",["owner"]).index("by_link_hash",["linkHash"]),
  operatorResponses: defineTable({requestId:v.id("founderChoices"),searchId:v.id("founderSearches"),requestedAt:v.number(),status:operatorResponseValidator,updatedAt:v.number()})
    .index("by_request",["requestId"]),
  operatorLinks: defineTable({operatorId:v.string(),linkHash:v.string()})
    .index("by_operator_id",["operatorId"]).index("by_link_hash",["linkHash"]),
  operatorRequests: defineTable({founderId:v.id("founders"),operatorId:v.string(),searchId:v.id("founderSearches"),ask:v.string(),requestedAt:v.number()})
    .index("by_founder_operator",["founderId","operatorId"]).index("by_founder",["founderId"]),
  founderChoices: defineTable({founderId:v.id("founders"),operatorId:v.string(),status:choiceStatusValidator,updatedAt:v.number()})
    .index("by_founder_operator",["founderId","operatorId"]).index("by_founder_status",["founderId","status"]).index("by_operator_status",["operatorId","status"]).index("by_status_updated_at",["status","updatedAt"]),
  founders: defineTable({
    founderId:v.string(), name:v.string(), whatsappNumber:v.string(),
    headline:v.string(),company:v.string(),currentRole:v.string(),location:v.string(),
    about:v.string(),industry:v.string(),pilotDone:v.string(),topFeatures:v.string(),productType:v.optional(v.string()),
    freeTextSearches:v.string(),linkHash:v.optional(v.string()),searchCount:v.optional(v.number()),searchDay:v.optional(v.string()),searchResetVersion:v.optional(v.number()),activeSearchId:v.optional(v.id("founderSearches")),
  }).index("by_founder_id",["founderId"]).index("by_link_hash",["linkHash"]),
  founderSearches: defineTable({
    founderId: v.id("founders"), requestId: v.string(), ask: v.string(), savedAt: v.number(),
    status:v.optional(v.union(v.literal("running"),v.literal("completed"),v.literal("failed"))),
    originalMatches:v.optional(v.array(matchValidator)),matches:v.optional(v.array(matchValidator)),runId:v.optional(v.id("aiCalls")),resetVersion:v.optional(v.number()),responseId:v.optional(v.string()),searchDay:v.optional(v.string()),refreshState:v.optional(v.union(v.literal("queued"),v.literal("running"),v.literal("failed"))),candidateVersion:v.optional(v.number()),refreshVersion:v.optional(v.number()),
  }).index("by_founder_request", ["founderId", "requestId"]).index("by_founder_status",["founderId","status"]).index("by_founder_status_saved_at",["founderId","status","savedAt"]).index("by_founder_ask_status",["founderId","ask","status"]),
  operators: defineTable({
    operatorId: v.string(),
    operatorNumber: v.optional(v.number()),
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
    diagnosticSearchId:v.optional(v.id("founderSearches")),
    operatorId: v.optional(v.string()),founderId:v.optional(v.id("founders")),
    startedAt: v.number(),
    purpose: v.union(v.literal("operator_enrichment"),v.literal("founder_matching"),v.literal("accepted_welcome"),v.literal("operator_approval_matching"),v.literal("introduction_draft")),
    introductionId:v.optional(v.id("introductions")),
  }).index("by_started_at", ["startedAt"]).index("by_diagnostic_search",["diagnosticSearchId"]),
});

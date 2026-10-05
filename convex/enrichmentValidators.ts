import { v } from "convex/values";

export const factValidator = v.object({
  value: v.string(), sourceUrl: v.union(v.string(), v.null()), evidence: v.string(),
});
export const factsValidator = v.object({
  revenueBand: factValidator,
  industry: factValidator,
  companyProblems: v.array(factValidator),
});
export const enrichmentValidator = v.object({
  status: v.union(v.literal("running"), v.literal("completed"), v.literal("failed")),
  attempts: v.number(),
  runId: v.id("aiCalls"),
  startedAt: v.number(),
  completedAt: v.optional(v.number()),
  webSearchCalls: v.optional(v.number()),
  responseId: v.optional(v.string()),
  error: v.optional(v.string()),
  facts: v.optional(factsValidator),
  consultedSources: v.optional(v.array(v.string())),
});

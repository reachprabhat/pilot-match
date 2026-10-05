import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  operators: defineTable({
    operatorId: v.string(),
    name: v.string(),
    whatsappNumber: v.string(),
    headline: v.string(),
    company: v.string(),
    currentRole: v.string(),
    location: v.string(),
    about: v.string(),
    industry: v.string(),
    revenueBand: v.string(),
    companyProblems: v.string(),
    sourceLink: v.string(),
  }).index("by_operator_id", ["operatorId"]),
});

import { internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { SEARCH_LIMIT, searchState, searchStateValidator } from "./searchRules";

export const submit = internalMutation({
  args: {linkHash: v.string(), requestId: v.string(), ask: v.string()},
  returns: v.union(
    v.object({status: v.literal("saved"), ...searchStateValidator.fields}),
    v.object({status: v.literal("limit_reached"), ...searchStateValidator.fields}),
    v.object({status: v.literal("invalid_link")}),
    v.object({status: v.literal("invalid_ask")}),
  ),
  handler: async (ctx, args) => {
    if (!/^[a-f0-9]{64}$/.test(args.linkHash)) return {status: "invalid_link" as const};
    const ask = args.ask.trim();
    if (!ask || ask.length > 12000 || ask.split(/\s+/u).length > 300 || !/^[A-Za-z0-9_-]{16,80}$/.test(args.requestId))
      return {status: "invalid_ask" as const};
    const founder = await ctx.db.query("founders").withIndex("by_link_hash", q => q.eq("linkHash", args.linkHash)).unique();
    if (!founder) return {status: "invalid_link" as const};
    const state = searchState(founder.searchCount);
    const existing = await ctx.db.query("founderSearches").withIndex("by_founder_request", q => q.eq("founderId", founder._id).eq("requestId", args.requestId)).unique();
    if (existing) {
      if (existing.ask !== ask) return {status: "invalid_ask" as const};
      return {status: "saved" as const, ...state};
    }
    if (state.searchCount >= SEARCH_LIMIT) return {status: "limit_reached" as const, ...state};
    // Both writes commit together or neither does. Concurrent calls retry against the new count.
    await ctx.db.insert("founderSearches", {founderId: founder._id, requestId: args.requestId, ask, savedAt: Date.now()});
    await ctx.db.patch(founder._id, {searchCount: state.searchCount + 1});
    return {status: "saved" as const, ...searchState(state.searchCount + 1)};
  },
});

// Owner only: run from the authenticated Convex dashboard or CLI. No public reset route.
// Dashboard example: {"founderId":"1"}. This is the sheet ID, never the Convex _id.
export const reset = internalMutation({
  args: {founderId: v.string()}, returns: searchStateValidator,
  handler: async (ctx, args) => {
    const founderId = args.founderId.trim();
    const founder = await ctx.db.query("founders").withIndex("by_founder_id", q => q.eq("founderId", founderId)).unique();
    if (!founder) throw new Error('Founder not found. Use the founderId from your sheet, such as "1" or "2", not the Convex _id. Check that you selected the correct deployment.');
    await ctx.db.patch(founder._id, {searchCount: 0});
    return searchState(0);
  },
});

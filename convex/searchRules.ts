import { v } from "convex/values";

// Owner-controlled limit. Existing founders without a count start at zero.
export const SEARCH_LIMIT = 3;
export const searchStateValidator = v.object({searchCount: v.number(), searchLimit: v.number(), searchesRemaining: v.number()});
export function searchState(count = 0) {
  return {searchCount: count, searchLimit: SEARCH_LIMIT, searchesRemaining: Math.max(0, SEARCH_LIMIT - count)};
}

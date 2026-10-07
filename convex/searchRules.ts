import { v } from "convex/values";

// Owner-controlled limit. Existing founders without a count start at zero.
export const SEARCH_LIMIT = 3;
export const searchStateValidator = v.object({searchCount: v.number(), searchLimit: v.number(), searchesRemaining: v.number()});
export function searchState(count = 0) {
  return {searchCount: count, searchLimit: SEARCH_LIMIT, searchesRemaining: Math.max(0, SEARCH_LIMIT - count)};
}
export function indiaDay(now=Date.now()){return new Date(now+19800000).toISOString().slice(0,10);}
export function dailySearchState(founder:{searchCount?:number;searchDay?:string},now=Date.now()){
  return searchState(founder.searchDay===indiaDay(now)?founder.searchCount:0);
}

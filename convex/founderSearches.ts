import { internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { searchState, searchStateValidator } from "./searchRules";

// Owner only: run from the authenticated Convex dashboard or CLI. No public reset route.
// Dashboard example: {"founderId":"1"}. This is the sheet ID, never the Convex _id.
export const reset = internalMutation({
  args: {founderId: v.string()}, returns: searchStateValidator,
  handler: async (ctx, args) => {
    const founderId = args.founderId.trim();
    const founder = await ctx.db.query("founders").withIndex("by_founder_id", q => q.eq("founderId", founderId)).unique();
    if (!founder) throw new Error('Founder not found. Use the founderId from your sheet, such as "1" or "2", not the Convex _id. Check that you selected the correct deployment.');
    const running=await ctx.db.query("founderSearches").withIndex("by_founder_status",q=>q.eq("founderId",founder._id).eq("status","running")).take(10);
    for(const search of running)await ctx.db.patch(search._id,{status:"failed"});
    await ctx.db.patch(founder._id, {searchCount: 0,searchResetVersion:(founder.searchResetVersion??0)+1});
    return searchState(0);
  },
});

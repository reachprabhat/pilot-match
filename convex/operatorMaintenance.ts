import { internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { repairDash } from "./lib/repairDash";

// Owner-only repair: no profile text or contact details leave this function.
export const repairOperatorFiveDash = internalMutation({
  args: {},
  returns: v.object({
    found: v.boolean(),
    currentRoleChanged: v.boolean(),
    headlineChanged: v.boolean(),
  }),
  handler: async (ctx) => {
    const operator = await ctx.db
      .query("operators")
      .withIndex("by_operator_id", (q) => q.eq("operatorId", "5"))
      .unique();
    if (!operator) {
      return { found: false, currentRoleChanged: false, headlineChanged: false };
    }
    const currentRole = repairDash(operator.currentRole);
    const headline = repairDash(operator.headline);
    await ctx.db.patch(operator._id, { currentRole, headline });
    return {
      found: true,
      currentRoleChanged: currentRole !== operator.currentRole,
      headlineChanged: headline !== operator.headline,
    };
  },
});

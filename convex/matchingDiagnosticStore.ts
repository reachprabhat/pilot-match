import {internalMutation} from "./_generated/server";
import {v} from "convex/values";

export const reserveOnce=internalMutation({
  args:{searchId:v.id("founderSearches")},
  returns:v.object({founderDocId:v.id("founders"),ask:v.string()}),
  handler:async(ctx,args)=>{
    const search=await ctx.db.get(args.searchId);
    if(!search)throw Error("Saved search not found.");
    if(await ctx.db.query("aiCalls").withIndex("by_diagnostic_search",q=>q.eq("diagnosticSearchId",args.searchId)).first())throw Error("This diagnostic replay has already been used.");
    const calls=await ctx.db.query("aiCalls").withIndex("by_started_at",q=>q.gte("startedAt",Date.now()-3600000)).take(100);
    if(calls.length>=100)throw Error("Hourly AI call cap reached (100).");
    await ctx.db.insert("aiCalls",{founderId:search.founderId,startedAt:Date.now(),purpose:"founder_matching",diagnosticSearchId:search._id});
    return {founderDocId:search.founderId,ask:search.ask};
  },
});

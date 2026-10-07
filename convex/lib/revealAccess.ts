import type {MutationCtx,QueryCtx} from "../_generated/server";
import type {Doc} from "../_generated/dataModel";
import {currentResponse} from "./meetingResponses";

export const accessFor=(ctx:QueryCtx,choice:Doc<"founderChoices">)=>ctx.db.query("founderOperatorAccess").withIndex("by_founder_operator",q=>q.eq("founderId",choice.founderId).eq("operatorId",choice.operatorId)).unique();

// One permanent free operator per founder, allocated within the acceptance transaction.
export async function ensureAccess(ctx:MutationCtx,choice:Doc<"founderChoices">){
  let allowance=await ctx.db.query("founderRevealAllowances").withIndex("by_founder",q=>q.eq("founderId",choice.founderId)).unique();
  if(!allowance){
    const history=await ctx.db.query("introductions").withIndex("by_founder",q=>q.eq("founderId",choice.founderId)).take(1001);
    if(history.length>1000)throw new Error("Reveal history needs owner review.");
    const revealed=history.filter(row=>row.founderSeenAt!==undefined).sort((a,b)=>a.founderSeenAt!-b.founderSeenAt!||a._creationTime-b._creationTime);
    let freeOperatorId=revealed[0]?.operatorId;
    if(freeOperatorId===undefined){
      const choices=await ctx.db.query("founderChoices").withIndex("by_founder_status",q=>q.eq("founderId",choice.founderId).eq("status","Requested")).take(1001);
      if(choices.length>1000)throw new Error("Request history needs owner review.");
      let earliest=Infinity;
      for(const candidate of choices){const response=await currentResponse(ctx,candidate);if(response?.status==="Interested"&&response.updatedAt<earliest){earliest=response.updatedAt;freeOperatorId=candidate.operatorId;}}
    }
    const id=await ctx.db.insert("founderRevealAllowances",{founderId:choice.founderId,...(freeOperatorId!==undefined?{freeOperatorId}:{})});
    allowance=(await ctx.db.get(id))!;
    // Preserve every historical founder reveal without modifying its intro or profile.
    for(const row of revealed){
      const existing=await ctx.db.query("founderOperatorAccess").withIndex("by_founder_operator",q=>q.eq("founderId",row.founderId).eq("operatorId",row.operatorId)).unique();
      if(!existing)await ctx.db.insert("founderOperatorAccess",{founderId:row.founderId,operatorId:row.operatorId,status:"grandfathered"});
    }
  }
  let access=await accessFor(ctx,choice);
  if(!access){
    const free=allowance.freeOperatorId===undefined||allowance.freeOperatorId===choice.operatorId;
    if(allowance.freeOperatorId===undefined)await ctx.db.patch(allowance._id,{freeOperatorId:choice.operatorId});
    const id=await ctx.db.insert("founderOperatorAccess",{founderId:choice.founderId,operatorId:choice.operatorId,status:free?"free":"locked"});
    access=(await ctx.db.get(id))!;
  }
  if(access.status==="locked"&&access.price===undefined){
    const settings=await ctx.db.query("revealSettings").withIndex("by_key",q=>q.eq("key","founder_reveals")).unique();
    if(settings){await ctx.db.patch(access._id,{price:settings.price,paymentLink:settings.paymentLink});access=(await ctx.db.get(access._id))!;}
  }
  return access;
}

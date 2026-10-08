import type {QueryCtx} from "../_generated/server";

export function publicOperatorNumber(operator:{operatorId:string;operatorNumber?:number}){
  const number=operator.operatorNumber??(/^[1-9]\d*$/.test(operator.operatorId)?Number(operator.operatorId):null);
  return number!==null&&Number.isSafeInteger(number)&&number>0?number:null;
}

// Reading the operator set inside the approval transaction also protects concurrent approvals.
export async function nextOperatorNumber(ctx:QueryCtx){
  const operators=await ctx.db.query("operators").withIndex("by_operator_id").take(10001);
  if(operators.length>10000)throw Error("Operator numbering capacity reached.");
  const next=Math.max(0,...operators.map(operator=>publicOperatorNumber(operator)??0))+1;
  if(!Number.isSafeInteger(next))throw Error("Operator numbering capacity reached.");
  return next;
}

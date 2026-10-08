// Controlled proof: actual welcome/store handlers and SDK, invented records, no real database or HTTP writes.
import {getFunctionName} from "convex/server";
import type {ActionCtx} from "../convex/_generated/server";
import type {Id} from "../convex/_generated/dataModel";
import {runAcceptedWelcome} from "../convex/introductionWelcome";
import * as store from "../convex/introductionStore";
import * as introductions from "../convex/introductions";

export async function runWelcomeRetryProof(retrySucceeds:boolean){
  const tables:Record<string,any[]>={
    founders:[{_id:"fictional-founder",founderId:"F1",linkHash:"fictional-founder-link",name:"Fictional Founder",whatsappNumber:"+19995550101",company:"Example Tools",about:"Pilot planning"}],
    operators:[{_id:"fictional-operator",operatorId:"1",name:"Fictional Operator",whatsappNumber:"+19995550102",company:"Example Factory"}],
    founderChoices:[{_id:"fictional-choice",founderId:"fictional-founder",operatorId:"1",status:"Requested",updatedAt:1}],
    operatorRequests:[{_id:"fictional-request",founderId:"fictional-founder",operatorId:"1",searchId:"fictional-search",requestedAt:1,ask:"A fictional pilot."}],
    operatorResponses:[{_id:"fictional-response",requestId:"fictional-choice",searchId:"fictional-search",requestedAt:1,status:"Interested"}],
    introductions:[{_id:"fictional-introduction",requestId:"fictional-choice",searchId:"fictional-search",requestedAt:1,founderId:"fictional-founder",operatorId:"1",status:"queued"}],
    aiCalls:[],founderOperatorAccess:[{_id:"fictional-access",founderId:"fictional-founder",operatorId:"1",free:true}],founderRevealAllowances:[],operatorLinks:[],
  };
  let sequence=0,transportCalls=0;
  const scheduled:{delay:number;args:any}[]=[];
  const db={
    get:async(id:string)=>Object.values(tables).flat().find(r=>r._id===id)??null,
    insert:async(table:string,row:any)=>{const id="fictional-row-"+(++sequence);tables[table].push({...row,_id:id});return id;},
    patch:async(id:string,fields:any)=>{const row=await db.get(id);for(const [key,value]of Object.entries(fields)){if(value===undefined)delete row[key];else row[key]=value;}},
    query:(table:string)=>({withIndex:(_index:string,select?:any)=>{
      const tests:((row:any)=>boolean)[]=[];
      const q={eq:(key:string,value:unknown)=>{tests.push(row=>row[key]===value);return q;},gte:(key:string,value:number)=>{tests.push(row=>row[key]>=value);return q;}};
      select?.(q);const rows=()=>tables[table].filter(row=>tests.every(test=>test(row)));
      return {unique:async()=>rows()[0]??null,take:async(n:number)=>rows().slice(0,n),paginate:async()=>({page:rows(),continueCursor:"",isDone:true})};
    }}),
  };
  const mutationCtx={db,scheduler:{runAfter:async(delay:number,_fn:unknown,args:any)=>{scheduled.push({delay,args});}}};
  const invoke=(fn:unknown,args:any)=>(fn as {_handler:(ctx:any,args:any)=>Promise<any>})._handler(mutationCtx,args);
  const actionCtx={runMutation:async(ref:any,args:any)=>{
    const name=getFunctionName(ref).split(":")[1];
    const fn=(store as Record<string,unknown>)[name];
    if(!fn)throw Error("Unexpected proof mutation.");
    return invoke(fn,args);
  }} as unknown as ActionCtx;
  const transport:typeof fetch=async()=>{
    transportCalls++;
    if(transportCalls===1||!retrySucceeds)throw Error("Forced dev proof provider failure; no external request sent.");
    return new Response(JSON.stringify({id:"resp_fictional_retry",object:"response",created_at:1,status:"completed",model:"gpt-6-luna",output:[{id:"msg_fictional",type:"message",role:"assistant",status:"completed",content:[{type:"output_text",annotations:[],text:JSON.stringify({sentences:["Welcome to your connection.","Start a conversation on WhatsApp."]})}]}],usage:{input_tokens:1,output_tokens:20,total_tokens:21}}),{status:200,headers:{"Content-Type":"application/json"}});
  };
  const args={introductionId:"fictional-introduction" as Id<"introductions">};
  await runAcceptedWelcome(actionCtx,args,transport);
  const queued=tables.introductions[0];
  if(queued.status!=="queued"||scheduled.length!==1||scheduled[0].delay!==3000)throw Error("First failure did not schedule exactly one three-second retry.");
  const firstScreen=await invoke(introductions.list,{role:"founder",linkHash:"fictional-founder-link",paginationOpts:{numItems:20,cursor:null}});
  if(firstScreen.failed||!firstScreen.pending)throw Error("Busy became visible before the retry finished.");
  if(await invoke(store.reserve,args)!==null)throw Error("Retry ran before its three-second deadline.");
  await new Promise(resolve=>setTimeout(resolve,Math.max(0,queued.retryNotBefore-Date.now())));
  const retryStartedAt=Date.now();
  const waitedMs=retryStartedAt-(queued.retryNotBefore-3000);
  await runAcceptedWelcome(actionCtx,args,transport);
  await runAcceptedWelcome(actionCtx,args,transport);
  const final=tables.introductions[0];
  if(transportCalls!==2||final.providerCallCount!==2||tables.aiCalls.length!==2||scheduled.length!==1)throw Error("More or fewer than two attempts.");
  if(final.status!==(retrySucceeds?"ready":"failed"))throw Error("Wrong final retry status.");
  const lastScreen=await invoke(introductions.list,{role:"founder",linkHash:"fictional-founder-link",paginationOpts:{numItems:20,cursor:null}});
  if(lastScreen.failed===retrySucceeds||lastScreen.pending)throw Error("Wrong Busy status after retry.");
  const proof={controlledTransport:true,realProviderCalls:0,transportAttempts:transportCalls,delayMs:3000,waitedMs,firstFailureBusy:false,finalStatus:final.status,finalBusy:lastScreen.failed,usageRows:tables.aiCalls.length,thirdAttemptBlocked:true};
  console.info("Accepted welcome retry proof",proof);
  return proof;
}

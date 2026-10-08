const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),esbuild=require('esbuild');
const validator=new Proxy(()=>validator,{get:()=>validator});
function load(file,extra={}) {
  const context={module:{exports:{}},Date,Set,Map,AbortSignal,process:{env:{OPENAI_API_KEY:'fictional-test-key'}},...extra};
  context.require=name=>name==='convex/values'?{v:validator}:name==='./_generated/server'?{internalMutation:x=>x,internalQuery:x=>x,internalAction:x=>x}:name==='./_generated/api'?{internal:{matchingStore:{reserve:'reserve',input:'input',complete:'complete',fail:'fail'}}}:load(path.join(path.dirname(file),name+'.ts'),extra);
  vm.runInNewContext(esbuild.transformSync(fs.readFileSync(file,'utf8'),{loader:'ts',format:'cjs'}).code,context);return context.module.exports;
}
(async()=>{
  const privacy=load('convex/lib/matching.ts');
  const founder={founderId:'example-founder',name:'Priya Example',whatsappNumber:'919876543210',about:'Priya Example offers bottleneck detection. Call +91 98765 43210.',company:'Example Factory',headline:'Factory AI',currentRole:'Founder',industry:'Manufacturing',topFeatures:'Detect bottlenecks',pilotDone:'No'};
  const operators=[{operatorId:'example-1',name:'Rohan Sample',whatsappNumber:'918765432109',about:'Rohan Sample leads manufacturing; rohan@example.com',headline:'Manufacturing leader',currentRole:'Operations lead',industry:'Manufacturing',revenueBand:'200 Cr+',companyProblems:'Production delays',company:'Example Manufacturing'}, {operatorId:'example-2',name:'Mira Demo',whatsappNumber:'917654321098',about:'Mira Demo leads retail operations',headline:'Retail leader',currentRole:'Operations',industry:'Retail',revenueBand:'not found',companyProblems:'not found',company:'Example Retail'}];
  const input=privacy.prepareInput(founder,operators,'Priya Example needs a manufacturing pilot. Contact 9876543210.');
  const body=privacy.createMatchingRequest(input);
  assert.equal(body.model,'gpt-6-luna');assert.equal(body.reasoning.effort,'low');assert.equal(body.max_output_tokens,1200);assert.equal(body.store,false);assert.equal(body.tools,undefined);
  const outbound=JSON.stringify(body);
  for(const secret of ['Priya','Example offers','Rohan','Mira','919876543210','9876543210','rohan@example.com']) assert.equal(outbound.includes(secret),false,secret+' must stay private');
  assert.equal(Object.keys(JSON.parse(body.input).operators[0]).sort().join(','),'operatorId,profileText');
  const good={matches:[{operatorId:'example-2',score:70,why:'Retail operations may help a pilot.'},{operatorId:'example-1',score:93,why:'Manufacturing leadership fits bottleneck detection.'}]};
  assert.equal(privacy.validateMatches(good,input).map(m=>m.operatorId).join(','),'example-1,example-2');
  for(const bad of [{matches:[]},{matches:[good.matches[0],good.matches[0]]},{matches:[{...good.matches[0],operatorId:'unknown'},good.matches[1]]},{matches:[{...good.matches[0],score:101},good.matches[1]]},{matches:[{...good.matches[0],score:1.5},good.matches[1]]},{matches:[{...good.matches[0],why:'Contact Rohan Sample at 9876543210'},good.matches[1]]}]) assert.throws(()=>privacy.validateMatches(bad,input));
  let calls=0,finished=0,failed=0;
  const ctx={runMutation:async(fn,args)=>{if(fn==='reserve')return {status:'reserved',searchId:'fictional-search',founderDocId:'fictional-founder'};if(fn==='complete'){finished++;return {status:'matched',matches:args.matches,searchCount:1,searchLimit:3,searchesRemaining:2};}if(fn==='fail'){failed++;return null;}throw Error('Unexpected mutation');},runQuery:async()=>input};
  const action=load('convex/matching.ts',{fetch:async()=>{calls++;return {ok:true,json:async()=>({status:'completed',id:'fictional-response',output:[{type:'message',content:[{type:'output_text',text:JSON.stringify(good)}]}]})};}}).run;
  const args={linkHash:'a'.repeat(64),ask:'Fictional pilot',requestId:'fictional-request'};
  assert.equal((await action.handler(ctx,args)).status,'matched');assert.equal(calls,1);assert.equal(finished,1);assert.equal(failed,0);
  for(const response of [{ok:false,status:503,text:async()=>'{"error":"Fictional provider unavailable"}'},{ok:true,json:async()=>({status:'incomplete',output:[]})},{ok:true,json:async()=>({status:'completed',output:[{type:'message',content:[{type:'output_text',text:'{}'}]}]})}]) {
    const before=finished;calls=0;
    const run=load('convex/matching.ts',{fetch:async()=>{calls++;return response;}}).run;
    assert.equal((await run.handler(ctx,args)).status,'busy');assert.equal(calls,1);assert.equal(finished,before);
  }
  const logs=[];const logged=load('convex/matching.ts',{console:{info:()=>{},warn:(...args)=>logs.push(args)},fetch:async()=>({ok:false,status:429,text:async()=>JSON.stringify({error:'Fictional failure: fictional-test-key +91 (99955) 50101'})})}).run;assert.equal((await logged.handler(ctx,args)).status,'busy');assert.equal(logs.length,1);const message=logs[0][1].errorMessage;assert(message.includes('HTTP 429'));assert(message.includes('Fictional failure'));assert(!message.includes('fictional-test-key'));assert(!message.includes('99955'));assert.equal(logs[0][1].stage,'provider');
  calls=0;
  assert.equal((await action.handler({...ctx,runMutation:async()=>({status:'matched',matches:privacy.validateMatches(good,input),searchCount:1,searchLimit:3,searchesRemaining:2})},args)).status,'matched');assert.equal(calls,0);
  console.log('Matching checks passed: private request, one call, no tools/retries, known distinct IDs, valid scores, failed/incomplete replies cost zero, cached results make no new call.');
})().catch(error=>{console.error(error);process.exitCode=1;});

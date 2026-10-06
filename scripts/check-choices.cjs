const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),esbuild=require('esbuild');
const validator=new Proxy(()=>validator,{get:()=>validator});
const context={module:{exports:{}},require:n=>n==='./_generated/server'?{internalQuery:x=>x,internalMutation:x=>x}:n==='./choiceValidators'?{choiceStatusValidator:validator}:n==='./matchingValidators'?{matchValidator:{fields:{}}}:{v:validator}};
vm.runInNewContext(esbuild.transformSync(fs.readFileSync('convex/choices.ts','utf8'),{loader:'ts',format:'cjs'}).code,context);
const {save,latest}=context.module.exports;
const founders=[{_id:'fictional-founder-1',linkHash:'a'.repeat(64)},{_id:'fictional-founder-2',linkHash:'b'.repeat(64)}];
const searches=[{founderId:founders[0]._id,status:'completed',ask:'A fictional manufacturing pilot',matches:[{operatorId:'example-one',score:90,why:'Example fit'},{operatorId:'example-two',score:80,why:'Example fit'}]}];
const choices=[];const tables={founders,founderSearches:searches,founderChoices:choices};
const db={query:table=>({withIndex:(index,callback)=>{
  const conditions=[];const q={eq:(key,value)=>{conditions.push([key,value]);return q;}};callback(q);
  const rows=()=>tables[table].filter(row=>conditions.every(([key,value])=>row[key]===value));
  const result={unique:async()=>rows()[0]??null,first:async()=>rows().at(-1)??null,order:()=>result};return result;
}}),insert:async(table,row)=>{assert.equal(table,'founderChoices');choices.push({...row,_id:'choice-'+choices.length});},patch:async(id,fields)=>{const row=choices.find(row=>row._id===id);assert.ok(row,'only choice rows may be changed');Object.assign(row,fields);}};
(async()=>{
 const baseline=JSON.stringify({founders,searches});
 for(const status of ['Requested','Parked','Rejected']){
   for(const operatorId of ['example-one','example-two']){
     const result=await save.handler({db},{linkHash:founders[0].linkHash,operatorId,status});assert.equal(result.status,status);
     assert.equal((await latest.handler({db},{linkHash:founders[0].linkHash})).matches.find(m=>m.operatorId===operatorId).choice,status);
   }
   assert.equal(choices.length,2,'updates preserve one choice per pair');
 }
 assert.equal(JSON.stringify({founders,searches}),baseline,'choices leave founders, counts and matching results untouched');
 assert.equal((await save.handler({db},{linkHash:founders[1].linkHash,operatorId:'example-one',status:'Requested'})).error,'invalid_match');
 assert.equal((await save.handler({db},{linkHash:founders[0].linkHash,operatorId:'unmatched',status:'Requested'})).error,'invalid_match');
 assert.equal((await save.handler({db},{linkHash:'unknown',operatorId:'example-one',status:'Requested'})).error,'invalid_link');
 assert.equal(await latest.handler({db},{linkHash:'unknown'}),null);
 assert.equal((await latest.handler({db},{linkHash:founders[0].linkHash})).ask,'A fictional manufacturing pilot');
 assert.deepEqual(JSON.parse(JSON.stringify(await latest.handler({db},{linkHash:founders[1].linkHash}))),{ask:'',matches:[]});
 console.log('Choice checks passed: all three statuses reload, one row per founder/operator, other founders and unmatched operators blocked, no search or matching writes.');
})().catch(error=>{console.error(error);process.exitCode=1;});

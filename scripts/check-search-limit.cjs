const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),esbuild=require('esbuild');
const validator=new Proxy(()=>validator,{get:()=>validator});
function load(file) {
  const context={module:{exports:{}},Date,Set,require:name=>name==='convex/values'?{v:validator}:name==='./_generated/server'?{internalMutation:x=>x,internalQuery:x=>x}:load(path.join(path.dirname(file),name+'.ts'))};
  vm.runInNewContext(esbuild.transformSync(fs.readFileSync(file,'utf8'),{loader:'ts',format:'cjs'}).code,context);return context.module.exports;
}
(async()=>{
  const store=load('convex/matchingStore.ts'),reset=load('convex/founderSearches.ts').reset;
  const tables={founders:[{_id:'fictional-one',founderId:'1',linkHash:'a'.repeat(64)},{_id:'fictional-two',founderId:'2',linkHash:'b'.repeat(64)}],founderSearches:[],aiCalls:[]};
  let sequence=0,failInsert=false;
  const db={
    get:async id=>Object.values(tables).flat().find(row=>row._id===id)||null,
    query:table=>({withIndex:(index,select)=>{const conditions=[];const q={eq:(key,value)=>{conditions.push(row=>row[key]===value);return q;},gte:(key,value)=>{conditions.push(row=>row[key]>=value);return q;}};if(select)select(q);const rows=()=>tables[table].filter(row=>conditions.every(test=>test(row)));return {unique:async()=>rows()[0]||null,take:async n=>rows().slice(0,n)};}}),
    insert:async(table,value)=>{if(failInsert)throw Error('Database unavailable');const id='fictional-'+(++sequence);tables[table].push({_id:id,...value});return id;},
    patch:async(id,patch)=>Object.assign(await db.get(id),patch),
  };
  const ctx={db}, args=n=>({linkHash:tables.founders[0].linkHash,requestId:'fictional-request-'+n,ask:'A fictional pilot'});
  const matches=[{operatorId:'fictional-op-a',score:90,why:'Manufacturing leadership fits the pilot.'},{operatorId:'fictional-op-b',score:80,why:'Operations experience supports a pilot.'}];
  for(const ask of ['', ' ', 'word '.repeat(301)])assert.equal((await store.reserve.handler(ctx,{...args(0),ask})).status,'invalid_ask');
  failInsert=true;await assert.rejects(store.reserve.handler(ctx,args(1)),/unavailable/);assert.equal(tables.founders[0].searchCount,undefined);failInsert=false;
  const failed=await store.reserve.handler(ctx,args('failed'));assert.equal(failed.status,'reserved');
  assert.equal((await store.reserve.handler(ctx,args('concurrent'))).status,'busy');
  await store.fail.handler(ctx,{searchId:failed.searchId});assert.equal(tables.founders[0].searchCount,undefined);
  assert.equal((await store.reserve.handler(ctx,args('failed'))).status,'busy','no automatic retry after failure');
  for(let n=1;n<=3;n++) {
    const reserved=await store.reserve.handler(ctx,args(n));assert.equal(reserved.status,'reserved');
    assert.equal(tables.founders[0].searchCount??0,n-1,'reserving never charges a search');
    const result=await store.complete.handler(ctx,{searchId:reserved.searchId,matches,responseId:'fictional-response'});
    assert.equal(result.searchesRemaining,3-n);assert.equal(tables.founders[0].searchCount,n);
    const calls=tables.aiCalls.length;assert.equal((await store.reserve.handler(ctx,args(n))).status,'matched');assert.equal(tables.aiCalls.length,calls);
    assert.equal((await store.complete.handler(ctx,{searchId:reserved.searchId,matches,responseId:'again'})).status,'busy');assert.equal(tables.founders[0].searchCount,n);
  }
  assert.equal((await store.reserve.handler(ctx,args(4))).status,'limit_reached');
  await assert.rejects(reset.handler(ctx,{founderId:tables.founders[0]._id}),/founderId from your sheet.*not.*_id/);
  assert.equal((await reset.handler(ctx,{founderId:' 1 '})).searchesRemaining,3);
  assert.equal(tables.founders[0].searchCount,0);assert.equal(tables.founders[1].searchCount,undefined);
  const before=tables.founderSearches.length;assert.equal((await store.reserve.handler(ctx,args(1))).searchesRemaining,3);assert.equal(tables.founderSearches.length,before);
  const interrupted=await store.reserve.handler(ctx,args('reset-in-flight'));await reset.handler(ctx,{founderId:'1'});
  assert.equal((await store.complete.handler(ctx,{searchId:interrupted.searchId,matches,responseId:'late'})).status,'busy');assert.equal(tables.founders[0].searchCount,0);
  tables.aiCalls=Array.from({length:100},(_,n)=>({_id:'hourly-'+n,startedAt:Date.now(),purpose:'operator_enrichment'}));
  assert.equal((await store.reserve.handler(ctx,args('hourly-cap'))).status,'busy');assert.equal(tables.founders[0].searchCount,0);
  assert.equal((await store.reserve.handler(ctx,{...args('unknown'),linkHash:'c'.repeat(64)})).status,'invalid_link');
  await assert.rejects(reset.handler(ctx,{founderId:'unknown'}),/not found/);
  console.log('Search checks passed: success-only counting, failure costs zero, three per founder, one in flight, replay/double finish costs once, shared hourly cap, sheet-ID reset and late result after reset blocked.');
})().catch(error=>{console.error(error);process.exitCode=1;});

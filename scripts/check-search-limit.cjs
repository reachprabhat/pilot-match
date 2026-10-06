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
    query:table=>({withIndex:(index,select)=>{const conditions=[];let direction=1;const q={eq:(key,value)=>{conditions.push(row=>row[key]===value);return q;},gte:(key,value)=>{conditions.push(row=>row[key]>=value);return q;}};if(select)select(q);const rows=()=>tables[table].filter(row=>conditions.every(test=>test(row))).sort((a,b)=>direction*(a._creationTime-b._creationTime));const result={unique:async()=>rows()[0]||null,first:async()=>rows()[0]||null,order:value=>{direction=value==='desc'?-1:1;return result;},take:async n=>rows().slice(0,n)};return result;}}),
    insert:async(table,value)=>{if(failInsert)throw Error('Database unavailable');const id='fictional-'+(++sequence);tables[table].push({_id:id,_creationTime:sequence,...value});return id;},
    patch:async(id,patch)=>Object.assign(await db.get(id),patch),
  };
  const ctx={db}, args=n=>({linkHash:tables.founders[0].linkHash,requestId:'fictional-request-'+n,ask:'A fictional pilot '+n});
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
  const baseline=JSON.stringify({searches:tables.founderSearches,calls:tables.aiCalls});
  for(const requestId of ['fictional-repeat-one','fictional-repeat-two']){
    const result=await store.reserve.handler(ctx,{...args(1),requestId,ask:'  '+args(1).ask+'  '});
    assert.equal(result.status,'matched','same founder and ask reuse the earliest saved result even at quota');
    assert.equal(JSON.stringify(result.matches),JSON.stringify(matches));
    assert.equal(result.searchCount,3);
    assert.equal(tables.founders[0].activeSearchId,tables.founderSearches.find(s=>s.ask===args(1).ask)._id);
  }
  assert.equal(JSON.stringify({searches:tables.founderSearches,calls:tables.aiCalls}),baseline,'repeat asks create no search or AI call');
  const duplicate={...tables.founderSearches.find(s=>s.ask===args(1).ask),_id:'fictional-later-duplicate',_creationTime:++sequence,matches:[{...matches[0],score:20},matches[1]]};
  tables.founderSearches.push(duplicate);
  assert.equal(JSON.stringify((await store.reserve.handler(ctx,{...args(1),requestId:'fictional-repeat-three'})).matches),JSON.stringify(matches),'earliest result wins over later duplicates');
  assert.equal((await store.reserve.handler(ctx,{...args(1),ask:'different ask'})).status,'invalid_ask','request IDs cannot be reused for another ask');
  assert.equal((await store.reserve.handler(ctx,{...args(1),requestId:'fictional-other-founder',linkHash:tables.founders[1].linkHash})).status,'reserved','another founder cannot reuse this founder result');
  assert.equal((await store.reserve.handler(ctx,args(4))).status,'limit_reached');
  await assert.rejects(reset.handler(ctx,{founderId:tables.founders[0]._id}),/founderId from your sheet.*not.*_id/);
  assert.equal((await reset.handler(ctx,{founderId:' 1 '})).searchesRemaining,3);
  assert.equal(tables.founders[0].searchCount,0);assert.equal(tables.founders[1].searchCount,undefined);
  const before=tables.founderSearches.length;assert.equal((await store.reserve.handler(ctx,args(1))).searchesRemaining,3);assert.equal(tables.founderSearches.length,before);
  const interrupted=await store.reserve.handler(ctx,args('reset-in-flight'));await reset.handler(ctx,{founderId:'1'});
  assert.equal((await store.complete.handler(ctx,{searchId:interrupted.searchId,matches,responseId:'late'})).status,'busy');assert.equal(tables.founders[0].searchCount,0);
  tables.aiCalls=Array.from({length:100},(_,n)=>({_id:'hourly-'+n,startedAt:Date.now(),purpose:'operator_enrichment'}));
  const reused=await store.reserve.handler(ctx,{...args(1),requestId:'fictional-after-reset'});
  assert.equal(reused.status,'matched','saved results work after reset and at hourly cap');assert.equal(reused.searchCount,0);assert.equal(JSON.stringify(reused.matches),JSON.stringify(matches));
  assert.equal((await store.reserve.handler(ctx,args('hourly-cap'))).status,'busy');assert.equal(tables.founders[0].searchCount,0);
  assert.equal((await store.reserve.handler(ctx,{...args('unknown'),linkHash:'c'.repeat(64)})).status,'invalid_link');
  await assert.rejects(reset.handler(ctx,{founderId:'unknown'}),/not found/);
  console.log('Search checks passed: success-only counting, failure costs zero, three per founder, one in flight, replay/double finish costs once, shared hourly cap, sheet-ID reset and late result after reset blocked.');
})().catch(error=>{console.error(error);process.exitCode=1;});

const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),esbuild=require('esbuild');
const validator=new Proxy(()=>validator,{get:()=>validator});
function load(file){const context={module:{exports:{}},require:n=>n==='./_generated/server'?{internalQuery:x=>x,internalMutation:x=>x}:n.startsWith('./lib/')?load('convex/'+n.slice(2)+'.ts'):n==='./responseValidators'?{operatorResponseValidator:validator,founderResponseValidator:validator}:n==='./choiceValidators'?{choiceStatusValidator:validator}:n==='./matchingValidators'?{matchValidator:{fields:{}}}:n==='convex/server'?{paginationOptsValidator:validator}:{v:validator}};vm.runInNewContext(esbuild.transformSync(fs.readFileSync(file,'utf8'),{loader:'ts',format:'cjs'}).code,context);return context.module.exports;}
const {list}=load('convex/operatorRequests.ts'),links=load('convex/operatorLinks.ts'),{save}=load('convex/choices.ts');
const tables={founders:[{_id:'founder-one',founderId:'example-founder',name:'Aruna Example',company:'Fictional Fabrication',whatsappNumber:'+91 99999 00000',linkHash:'a'.repeat(64),searchCount:2}],operators:[{_id:'op-one',operatorId:'example-one'},{_id:'op-two',operatorId:'example-two'}],operatorLinks:[],founderChoices:[],operatorRequests:[],operatorResponses:[],founderSearches:[{_id:'search-old',founderId:'founder-one',status:'completed',savedAt:1,ask:'Aruna Example at Fictional Fabrication wants a supply chain pilot. Call +91 99999 00000 or aruna@example.test. See https://example.test. Revenue target 200 Cr.',matches:[{operatorId:'example-one',score:90,why:'Fit'},{operatorId:'example-two',score:80,why:'Fit'}]}]};
let nextId=0;
const db={get:async id=>Object.values(tables).flat().find(r=>r._id===id)??null,query:table=>({withIndex:(index,callback)=>{const predicates=[];const q={eq:(k,v)=>{predicates.push(r=>r[k]===v);return q;},lte:(k,v)=>{predicates.push(r=>r[k]<=v);return q;}};callback?.(q);let descending=false;const rows=()=>tables[table].filter(r=>predicates.every(p=>p(r))).sort((a,b)=>(index.includes('saved_at')?a.savedAt-b.savedAt:tables[table].indexOf(a)-tables[table].indexOf(b))*(descending?-1:1));const result={unique:async()=>rows()[0]??null,first:async()=>rows()[0]??null,order:direction=>{descending=direction==='desc';return result;},take:async n=>rows().slice(0,n),paginate:async({numItems,cursor})=>{const start=Number(cursor??0),all=rows();return {page:all.slice(start,start+numItems),isDone:start+numItems>=all.length,continueCursor:String(start+numItems)};}};return result;}}),insert:async(table,row)=>{const _id=`row-${++nextId}`;tables[table].push({...row,_id});return _id;},patch:async(id,fields)=>{const row=Object.values(tables).flat().find(r=>r._id===id);assert.ok(row);Object.assign(row,fields);}};
const ctx={db},operatorHash='b'.repeat(64),otherHash='c'.repeat(64);
const requests=hash=>list.handler(ctx,{linkHash:hash,paginationOpts:{numItems:20,cursor:null}});
(async()=>{
 const protectedBefore=JSON.stringify({founders:tables.founders,operators:tables.operators,searches:tables.founderSearches});
 await links.setPersonalLink.handler(ctx,{operatorId:'example-one',linkHash:operatorHash});
 await links.setPersonalLink.handler(ctx,{operatorId:'example-two',linkHash:otherHash});
 await assert.rejects(()=>links.setPersonalLink.handler(ctx,{operatorId:'example-one',linkHash:'d'.repeat(64)}));
 await assert.rejects(()=>links.setPersonalLink.handler(ctx,{operatorId:'example-two',linkHash:tables.founders[0].linkHash}));
 assert.equal(await requests(tables.founders[0].linkHash),null,'founder links cannot open operator requests');
 assert.equal((await save.handler(ctx,{linkHash:operatorHash,operatorId:'example-one',status:'Requested'})).error,'invalid_link','operator links cannot change founder choices');
 assert.equal((await requests(operatorHash)).requests.length,0);
 const choice={linkHash:tables.founders[0].linkHash,operatorId:'example-one',status:'Requested'};
 await save.handler(ctx,choice);await save.handler(ctx,choice);
 let output=await requests(operatorHash);assert.equal(output.requests.length,1);assert.equal(tables.operatorRequests.length,1,'repeated requests do not duplicate cards');
 const card=output.requests[0];assert.deepEqual(Object.keys(card).sort(),['ask','requestId','requestedAt','response','why']);assert.equal(card.response,null);assert.equal(card.why,'Fit');assert.ok(!('industry' in card)&&!('pilotsDone' in card)&&!('topFeatures' in card),'absent founder facts are never guessed');
 assert.match(card.ask,/supply chain pilot/);assert.match(card.ask,/200 Cr/);
 for(const privateValue of ['Aruna','Example','Fictional Fabrication','99999','aruna@','https://'])assert.ok(!card.ask.includes(privateValue),`private value removed: ${privateValue}`);
 assert.equal((await requests(otherHash)).requests.length,0,'another operator cannot see this card');
 assert.equal(JSON.stringify({founders:tables.founders,operators:tables.operators,searches:tables.founderSearches}),protectedBefore,'request never changes profiles, searches or count');
 const originalAsk=card.ask;tables.founderSearches.push({_id:'search-new',founderId:'founder-one',status:'completed',savedAt:Date.now()+1,ask:'A different pilot',matches:[{operatorId:'example-one',score:95,why:'Different'}]});
 assert.equal((await requests(operatorHash)).requests[0].ask,originalAsk,'new searches do not rewrite an existing request');
 assert.equal((await requests(operatorHash)).requests[0].why,'Fit','reason comes from the request search, not the latest search');
 Object.assign(tables.founders[0],{industry:'Fictional Fabrication software',topFeatures:'Bottleneck detection\nAruna Example planning\nThird feature',pilotDone:'0'});
 const details=(await requests(operatorHash)).requests[0];assert.equal(details.industry,'[private] software');assert.ok(!('productType' in details));assert.equal(details.pilotsDone,'0');assert.deepEqual(Array.from(details.topFeatures),['Bottleneck detection','[private] planning']);
 tables.founders[0].pilotDone='Yes';assert.ok(!('pilotsDone' in (await requests(operatorHash)).requests[0]),'Yes is not a guessed pilot count');
 for(const status of ['Parked','Rejected']){await save.handler(ctx,{...choice,status});assert.equal((await requests(operatorHash)).requests.length,0);}
 await save.handler(ctx,choice);assert.equal((await requests(operatorHash)).requests[0].ask,'A different pilot');
 tables.operatorRequests.length=0;tables.founderChoices[0].updatedAt=2;
 assert.equal((await requests(operatorHash)).requests[0].ask,originalAsk,'pre-milestone requests resolve the saved ask at their timestamp');
 const reloaded=await requests(operatorHash);assert.equal(reloaded.requests[0].ask,originalAsk,'reload keeps the saved request');
 console.log('Operator request checks passed: separate hashed links, no rotation, cross-role and cross-operator isolation, one saved ask per pair, reload, old requests, Park/Reject visibility, no private identity/contact fields, no searches or count changes.');
})().catch(error=>{console.error(error);process.exitCode=1;});

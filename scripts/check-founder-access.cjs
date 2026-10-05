const assert=require('node:assert/strict');const fs=require('node:fs');const vm=require('node:vm');const esbuild=require('esbuild');const crypto=require('node:crypto');
const validator=new Proxy(()=>validator,{get:()=>validator});
function load(file,require){const context={module:{exports:{}},require,Response,Request,TextEncoder,crypto:crypto.webcrypto};vm.runInNewContext(esbuild.transformSync(fs.readFileSync(file,'utf8'),{loader:'ts',format:'cjs'}).code,context);return context.module.exports;}
const founders=load('convex/founders.ts',n=>n==='./_generated/server'?{internalMutation:x=>x,internalQuery:x=>x}:{v:validator});
let route;load('convex/http.ts',n=>n==='convex/server'?{httpRouter:()=>({route:r=>route=r})}:n==='./_generated/server'?{httpAction:x=>x}:{internal:{founders:{resolvePersonalLink:'resolve'}}});
(async()=>{
const code='a'.repeat(43);const hash=crypto.createHash('sha256').update(code).digest('hex');
const row={_id:'fictional',company:'Example Company',name:'Example Person',whatsappNumber:'000000',about:'Private example profile',linkHash:hash};
const db={query:()=>({withIndex:(index,select)=>{let value;select({eq:(key,v)=>{value=v;return {};}});return {unique:async()=>value===hash?row:null};}})};
const ctx={runQuery:async(fn,args)=>{assert.equal(fn,'resolve');assert.equal(Object.hasOwn(args,'code'),false);return founders.resolvePersonalLink.handler({db},args);}};
const request=body=>new Request('https://example.com/api/founder',{method:'POST',body});
let response=await route.handler(ctx,request(JSON.stringify({code})));assert.equal(response.status,200);assert.deepEqual(await response.json(),{company:'Example Company'});assert.equal(response.headers.get('cache-control'),'no-store');
response=await route.handler(ctx,request(JSON.stringify({code:'b'.repeat(43)})));assert.equal(response.status,404);
for(const body of ['{}','{','{"code":"short"}','x'.repeat(1025)])assert.equal((await route.handler(ctx,request(body))).status,400);
assert.equal((await route.handler({runQuery:async()=>{throw Error('offline');}},request(JSON.stringify({code})))).status,503);
const mutationCtx={db:{query:()=>({withIndex:()=>({unique:async()=>row})}),patch:async()=>{throw Error('Should not rotate existing links');}}};
await assert.rejects(founders.setPersonalLink.handler(mutationCtx,{founderId:'fictional',linkHash:hash}),/already has/);
assert.equal(await founders.resolvePersonalLink.handler({db},{linkHash:'bad'}),null);
console.log('Founder access checks passed: private profiles excluded, valid/unknown/malformed links, no cache, retryable failure and no accidental link rotation.');
})().catch(e=>{console.error(e);process.exitCode=1});

const assert=require('node:assert/strict');
(async()=>{
const links=JSON.parse(process.env.FOUNDER_LINKS_JSON||'[]');if(links.length!==2)throw Error('Provide exactly two personal links in FOUNDER_LINKS_JSON; never put real codes in this file.');
const tabs=await(await fetch('http://127.0.0.1:9222/json')).json();const ws=new WebSocket(tabs[0].webSocketDebuggerUrl);await new Promise(r=>ws.addEventListener('open',r,{once:true}));
let id=0;const pending=new Map(),requests=[],errors=[];
ws.addEventListener('message',({data})=>{const m=JSON.parse(data);if(m.id){const p=pending.get(m.id);pending.delete(m.id);m.error?p.reject(m.error):p.resolve(m.result);}if(m.method==='Network.requestWillBeSent')requests.push(m.params.request.url);if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.text);});
const send=(method,params={})=>new Promise((resolve,reject)=>{pending.set(++id,{resolve,reject});ws.send(JSON.stringify({id,method,params}));});
const evaluate=async expression=>{const r=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(r.exceptionDetails)throw Error('Browser script failed');return r.result.value;};
const wait=async expression=>{for(let n=0;n<100;n++){if(await evaluate(expression))return;await new Promise(r=>setTimeout(r,100));}throw Error('Browser state did not settle');};
await send('Page.enable');await send('Network.enable');await send('Runtime.enable');
for(const [view,width,height] of [['desktop',1280,800],['phone',390,844],['small-phone',320,740]]){
await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});
for(const link of links){await send('Page.navigate',{url:'about:blank'});await wait('location.href==="about:blank"');await send('Page.navigate',{url:link.url});await wait('document.getElementById("ask")&&!document.getElementById("ask").hidden&&!document.getElementById("founder-company").hidden');
const state=await evaluate('({company:document.getElementById("founder-company").textContent,landingHidden:document.getElementById("landing").hidden,searchDisabled:document.querySelector("#ask .primary").disabled,note:document.getElementById("matching-note").textContent,overflow:document.documentElement.scrollWidth>innerWidth,storage:localStorage.length+sessionStorage.length})');
assert.equal(state.company,'For '+link.company);assert.equal(state.landingHidden,true);assert.equal(state.searchDisabled,true);assert.equal(state.note,'Matching opens soon');assert.equal(state.overflow,false);assert.equal(state.storage,0);
const prior=requests.length;await evaluate('document.getElementById("pilot-ask").value="A fictional pilot ask";document.getElementById("pilot-ask").dispatchEvent(new Event("input",{bubbles:true}))');await new Promise(r=>setTimeout(r,300));assert.equal(requests.length,prior);
await send('Page.reload',{ignoreCache:true});await wait('document.getElementById("ask")&&!document.getElementById("ask").hidden&&!document.getElementById("founder-company").hidden');assert.equal(await evaluate('document.getElementById("pilot-ask").value'),'');assert.equal(await evaluate('document.getElementById("founder-company").textContent'),'For '+link.company);
console.log(JSON.stringify({view,founderId:link.founderId,correctCompany:true,disabledSearch:true,noTypingRequests:true,reloadClearsAsk:true,noOverflow:true}));
}
}
await evaluate('location.hash='+JSON.stringify('#f='+links[0].code));await wait('document.getElementById("founder-company").textContent==='+JSON.stringify('For '+links[0].company));
await evaluate('location.hash='+JSON.stringify('#f='+links[1].code));await wait('document.getElementById("founder-company").textContent==='+JSON.stringify('For '+links[1].company));
await evaluate('document.getElementById("back").click()');assert.equal(await evaluate('location.hash'),'');assert.equal(await evaluate('document.getElementById("founder-company").textContent'),'');assert.equal(await evaluate('document.getElementById("landing").hidden'),false);
const base=new URL(links[0].url).origin;
await send('Page.navigate',{url:base+'/#f='+'z'.repeat(43)});await wait('document.getElementById("link-title")&&document.getElementById("link-title").textContent==="This personal link is not valid"');assert.equal(await evaluate('document.getElementById("ask").hidden'),true);
await send('Page.navigate',{url:base+'/#f=short'});await wait('document.getElementById("link-title")&&document.getElementById("link-title").textContent==="This personal link is not valid"');
await send('Network.emulateNetworkConditions',{offline:true,latency:0,downloadThroughput:0,uploadThroughput:0});await evaluate('location.hash='+JSON.stringify('#f='+links[0].code));await wait('document.getElementById("retry-link")&&!document.getElementById("retry-link").hidden');await send('Network.emulateNetworkConditions',{offline:false,latency:0,downloadThroughput:-1,uploadThroughput:-1});await evaluate('document.getElementById("retry-link").click()');await wait('!document.getElementById("ask").hidden');assert.equal(await evaluate('document.getElementById("founder-company").textContent'),'For '+links[0].company);
assert.equal(errors.length,0);console.log('Link switching, back cleanup, unknown/malformed links and offline retry passed; no browser exceptions.');ws.close();
})().catch(e=>{console.error(e.message);process.exit(1)});

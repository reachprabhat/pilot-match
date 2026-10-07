// Fictional browser replies protect operator-link switching and request privacy.
// This check never reads personal links, writes Convex data or runs a search.
const assert=require('node:assert/strict');
const base='https://neat-hyena-46.convex.site';
(async()=>{
 const tab=await(await fetch('http://127.0.0.1:9222/json/new?about:blank',{method:'PUT'})).json(),ws=new WebSocket(tab.webSocketDebuggerUrl);await new Promise(r=>ws.addEventListener('open',r,{once:true}));
 let id=0,mode='normal',reads=0,writes=0,responseWrites=0,responseStatus=null,responseFail=false;const pending=new Map(),errors=[],held=[];
 const send=(method,params={})=>new Promise((resolve,reject)=>{pending.set(++id,{resolve,reject});ws.send(JSON.stringify({id,method,params}));});
 const reply=(requestId,status,body)=>send('Fetch.fulfillRequest',{requestId,responseCode:status,responseHeaders:[{name:'Content-Type',value:'application/json'}],body:Buffer.from(JSON.stringify(body)).toString('base64')});
 ws.addEventListener('message',({data})=>{const event=JSON.parse(data);if(event.id){const task=pending.get(event.id);pending.delete(event.id);event.error?task.reject(new Error('Browser command failed')):task.resolve(event.result);}if(event.method==='Runtime.exceptionThrown')errors.push(event.params.exceptionDetails.text);if(event.method==='Fetch.requestPaused'){
  (async()=>{const request=event.params,pathname=new URL(request.request.url).pathname,body=JSON.parse(request.request.postData);
   if(pathname==='/api/introductions')return reply(request.requestId,200,{introductions:[],pending:false,isDone:true,continueCursor:''});
   if(pathname==='/api/operator/response'){responseWrites++;if(responseFail)return reply(request.requestId,503,{});assert.equal(body.code,'a'.repeat(43));assert.equal(body.requestId,'fictional-a');assert.equal(body.requestedAt,1);responseStatus=body.status;return reply(request.requestId,200,{requestId:body.requestId,status:body.status,updatedAt:2});}
   if(pathname!=='/api/operator/requests'){writes++;throw Error('An operator screen called a founder endpoint');}reads++;if(mode==='held'){held.push(request.requestId);return;}if(mode==='error')return reply(request.requestId,503,{});if(body.code==='a'.repeat(43))return reply(request.requestId,200,{requests:[{requestId:'fictional-a',ask:'A fictional manufacturing pilot.',requestedAt:1,response:responseStatus}],isDone:!body.cursor?false:true,continueCursor:'next'});if(body.code==='b'.repeat(43))return reply(request.requestId,200,{requests:[],isDone:true,continueCursor:''});return reply(request.requestId,404,{});})().catch(error=>errors.push(error.message));
 }});
 const evaluate=async expression=>{const response=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(response.exceptionDetails)throw new Error('Browser evaluation failed');return response.result.value;};
 const wait=async expression=>{for(let n=0;n<150;n++){if(await evaluate(expression))return;await new Promise(r=>setTimeout(r,100));}throw new Error('Screen did not settle: '+expression);};
 const settle='document.querySelector(".panel")?.getAttribute("aria-busy")==="false"';
 const navigate=async code=>{await send('Page.navigate',{url:base+'/operator.html#o='+code});};
 const checkSelectedStyle=async()=>{const buttons=await evaluate('[...document.querySelectorAll(".operator-actions button")].map(b=>({selected:b.getAttribute("aria-pressed")==="true",background:getComputedStyle(b).backgroundColor,color:getComputedStyle(b).color,border:getComputedStyle(b).borderTopWidth}))');assert.equal(buttons.filter(b=>b.selected).length,1);for(const b of buttons){assert.equal(b.background,b.selected?'rgb(73, 52, 38)':'rgba(0, 0, 0, 0)');assert.equal(b.color,b.selected?'rgb(250, 248, 244)':'rgb(38, 35, 31)');assert.equal(b.border,'1px');}};
 try{
  await send('Page.enable');await send('Runtime.enable');await send('Network.enable');await send('Network.setCacheDisabled',{cacheDisabled:true});await send('Fetch.enable',{patterns:[{urlPattern:base+'/api/*',requestStage:'Request'}]});
  for(const [name,width,height,mobile]of[['desktop',1280,900,false],['390px',390,844,true],['320px',320,740,true]]){
   await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile});await navigate('a'.repeat(43));await wait(settle+'&&document.querySelectorAll("#requests-list article").length===1');
   assert.equal(await evaluate('document.querySelector("#requests-list p").textContent'),'A fictional manufacturing pilot.');
   await evaluate('document.getElementById("requests-action").click()');await wait(settle+'&&document.getElementById("requests-action").hidden');assert.equal(await evaluate('document.querySelectorAll("#requests-list article").length'),1,'page overlap does not duplicate cards');
   const writesBefore=responseWrites;await evaluate('document.querySelector("button[data-response=Interested]").click();document.querySelector("button[data-response=Interested]").click()');await wait('document.querySelector(".operator-status").textContent==="Interested"');assert.equal(responseWrites,writesBefore+1,'double click makes one response write');
   await checkSelectedStyle();
   responseFail=true;await evaluate('document.querySelectorAll(".operator-actions button")[1].click()');await wait('document.querySelector(".operator-status").classList.contains("error")');assert.equal(await evaluate('document.querySelector("button[data-response=Interested]").getAttribute("aria-pressed")'),'true','failed response keeps previous choice selected');
   responseFail=false;await evaluate('document.querySelectorAll(".operator-actions button")[1].click()');await wait('document.querySelector(".operator-status").textContent==="Not relevant"');
   await checkSelectedStyle();
   const readsBefore=reads;await send('Page.reload',{ignoreCache:true});for(let n=0;n<150&&reads===readsBefore;n++)await new Promise(r=>setTimeout(r,100));assert.ok(reads>readsBefore);await wait('document.querySelector(".operator-status")?.textContent==="Not relevant"');
   await navigate('b'.repeat(43));await wait(settle+'&&document.getElementById("requests-message").textContent.startsWith("No requests yet.")');assert.equal(await evaluate('document.querySelectorAll("#requests-list article").length'),0,'switching code removes the previous operator card');
   mode='error';await navigate('a'.repeat(43));await wait(settle+'&&!document.getElementById("requests-action").hidden');assert.equal(await evaluate('document.getElementById("requests-action").textContent'),'Try again');
   mode='normal';await evaluate('document.getElementById("requests-action").click()');await wait(settle+'&&document.querySelectorAll("#requests-list article").length===1');
   await navigate('c'.repeat(43));await wait(settle+'&&document.getElementById("requests-message").textContent.startsWith("This personal link is not valid.")');assert.equal(await evaluate('document.querySelectorAll("#requests-list article").length'),0);
   await evaluate('location.hash="#f="+"a".repeat(43)');await wait(settle+'&&document.getElementById("requests-message").textContent.startsWith("This personal link is not valid.")');
   assert.equal(await evaluate('document.documentElement.scrollWidth>innerWidth'),false);assert.equal(await evaluate('document.activeElement===document.querySelector("h1")'),true);assert.equal(await evaluate('getComputedStyle(document.querySelector("h1")).outlineStyle'),'none');
   console.log(`${name}: saved responses/reload, double clicks, save errors/retry, pagination, link switching, role checks, focus and no overflow passed.`);
  }
  mode='held';await navigate('a'.repeat(43));await wait('document.querySelector(".panel")?.getAttribute("aria-busy")==="true"');await wait('document.getElementById("requests-message").textContent==="Loading your requests..."');
  for(let n=0;n<150&&!held.length;n++)await new Promise(r=>setTimeout(r,100));assert.equal(held.length,1);
  mode='normal';await navigate('b'.repeat(43));await wait(settle+'&&document.getElementById("requests-message").textContent.startsWith("No requests yet.")');
  for(const requestId of held)await reply(requestId,200,{requests:[{requestId:'late-private-a',ask:'Late card from the previous operator',requestedAt:1}],isDone:true,continueCursor:''}).catch(()=>{});
  await evaluate('new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))');assert.equal(await evaluate('document.querySelectorAll("#requests-list article").length'),0,'a late reply never adds a previous operator card');
  assert.equal(writes,0);assert.deepEqual(errors,[]);console.log(`Operator screen browser checks passed: ${reads} reads, ${responseWrites} fictional response attempts, zero founder/search writes, late replies cannot cross operators.`);
 }finally{ws.close();await fetch('http://127.0.0.1:9222/json/close/'+tab.id);}
})().catch(error=>{console.error(error.message);process.exitCode=1;});

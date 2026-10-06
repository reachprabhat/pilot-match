// Browser contract checks use fictional replies. Backend rules and the action are checked separately.
// No OpenAI calls, private links, production writes or paid searches occur in this check.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const base='https://neat-hyena-46.convex.site';
(async()=>{
  const tabs=await(await fetch('http://127.0.0.1:9222/json')).json();
  const ws=new WebSocket(tabs.find(tab=>tab.type==='page').webSocketDebuggerUrl);
  await new Promise(resolve=>ws.addEventListener('open',resolve,{once:true}));
  let id=0,count=0,failNext=false,searchRequests=0;
  const pending=new Map(),errors=[],requestIds=[];
  const matches=[{operatorId:'example-one',score:93,why:'Manufacturing leadership fits the bottleneck pilot.'},{operatorId:'example-two',score:85,why:'Retail operations experience supports a pilot.'}];
  const send=(method,params={})=>new Promise((resolve,reject)=>{pending.set(++id,{resolve,reject});ws.send(JSON.stringify({id,method,params}));});
  ws.addEventListener('message',({data})=>{
    const message=JSON.parse(data);
    if(message.id){const p=pending.get(message.id);pending.delete(message.id);message.error?p.reject(message.error):p.resolve(message.result);}
    if(message.method==='Runtime.exceptionThrown')errors.push(message.params.exceptionDetails.text);
    if(message.method==='Fetch.requestPaused'){
      const event=message.params;
      (async()=>{
        let body,status=200;
        if(new URL(event.request.url).pathname==='/api/founder')body={company:'Fictional Example Company',searchCount:count,searchLimit:3,searchesRemaining:3-count};
        else if(new URL(event.request.url).pathname==='/api/search'){
          searchRequests++;
          const request=JSON.parse(event.request.postData);requestIds.push(request.requestId);
          if(failNext){failNext=false;status=503;body={error:'Busy right now. Try again in a few minutes.'};}
          else if(count>=3){status=429;body={status:'limit_reached',searchCount:3,searchLimit:3,searchesRemaining:0};}
          else{count++;body={status:'matched',matches,searchCount:count,searchLimit:3,searchesRemaining:3-count};}
        }else throw Error('Unexpected API request');
        await send('Fetch.fulfillRequest',{requestId:event.requestId,responseCode:status,responseHeaders:[{name:'Content-Type',value:'application/json'},{name:'Cache-Control',value:'no-store'}],body:Buffer.from(JSON.stringify(body)).toString('base64')});
      })().catch(error=>errors.push(error.message));
    }
  });
  const evaluate=async expression=>{const r=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(r.exceptionDetails)throw Error('Browser evaluation failed');return r.result.value;};
  const wait=async expression=>{for(let n=0;n<100;n++){if(await evaluate(expression))return;await new Promise(resolve=>setTimeout(resolve,100));}throw Error('Expected browser state did not settle: '+expression);};
  const type=text=>evaluate(`pilotAsk.value=${JSON.stringify(text)};pilotAsk.dispatchEvent(new Event('input',{bubbles:true}));`);
  await send('Page.enable');await send('Network.enable');await send('Runtime.enable');
  await send('Fetch.enable',{patterns:[{urlPattern:base+'/api/*',requestStage:'Request'}]});
  for(const [name,width,height]of[['desktop',1280,800],['phone',390,844],['small-phone',320,740]]){
    count=0;
    await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});
    await send('Page.navigate',{url:'about:blank'});await wait('location.href==="about:blank"');
    await send('Page.navigate',{url:base+'/#f='+'a'.repeat(43)});await wait('document.getElementById("ask")&&!document.getElementById("ask").hidden');
    assert.equal(await evaluate('searchButton.disabled'),true);
    await type('word '.repeat(301));assert.equal(await evaluate('searchButton.disabled'),true);
    await type('A fictional manufacturing pilot');
    if(name==='phone'){
      failNext=true;await evaluate('searchButton.click()');await wait('!submitting && searchMessage.textContent==="Busy right now. Try again in a few minutes."');
      assert.equal(count,0);assert.equal(await evaluate('matchesSection.hidden'),true);assert.equal(await evaluate('pilotAsk.value'),'A fictional manufacturing pilot');
      const failedId=requestIds.at(-1);await evaluate('searchButton.click()');await wait('!submitting && remaining===2');assert.notEqual(requestIds.at(-1),failedId,'explicit retry after a known failure gets a new request ID');
      count=0;await evaluate('window.dispatchEvent(new Event("focus"))');await wait('remaining===3');
    }
    for(let n=1;n<=3;n++){
      await type('Fictional pilot '+n);const before=searchRequests;await evaluate('searchButton.click();searchButton.click()');
      await wait(`!submitting && remaining===${3-n} && !matchesSection.hidden`);
      assert.equal(searchRequests,before+1,'double click sends one request');
      assert.equal(await evaluate('matchCards.querySelectorAll("article").length'),2);
      assert.equal(await evaluate('matchCards.querySelector("h2").textContent'),'Operator example-one');
      assert.equal(await evaluate('matchCards.querySelector(".fit-score").textContent'),'93/100');
    }
    assert.equal(await evaluate('searchButton.disabled'),true);
    assert.equal(await evaluate('matchingNote.textContent'),'You’ve used all 3 searches.');
    const rectangles=await evaluate('Array.from(matchCards.children,card=>({top:card.getBoundingClientRect().top,left:card.getBoundingClientRect().left}))');
    if(name==='desktop')assert.equal(rectangles[0].top,rectangles[1].top);else assert.ok(rectangles[1].top>rectangles[0].top);
    assert.equal(await evaluate('document.documentElement.scrollWidth>innerWidth'),false);
    const shot=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:true});fs.writeFileSync(path.join(os.tmpdir(),'pilot-match-matching-'+name+'.png'),Buffer.from(shot.data,'base64'));
    await send('Page.reload',{ignoreCache:true});await wait('document.getElementById("ask")&&!document.getElementById("ask").hidden&&remaining===0');
    assert.equal(await evaluate('searchButton.disabled'),true);assert.equal(await evaluate('matchesSection.hidden'),true);
    count=0;await evaluate('window.dispatchEvent(new Event("focus"))');await wait('remaining===3');await type('A fictional ask after reset');assert.equal(await evaluate('searchButton.disabled'),false);
    await evaluate('document.getElementById("back").click()');assert.equal(await evaluate('matchesSection.hidden'),true);
    console.log(name+': two anonymous cards, correct layout, error recovery, no double clicks, cap/reload/reset and no overflow passed.');
  }
  await send('Fetch.disable');assert.deepEqual(errors,[]);ws.close();console.log('Browser contract checks passed using fictional replies; no paid AI calls.');
})().catch(error=>{console.error(error);process.exitCode=1;});

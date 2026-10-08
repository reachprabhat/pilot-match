const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),{spawn}=require('node:child_process');
// Dedicated hidden browser profile and private pipes; no debugging port or personal browser session.
async function browser(width=390){
  const profile=fs.mkdtempSync(path.join(os.tmpdir(),'besto-proof-'));
  const child=spawn('C:/Program Files/Google/Chrome/Application/chrome.exe',['--headless=new','--remote-debugging-pipe','--no-first-run','--no-default-browser-check','--user-data-dir='+profile,'about:blank'],{cwd:path.resolve(__dirname,'..'),windowsHide:true,stdio:['ignore','ignore','ignore','pipe','pipe']});
  let next=0,buffer='',session;const pending=new Map(),listeners=[],errors=[];
  child.stdio[4].on('data',chunk=>{buffer+=chunk.toString();let i;while((i=buffer.indexOf('\0'))>=0){const part=buffer.slice(0,i);buffer=buffer.slice(i+1);if(!part)continue;const m=JSON.parse(part);if(m.id){const p=pending.get(m.id);if(p){pending.delete(m.id);clearTimeout(p.timer);m.error?p.reject(Error(m.error.message)):p.resolve(m.result);}}if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.text);for(const fn of listeners)fn(m);}});
  const send=(method,params={},scope=session)=>new Promise((resolve,reject)=>{const id=++next,timer=setTimeout(()=>{pending.delete(id);reject(Error('Browser timeout: '+method));},15000);pending.set(id,{resolve,reject,timer});child.stdio[3].write(JSON.stringify({id,method,params,...(scope?{sessionId:scope}:{})})+'\0');});
  const evaluate=async expression=>{const r=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description||'Browser evaluation failed');return r.result.value;};
  const wait=async expression=>{for(let i=0;i<150;i++){if(await evaluate(expression))return;await new Promise(r=>setTimeout(r,100));}throw Error('Page did not settle: '+expression);};
  const {targetId}=await send('Target.createTarget',{url:'about:blank'},null);session=(await send('Target.attachToTarget',{targetId,flatten:true},null)).sessionId;
  await send('Page.enable');await send('Runtime.enable');await send('Emulation.setDeviceMetricsOverride',{width,height:844,deviceScaleFactor:1,mobile:width<600});
  const navigate=async url=>{await send('Page.navigate',{url});await wait('document.readyState==="complete"');};
  const screenshot=async(file,selector)=>{await evaluate('document.fonts.ready');let clip;if(selector)clip=await evaluate(`(()=>{const r=document.querySelector(${JSON.stringify(selector)}).getBoundingClientRect();return {x:0,y:Math.max(0,r.top+scrollY-12),width:innerWidth,height:Math.ceil(r.height+24),scale:1};})()`);const shot=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:!!clip,...(clip?{clip}:{})});fs.writeFileSync(file,Buffer.from(shot.data,'base64'));};
  return {send,evaluate,wait,navigate,screenshot,errors,onEvent:fn=>listeners.push(fn),close:async()=>{try{await send('Browser.close',{},null);}catch{}child.kill();}};
}
module.exports={browser};

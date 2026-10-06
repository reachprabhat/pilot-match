const panel=document.querySelector('.panel');
const heading=document.getElementById('requests-title');
const message=document.getElementById('requests-message');
const list=document.getElementById('requests-list');
const action=document.getElementById('requests-action');
let code=new URLSearchParams(location.hash.slice(1)).get('o');
let cursor=null,loading=false,version=0,controller;
const shown=new Set();

function showMessage(text,error=false){message.textContent=text;message.classList.toggle('error',error);message.hidden=!text;}
function addCard(request){
  if(shown.has(request.requestId))return;
  const article=document.createElement('article');
  const title=document.createElement('h2');title.textContent='Business opportunity';
  const label=document.createElement('h3');label.textContent='Pilot ask';
  const ask=document.createElement('p');ask.textContent=request.ask;
  article.append(title,label,ask);
  const detail=(heading,text)=>{const group=document.createElement('section'),h=document.createElement('h3'),p=document.createElement('p');h.textContent=heading;p.textContent=text;group.append(h,p);article.append(group);};
  if(request.industry)detail('Product type',request.industry);
  if(request.topFeatures?.length){const group=document.createElement('section'),h=document.createElement('h3'),features=document.createElement('ul');h.textContent='Top 2 features';for(const feature of request.topFeatures){const item=document.createElement('li');item.textContent=feature;features.append(item);}group.append(h,features);article.append(group);}
  if(request.pilotsDone!==undefined)detail('Number of pilots done',request.pilotsDone);
  if(request.why)detail('Why it fits your company',request.why);
  article.dataset.requestId=request.requestId;
  const status=document.createElement('p');status.className='operator-status';status.setAttribute('role','status');
  const actions=document.createElement('div');actions.className='operator-actions';
  let savedResponse=request.response||'',saving=false;
  const buttons=[];
  const update=()=>{status.classList.remove('error');status.textContent=savedResponse;for(const button of buttons)button.setAttribute('aria-pressed',String(button.dataset.response===savedResponse));};
  for(const value of ['Interested','Not relevant']){
    const button=document.createElement('button');button.type='button';button.textContent=value;button.dataset.response=value;button.className=value==='Interested'?'primary':'secondary';buttons.push(button);actions.append(button);
    button.addEventListener('click',async()=>{
      if(saving)return;
      saving=true;buttons.forEach(item=>{item.disabled=true;});status.classList.remove('error');status.textContent='Saving...';
      const requestVersion=version,requestCode=code;
      try{
        const response=await fetch('/api/operator/response',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({code:requestCode,requestId:request.requestId,requestedAt:request.requestedAt,status:value}),cache:'no-store',credentials:'omit',referrerPolicy:'no-referrer',signal:AbortSignal.timeout(15000)});
        const result=await response.json();
        if(requestVersion!==version||!article.isConnected)return;
        if(!response.ok||result.requestId!==request.requestId||result.status!==value)throw new Error(response.status===409?'This request changed. Reload to see its latest status.':'Could not save your response. Try again or reload.');
        savedResponse=result.status;update();
      }catch(error){
        if(requestVersion!==version||!article.isConnected)return;
        status.classList.add('error');status.textContent=`${savedResponse?savedResponse+'. ':''}${error.message==='This request changed. Reload to see its latest status.'?error.message:'Could not save your response. Try again or reload.'}`;
      }finally{saving=false;buttons.forEach(item=>{item.disabled=false;});}
    });
  }
  update();article.append(status,actions);
  list.append(article);shown.add(request.requestId);
}
async function load(){
  if(loading)return;
  if(!/^[A-Za-z0-9_-]{43}$/.test(code??'')){
    panel.setAttribute('aria-busy','false');
    showMessage('This personal link is not valid. Ask Prabhat for your operator link.',true);
    action.hidden=true;return;
  }
  loading=true;panel.setAttribute('aria-busy','true');action.disabled=true;
  const requestVersion=version;controller=new AbortController();
  showMessage('Loading your requests...');
  try{
    const response=await fetch('/api/operator/requests',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({code,cursor}),cache:'no-store',credentials:'omit',referrerPolicy:'no-referrer',signal:AbortSignal.any([controller.signal,AbortSignal.timeout(15000)])});
    if(requestVersion!==version)return;
    if(response.status===404){showMessage('This personal link is not valid. Ask Prabhat for your operator link.',true);action.hidden=true;return;}
    if(!response.ok)throw new Error('Unable to load');
    const result=await response.json();
    if(requestVersion!==version)return;
    for(const request of result.requests)addCard(request);
    cursor=result.continueCursor;
    showMessage(shown.size?'':'No requests yet. When a founder requests to meet you, their pilot ask will appear here.');
    action.textContent='Show more requests';action.hidden=result.isDone;
  }catch{
    if(requestVersion!==version)return;
    showMessage('Busy right now. Try again in a few minutes.',true);
    action.textContent='Try again';action.hidden=false;
  }finally{if(requestVersion===version){loading=false;action.disabled=false;panel.setAttribute('aria-busy','false');}}
}
window.addEventListener('hashchange',()=>{
  version++;controller?.abort();loading=false;cursor=null;shown.clear();list.replaceChildren();action.hidden=true;
  code=new URLSearchParams(location.hash.slice(1)).get('o');heading.focus({preventScroll:true});load();
});
action.addEventListener('click',()=>load());
heading.focus({preventScroll:true});
load();

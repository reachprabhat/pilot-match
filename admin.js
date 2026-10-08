const panel=document.querySelector('.panel'),heading=document.getElementById('admin-title');
const message=document.getElementById('admin-message'),content=document.getElementById('admin-content');
const refresh=document.getElementById('admin-refresh'),more=document.getElementById('admin-more');
const lists={Requested:document.getElementById('new-list'),Accepted:document.getElementById('accepted-list'),Declined:document.getElementById('declined-list')};
let code,cursor=null,loading=false,version=0,controller;
const shown=new Set();
function showMessage(text,error=false){message.textContent=text;message.hidden=!text;message.classList.toggle('error',error);}
function clear(){for(const list of Object.values(lists))list.replaceChildren();shown.clear();content.hidden=true;more.hidden=true;refresh.hidden=true;}
function addCard(request){
  if(shown.has(request.requestId)||!lists[request.status])return;
  const article=document.createElement('article');article.dataset.requestId=request.requestId;article.dataset.founderId=request.founderId;article.dataset.operatorId=request.operatorId;
  const title=document.createElement('h3');const number=request.operatorNumber??(/^[1-9]\d*$/.test(request.operatorId)?Number(request.operatorId):null);title.textContent=`Founder ${request.founderId} / ${Number.isSafeInteger(number)&&number>0?'Operator '+number:'Operator'}`;article.append(title);
  const contacts=document.createElement('dl');
  const contact=(label,value)=>{const term=document.createElement('dt'),detail=document.createElement('dd');term.textContent=label;detail.textContent=value||'Not provided';contacts.append(term,detail);return detail;};
  if(request.status==='Declined'){
    contact('Founder',request.founderName);contact('Operator',request.operatorName);
    contact('Requested',new Date(request.requestedAt).toLocaleString());contact('Declined',new Date(request.declinedAt).toLocaleString());
    article.append(contacts);lists.Declined.append(article);shown.add(request.requestId);return;
  }
  const statusCell=contact('Status',request.introduced?'Introduced':request.status);contact('Requested',new Date(request.requestedAt).toLocaleString());
  contact('Operator',request.operatorName);contact('Operator WhatsApp',request.operatorPhone);
  if(request.status==='Accepted'){contact('Founder',request.founderName);contact('Founder WhatsApp',request.founderPhone);}
  article.append(contacts);
  if(request.status==='Accepted'){
    const introActions=document.createElement('div');introActions.className='admin-introduction-actions';
    const introNote=document.createElement('p');introNote.className='introduction-status';introNote.setAttribute('role','status');
    const buttons=[];let opening=false;
    const updateIntroduction=()=>{
      statusCell.textContent=request.introduced?'Introduced':'Accepted';
      introNote.textContent=request.introduced?'Introduced':request.paymentStatus==='Locked'?'Confirm payment before introducing.':request.founderOpenedAt?'Founder introduction opened. Open the operator introduction next.':request.operatorOpenedAt?'Operator introduction opened. Open the founder introduction next.':request.paymentStatus==='Paid'?'Open the founder introduction, then send it in WhatsApp.':'Open both introductions, then send each message in WhatsApp.';
      for(const button of buttons){button.disabled=request.paymentStatus==='Locked'||opening;button.hidden=button.dataset.recipient==='operator'&&request.paymentStatus!=='Free';}
    };
    for(const [recipient,label] of [['founder','Introduce to founder'],['operator','Introduce to operator']]){
      const button=document.createElement('button');button.type='button';button.className='primary admin-introduce';button.textContent=label;button.dataset.recipient=recipient;buttons.push(button);introActions.append(button);
      button.addEventListener('click',async()=>{
        if(opening||request.paymentStatus==='Locked')return;
        const popup=window.open('about:blank','_blank');if(!popup){introNote.textContent='Allow pop-ups to open WhatsApp, then tap again.';return;}popup.opener=null;
        opening=true;updateIntroduction();introNote.textContent='Opening introduction...';const current=version;
        try{
          const response=await fetch('/api/admin/introduce',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({code,requestId:request.requestId,requestedAt:request.requestedAt,recipient}),cache:'no-store',credentials:'omit',referrerPolicy:'no-referrer',signal:AbortSignal.timeout(55000)});
          const result=await response.json();if(current!==version||!article.isConnected){popup.close();return;}if(!response.ok)throw Error(result.error||'Could not open the introduction. Try again.');
          const url=new URL(result.url);if(url.origin!=='https://wa.me')throw Error('Could not open the introduction. Try again.');
          popup.location.href=url.href;Object.assign(request,result);opening=false;updateIntroduction();
        }catch(error){popup.close();if(current===version){opening=false;updateIntroduction();introNote.textContent=error.message||'Could not open the introduction. Try again.';}}
        finally{opening=false;for(const button of buttons)button.disabled=request.paymentStatus==='Locked';}
      });
    }
    article.append(introActions,introNote);updateIntroduction();
    const payment=document.createElement('p');payment.className='payment-status';payment.textContent=request.paymentLabel??(request.paymentStatus==='Free'?'Free (first connect)':'Payment pending');article.append(payment);
    if(request.paymentStatus==='Locked'){const button=document.createElement('button');button.type='button';button.className='primary';button.textContent='Mark paid';article.append(button);button.addEventListener('click',async()=>{const current=version;button.disabled=true;try{const response=await fetch('/api/admin/mark-paid',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({code,requestId:request.requestId,requestedAt:request.requestedAt}),cache:'no-store',credentials:'omit',referrerPolicy:'no-referrer',signal:AbortSignal.timeout(15000)});if(current!==version)return;if(!response.ok)throw Error();const result=await response.json();if(current!==version)return;if(typeof result.paymentLabel!=='string')throw Error();payment.textContent=result.paymentLabel;request.paymentStatus='Paid';updateIntroduction();button.remove();}catch{if(current===version){payment.textContent='Could not mark paid. Try again.';button.disabled=false;}}});}
  }
  const detail=(label,value)=>{const section=document.createElement('section'),h=document.createElement('h3'),p=document.createElement('p');h.textContent=label;p.textContent=value;section.append(h,p);article.append(section);};
  detail('Pilot ask',request.ask);
  if(request.industry)detail('Product type',request.industry);
  if(request.topFeatures?.length){const section=document.createElement('section'),h=document.createElement('h3'),ul=document.createElement('ul');h.textContent='Top 2 features';for(const value of request.topFeatures){const li=document.createElement('li');li.textContent=value;ul.append(li);}section.append(h,ul);article.append(section);}
  if(request.pilotsDone!==undefined)detail('Number of pilots done',request.pilotsDone);
  if(request.why)detail('Why it fits your company',request.why);
  if(request.status==='Requested'){
    const note=document.createElement('p');note.className='notification-status';note.setAttribute('role','status');note.textContent=request.notifiedAt?'Notified':'Not notified';article.append(note);
    if(request.requestsLink){const button=BestoAdminWhatsApp.button('Notify operator',request.operatorPhone,BestoAdminWhatsApp.notify(request.operatorName,request.founderCompany??'',request.requestsLink));if(button){article.append(button);let marking=false;button.addEventListener('click',async()=>{if(marking)return;marking=true;const current=version;note.textContent='Marking Notified...';note.classList.remove('error');try{const response=await fetch('/api/admin/notify-operator',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({code,requestId:request.requestId,requestedAt:request.requestedAt}),cache:'no-store',credentials:'omit',referrerPolicy:'no-referrer',signal:AbortSignal.timeout(15000)});if(current!==version)return;if(!response.ok)throw Error();note.textContent='Notified';}catch{if(current===version){note.textContent='Could not mark Notified. Tap again to retry.';note.classList.add('error');}}finally{marking=false;}});}}
    else{const missing=document.createElement('p');missing.textContent='Personal link unavailable. Refresh requests.';article.append(missing);}
  }
  lists[request.status].append(article);shown.add(request.requestId);
}
async function load(){
  if(loading)return;
  if(!/^[A-Za-z0-9_-]{43}$/.test(code??'')){clear();panel.setAttribute('aria-busy','false');showMessage('Access denied. Open your private admin link.',true);return;}
  loading=true;panel.setAttribute('aria-busy','true');refresh.disabled=true;more.disabled=true;
  const requestVersion=version;controller=new AbortController();showMessage('Loading meeting requests...');
  try{
    const response=await fetch('/api/admin/requests',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({code,cursor}),cache:'no-store',credentials:'omit',referrerPolicy:'no-referrer',signal:AbortSignal.any([controller.signal,AbortSignal.timeout(15000)])});
    if(requestVersion!==version)return;
    if(response.status===404){clear();showMessage('Access denied. Open your private admin link.',true);return;}
    if(!response.ok)throw Error('Unable to load');
    const result=await response.json();if(requestVersion!==version)return;
    for(const request of result.requests)addCard(request);
    cursor=result.continueCursor;content.hidden=false;more.hidden=result.isDone;
    document.getElementById('new-empty').hidden=lists.Requested.childElementCount>0;
    document.getElementById('accepted-empty').hidden=lists.Accepted.childElementCount>0;
    document.getElementById('declined-empty').hidden=lists.Declined.childElementCount>0;
    refresh.hidden=false;refresh.textContent='Refresh requests';showMessage('');
  }catch{
    if(requestVersion!==version)return;
    showMessage('Busy right now. Try again in a few minutes.',true);refresh.hidden=false;refresh.textContent='Try again';
  }finally{if(requestVersion===version){loading=false;panel.setAttribute('aria-busy','false');refresh.disabled=false;more.disabled=false;}}
}
function restart(){version++;controller?.abort();loading=false;cursor=null;clear();code=new URLSearchParams(location.hash.slice(1)).get('a');void load();}
refresh.addEventListener('click',()=>{if(refresh.textContent==='Try again')void load();else restart();});
more.addEventListener('click',()=>void load());
addEventListener('hashchange',restart);
addEventListener('besto:operator-links-ready',restart);
addEventListener('pagehide',()=>{version++;controller?.abort();clear();});
addEventListener('pageshow',event=>{if(event.persisted)restart();});
restart();heading.focus({preventScroll:true});

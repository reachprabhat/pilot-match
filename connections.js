// Stale contact fields are ignored. Only a server-authorized paid introduction adds a WhatsApp draft button.
(() => {
  const role=location.pathname==='/operator.html'?'operator':'founder',prefix=role==='operator'?'o':'f';
  const main=document.querySelector('main'),cards=document.createElement('section');
  cards.id='connections';cards.hidden=true;cards.setAttribute('aria-label',role==='founder'?'Your operators':'Your accepted connections');
  const founderCards=document.getElementById('confirmed-cards'),empty=role==='founder'?document.getElementById('confirmed-empty'):null;
  if(role==='founder'&&founderCards)founderCards.append(cards);else main.prepend(cards);
  let version=0,controller,timer;
  function details(row){
    const article=document.createElement('article');article.className='connection-card';article.dataset.requestId=row.requestId;
    if(role==='founder'){article.dataset.operatorId=row.operatorId||'';const label=document.createElement('h2');label.textContent=Number.isSafeInteger(row.operatorNumber)&&row.operatorNumber>0?`Operator ${row.operatorNumber}`:'Operator';article.append(label);}
    const status=row.status||'Accepted';
    const note=document.createElement('p');note.className='meeting-status';note.textContent=status==='Requested'?'Waiting for the operator to respond.':status==='Declined'?'The operator declined this request.':'Accepted. Besto will introduce you on WhatsApp shortly.';article.append(note);
    if(row.paymentLabel){const payment=document.createElement('p');payment.className='payment-status';payment.textContent=row.paymentLabel;article.append(payment);}
    if(row.locked){
      const message=document.createElement('p');message.textContent='Pay ₹499 for a WhatsApp introduction. Scan the QR with any UPI app. Besto will introduce you after payment is confirmed.';article.append(message);
      if(row.qrUrl){const qr=document.createElement('img');qr.src=row.qrUrl;qr.alt='UPI payment QR code';qr.className='payment-qr';article.append(qr);}else{const missing=document.createElement('p');missing.textContent='The payment QR is not available yet. Please check back shortly.';article.append(missing);}
      const waiting=document.createElement('p');waiting.textContent='Waiting for payment confirmation.';waiting.setAttribute('role','status');article.append(waiting);
    }
    if(role==='founder'&&status==='Accepted'&&!row.locked&&row.messageUrl&&row.operatorFirstName){
      try{const url=new URL(row.messageUrl);if(url.origin==='https://wa.me'&&/^\/\d{10,15}$/.test(url.pathname)){const button=document.createElement('a');button.className='founder-whatsapp';button.textContent=`Message ${row.operatorFirstName} on WhatsApp`;button.href=url.href;button.target='_blank';button.rel='noopener noreferrer';article.append(button);}}catch{}
    }
    return article;
  }
  const clear=()=>{cards.replaceChildren();cards.hidden=true;};
  async function refresh(){
    const code=new RegExp('^#'+prefix+'=([A-Za-z0-9_-]{43})$').exec(location.hash)?.[1];
    if(!code||document.hidden)return;
    const current=++version;controller?.abort();controller=new AbortController();const signal=controller.signal;
    try{
      let cursor=null,rows=[];
      do{const response=await fetch('/api/introductions',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({code,role,cursor}),cache:'no-store',credentials:'omit',referrerPolicy:'no-referrer',signal:AbortSignal.any([signal,AbortSignal.timeout(15000)])});if(!response.ok)throw Error();const result=await response.json();if(current!==version||signal.aborted)return;rows.push(...result.introductions);cursor=result.isDone?null:result.continueCursor;}while(cursor);
      if(role==='founder')window.dispatchEvent(new CustomEvent('besto:requested-operators',{detail:rows.map(row=>row.operatorId).filter(Boolean)}));
      cards.replaceChildren(...rows.map(details));cards.hidden=rows.length===0;
      if(empty){empty.hidden=rows.length>0;empty.textContent='No requested operators yet. Request to meet a best-fit operator to get started.';}
    }catch{if(current!==version||signal.aborted)return;clear();if(empty){empty.hidden=false;empty.textContent='Your operators could not load. Reload to try again.';}}
    finally{if(current===version){clearTimeout(timer);timer=setTimeout(refresh,15000);}}
  }
  window.addEventListener('hashchange',()=>{clear();void refresh();});window.addEventListener('pageshow',()=>void refresh());
  window.addEventListener('pagehide',()=>{version++;controller?.abort();clearTimeout(timer);clear();});
  document.addEventListener('visibilitychange',()=>{if(document.hidden){version++;controller?.abort();clearTimeout(timer);}else void refresh();});
  window.addEventListener('connection-status-changed',()=>void refresh());void refresh();
})();

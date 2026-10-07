// Both screens use the same owner-checked endpoint. Contacts are never kept in browser storage.
(() => {
  const role = location.pathname === '/operator.html' ? 'operator' : 'founder';
  const prefix = role === 'operator' ? 'o' : 'f';
  const main = document.querySelector('main');
  const cards = document.createElement('section');
  cards.id = 'connections'; cards.hidden = true; cards.setAttribute('aria-label', 'Your accepted connections');
  main.prepend(cards);
  const dialog = document.createElement('dialog');
  dialog.className = 'connection-reveal'; dialog.setAttribute('aria-labelledby', 'connection-title');
  document.body.append(dialog);
  let version = 0, controller, code, timer, active, queue = [], seen = new Set();
  const key = row => row.requestId + ':' + row.requestedAt + (row.locked ? ':locked' : ':open');
  const clear = () => { dialog.close(); dialog.replaceChildren(); cards.replaceChildren(); cards.hidden = true; active = undefined; queue = []; };
  const post = async (path, body, signal) => {
    const response = await fetch('/api/' + path, {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({code, role, ...body}), cache: 'no-store', credentials: 'omit', referrerPolicy: 'no-referrer', signal: AbortSignal.any([signal, AbortSignal.timeout(15000)])});
    if (!response.ok) throw new Error('Connection unavailable');
    return response.json();
  };
  function details(row, fullScreen = false) {
    const article = document.createElement('article'); article.className = 'connection-card';
    article.dataset.requestId = row.requestId;
    const heading = document.createElement(fullScreen ? 'h1' : 'h2');
    heading.textContent = row.locked ? (row.price !== undefined ? `Accepted. Pay ₹${row.price.toLocaleString('en-IN')} to see who it is` : 'Accepted. Payment details will be available soon.') : 'You’re connected';
    if (fullScreen) { heading.id = 'connection-title'; heading.tabIndex = -1; }
    if (row.locked) {
      article.classList.add('connection-locked'); article.append(heading);
      const note = document.createElement('p'); note.className = 'connection-welcome'; note.textContent = 'Your introduction will unlock after payment is confirmed.'; article.append(note);
      if (row.paymentLink && row.price !== undefined) {
        const pay = document.createElement('a'); pay.className = 'primary connection-payment'; pay.textContent = `Pay ₹${row.price.toLocaleString('en-IN')}`;
        pay.href = row.paymentLink; pay.target = '_blank'; pay.rel = 'noopener noreferrer'; pay.referrerPolicy = 'no-referrer'; article.append(pay);
      }
      return article;
    }
    const welcome = document.createElement('p'); welcome.className = 'connection-welcome'; welcome.textContent = row.welcome;
    const name = document.createElement('p'), phone = document.createElement('p');
    name.className = 'connection-name'; phone.className = 'connection-phone';
    const nameBold = document.createElement('strong'), phoneBold = document.createElement('strong');
    nameBold.textContent = row.name; phoneBold.textContent = row.whatsappNumber;
    name.append(nameBold); phone.append(phoneBold); article.append(heading, welcome, name, phone);
    for (const field of ['company', 'location']) if (row[field]) {
      const fact = document.createElement('p'); fact.className = 'connection-fact'; fact.textContent = row[field]; article.append(fact);
    }
    const savedDigits = row.whatsappNumber.replace(/\D/g, '');
    const digits = savedDigits.length === 10 ? '91' + savedDigits : savedDigits;
    if (digits.length >= 7 && digits.length <= 15) {
      const message = document.createElement('a'); message.className = 'primary connection-whatsapp'; message.textContent = 'Message on WhatsApp';
      const firstName = row.name.trim().split(/\s+/u)[0] || 'there';
      const text = `Hi ${firstName}, we were introduced through Besto. Would love to set up a quick call.`;
      message.href = 'https://wa.me/' + digits + '?text=' + encodeURIComponent(text); message.target = '_blank'; message.rel = 'noopener noreferrer'; message.referrerPolicy = 'no-referrer'; article.append(message);
    } else {
      const note = document.createElement('p'); note.className = 'connection-fact'; note.textContent = 'A WhatsApp number has not been saved yet.'; article.append(note);
    }
    return article;
  }
  async function recordSeen(row, currentVersion) {
    if (row.locked) { if (currentVersion === version) seen.add(key(row)); return currentVersion === version; }
    try {
      await post('introductions/seen', {requestId: row.requestId, requestedAt: row.requestedAt}, controller.signal);
      if (currentVersion === version) seen.add(key(row));
      return currentVersion === version;
    } catch { return false; }
  }
  function revealNext(currentVersion) {
    if (currentVersion !== version || !queue.length) { dialog.close(); dialog.replaceChildren(); active = undefined; return; }
    const row = queue.shift(); active = row;
    const content = details(row, true);
    const continueButton = document.createElement('button'); continueButton.type = 'button'; continueButton.className = 'secondary connection-continue'; continueButton.textContent = 'Continue';
    const note = document.createElement('p'); note.className = 'connection-note'; note.hidden = true; note.setAttribute('role', 'status');
    continueButton.addEventListener('click', async () => {
      continueButton.disabled = true;
      if (!seen.has(key(row)) && !await recordSeen(row, currentVersion)) {
        note.textContent = 'Could not save this view. Check your connection and try again.'; note.hidden = false; continueButton.disabled = false; return;
      }
      revealNext(currentVersion);
    });
    content.append(continueButton, note);
    const shell = document.createElement('div'); shell.className = 'reveal-shell';
    shell.append(document.querySelector('body > .brand-header').cloneNode(true), content, document.querySelector('body > .brand-footer').cloneNode(true));
    dialog.replaceChildren(shell);
    if (!dialog.open) dialog.showModal();
    content.querySelector('h1').focus({preventScroll: true}); dialog.scrollTop = 0;
    // Save only after the welcome has actually been painted, independently for each person.
    requestAnimationFrame(() => requestAnimationFrame(() => { if (currentVersion === version && dialog.open && active === row) recordSeen(row, currentVersion); }));
  }
  dialog.addEventListener('cancel', event => {event.preventDefault(); dialog.querySelector('.connection-continue')?.click();});
  async function refresh(reset = false, allowReveal = false) {
    const fragment = new RegExp('^#' + prefix + '=([A-Za-z0-9_-]{43})$').exec(location.hash);
    if (reset) { version++; controller?.abort(); clearTimeout(timer); clear(); seen.clear(); }
    code = fragment?.[1];
    if (!code || document.hidden) return;
    const currentVersion = version;
    controller?.abort(); controller = new AbortController(); const signal = controller.signal;
    try {
      let cursor = null, rows = [], pending = false;
      do {
        const result = await post('introductions', {cursor}, signal);
        if (currentVersion !== version || signal.aborted) return;
        rows.push(...result.introductions); pending ||= result.pending;
        cursor = result.isDone ? null : result.continueCursor;
      } while (cursor);
      cards.replaceChildren(...rows.map(row => details(row))); cards.hidden = rows.length === 0 && !pending;
      if (pending) {
        const notice = document.createElement('p'); notice.className = 'connection-card'; notice.textContent = 'Busy right now. Try again in a few minutes.'; notice.setAttribute('role', 'status'); cards.append(notice);
      }
      if (active && !rows.some(row => key(row) === key(active))) { dialog.close(); dialog.replaceChildren(); active = undefined; }
      if (allowReveal && !active) {
        queue = rows.filter(row => !row.seen && !seen.has(key(row)));
        if (queue.length) revealNext(currentVersion);
      } else queue = queue.filter(item => rows.some(row => key(row) === key(item)));
      clearTimeout(timer);
      timer = setTimeout(() => refresh(false, allowReveal), pending ? 2500 : 15000);
    } catch {
      if (currentVersion !== version || signal.aborted) return;
      clear(); clearTimeout(timer);
      timer = setTimeout(() => refresh(false, allowReveal), 15000);
    }
  }
  window.addEventListener('hashchange', () => refresh(true, true));
  window.addEventListener('pageshow', () => refresh(true, true));
  window.addEventListener('pagehide', () => {version++; controller?.abort(); clearTimeout(timer); clear();});
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {version++; controller?.abort(); clearTimeout(timer); clear();}
    else refresh(false, true);
  });
  window.addEventListener('connection-status-changed', () => {version++; controller?.abort(); clearTimeout(timer); clear(); refresh(false, false);});
  if (document.readyState === 'complete') refresh(true, true);
})();

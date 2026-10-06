const landing = document.getElementById('landing');
const ask = document.getElementById('ask');
const pilotAsk = document.getElementById('pilot-ask');
const openAsk = document.getElementById('open-ask');
const company = document.getElementById('founder-company');
const linkState = document.getElementById('link-state');
const linkTitle = document.getElementById('link-title');
const linkMessage = document.getElementById('link-message');
const retryLink = document.getElementById('retry-link');
let lookup;
const searchButton = document.getElementById('search');
const matchingNote = document.getElementById('matching-note');
const searchMessage = document.getElementById('search-message');
let personalCode;
let remaining = 0;
let searchLimit = 3;
let submitting;
let pendingRequest;

function showSearchMessage(message, error = false) {
  searchMessage.textContent = message;
  searchMessage.hidden = !message;
  searchMessage.classList.toggle('error', error);
}

function updateSearchButton() {
  const words = pilotAsk.value.trim().split(/\s+/u).filter(Boolean).length;
  searchButton.disabled = !personalCode || remaining === 0 || !!submitting || words === 0 || words > 300 || pilotAsk.value.length > 12000;
  searchButton.textContent = submitting ? 'Saving your ask...' : 'Search';
  matchingNote.textContent = !personalCode ? 'Matching opens soon'
    : remaining === 0 ? `You’ve used all ${searchLimit} searches.`
    : `${remaining} ${remaining === 1 ? 'search' : 'searches'} remaining. Maximum 300 words.`;
}

function applySearchState(state) {
  if (!Number.isInteger(state.searchesRemaining) || state.searchesRemaining < 0 ||
      !Number.isInteger(state.searchLimit) || state.searchLimit < 1 || state.searchesRemaining > state.searchLimit)
    throw new Error('Invalid search state');
  remaining = state.searchesRemaining;
  searchLimit = state.searchLimit;
  updateSearchButton();
}

async function openPersonalLink() {
  submitting?.abort();
  submitting = undefined;
  personalCode = undefined;
  showSearchMessage('');
  updateSearchButton();
  lookup?.abort();
  lookup = new AbortController();
  const current = lookup;
  const fragment = window.location.hash;
  pilotAsk.value = '';
  company.hidden = true;
  company.textContent = '';
  if (!fragment) {
    landing.hidden = false;
    ask.hidden = true;
    linkState.hidden = true;
    return;
  }
  landing.hidden = true;
  ask.hidden = true;
  linkState.hidden = false;
  retryLink.hidden = true;
  linkMessage.classList.remove('error');
  linkTitle.textContent = 'Opening your personal link';
  linkMessage.textContent = 'Loading your company...';
  const match = /^#f=([A-Za-z0-9_-]{43})$/.exec(fragment);
  const invalid = () => {
    linkTitle.textContent = 'This personal link is not valid';
    linkMessage.textContent = 'Ask the person who invited you for your personal link.';
    linkMessage.classList.add('error');
    linkTitle.focus();
  };
  if (!match) { invalid(); return; }
  const timeout = setTimeout(() => current.abort(), 15000);
  try {
    const response = await fetch('/api/founder', {
      method: 'POST', headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({code: match[1]}), signal: current.signal,
      cache: 'no-store', credentials: 'omit', referrerPolicy: 'no-referrer',
    });
    if (lookup !== current) return;
    if (response.status === 400 || response.status === 404) { invalid(); return; }
    if (!response.ok) throw new Error('Link lookup failed');
    const founder = await response.json();
    if (lookup !== current) return;
    if (typeof founder.company !== 'string') throw new Error('Invalid reply');
    applySearchState(founder);
    personalCode = match[1];
    updateSearchButton();
    company.textContent = `For ${founder.company || 'your company'}`;
    company.hidden = false;
    linkState.hidden = true;
    ask.hidden = false;
    document.getElementById('ask-title').focus();
  } catch {
    if (lookup !== current) return;
    linkTitle.textContent = 'Your link could not open';
    linkMessage.textContent = 'Check your connection, then try again.';
    linkMessage.classList.add('error');
    retryLink.hidden = false;
    linkTitle.focus();
  } finally { clearTimeout(timeout); }
}

openAsk.addEventListener('click', () => {
  landing.hidden = true;
  ask.hidden = false;
  document.getElementById('ask-title').focus();
});

document.getElementById('back').addEventListener('click', () => {
  submitting?.abort();
  submitting = undefined;
  personalCode = undefined;
  pendingRequest = undefined;
  showSearchMessage('');
  updateSearchButton();
  lookup?.abort();
  lookup = undefined;
  history.replaceState(null, '', '/');
  company.hidden = true;
  company.textContent = '';
  pilotAsk.value = '';
  ask.hidden = true;
  landing.hidden = false;
  openAsk.focus();
});

retryLink.addEventListener('click', openPersonalLink);
window.addEventListener('hashchange', openPersonalLink);
window.addEventListener('pageshow', openPersonalLink);

pilotAsk.addEventListener('input', () => {
  const words = pilotAsk.value.trim().split(/\s+/u).filter(Boolean).length;
  showSearchMessage(words > 300 || pilotAsk.value.length > 12000 ? 'Keep your ask within 300 words and 12,000 characters.' : '', true);
  updateSearchButton();
});

searchButton.addEventListener('click', async () => {
  if (searchButton.disabled) return;
  const code = personalCode;
  const text = pilotAsk.value.trim();
  if (!pendingRequest || pendingRequest.code !== code || pendingRequest.ask !== text)
    pendingRequest = {code, ask: text, requestId: crypto.randomUUID()};
  const controller = new AbortController();
  submitting = controller;
  updateSearchButton();
  showSearchMessage('');
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch('/api/search', {
      method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(pendingRequest),
      signal: controller.signal, cache: 'no-store', credentials: 'omit', referrerPolicy: 'no-referrer',
    });
    if (submitting !== controller) return;
    if (response.status === 404) {
      personalCode = undefined;
      showSearchMessage('Your personal link is no longer valid. Ask the person who invited you for a new link.', true);
      return;
    }
    if (response.status === 400) {
      showSearchMessage('Enter your pilot ask in 300 words or fewer.', true);
      return;
    }
    if (!response.ok && response.status !== 429) throw new Error('Search failed');
    const result = await response.json();
    if (submitting !== controller) return;
    if (result.status !== 'saved' && result.status !== 'limit_reached') throw new Error('Invalid reply');
    applySearchState(result);
    pendingRequest = undefined;
    showSearchMessage(result.status === 'saved' ? 'Your ask is saved. Matching opens soon.' : '');
  } catch {
    if (submitting === controller) showSearchMessage('Busy right now. Try again in a few minutes.', true);
  } finally {
    clearTimeout(timeout);
    if (submitting === controller) {submitting = undefined; updateSearchButton();}
  }
});

// Refresh counts after using another tab or after the owner resets them. Never clear the typed ask.
async function refreshSearchCount() {
  if (!personalCode || submitting) return;
  const code = personalCode;
  try {
    const response = await fetch('/api/founder', {
      method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({code}),
      cache: 'no-store', credentials: 'omit', referrerPolicy: 'no-referrer', signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) return;
    const state = await response.json();
    if (personalCode === code && !submitting) applySearchState(state);
  } catch { /* Keep the last known count; Convex still enforces the limit. */ }
}
window.addEventListener('focus', refreshSearchCount);
document.addEventListener('visibilitychange', () => {if (!document.hidden) refreshSearchCount();});

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
const matchesSection = document.getElementById('matches');
const matchCards = document.getElementById('match-cards');
const backToAsk = document.getElementById('back-to-ask');
const resultsMessage = document.getElementById('results-message');
let searchVersion = 0;

function renderFounderScreen(focus = true) {
  if (!personalCode) return;
  const results = new URL(location.href).searchParams.get('screen') === 'results' && matchCards.children.length === 2;
  landing.hidden = true;
  linkState.hidden = true;
  ask.hidden = results;
  matchesSection.hidden = !results;
  const backUrl = new URL(location.href);
  backUrl.searchParams.set('screen', 'ask');
  backToAsk.href = backUrl.pathname + backUrl.search + backUrl.hash;
  if (focus) {
    document.getElementById(results ? 'matches-title' : 'ask-title').focus();
    window.scrollTo(0, 0);
  }
}

function navigateFounderScreen(screen) {
  const url = new URL(location.href);
  url.searchParams.set('screen', screen);
  history.pushState(null, '', url.pathname + url.search + url.hash);
  renderFounderScreen();
}

backToAsk.addEventListener('click', event => {
  event.preventDefault();
  navigateFounderScreen('ask');
});
window.addEventListener('popstate', () => {
  if (personalCode && location.hash === '#f=' + personalCode) renderFounderScreen();
  else openPersonalLink();
});

function clearMatches() {matchesSection.hidden = true; matchCards.replaceChildren();}
function showMatches(matches, focus = true) {
  if (!Array.isArray(matches) || matches.length !== 2 || new Set(matches.map(match => match.operatorId)).size !== 2 ||
      matches.some(match => typeof match.operatorId !== 'string' || !Number.isInteger(match.score) || match.score < 0 || match.score > 100 || typeof match.why !== 'string' || !match.why))
    throw new Error('Invalid matches');
  matchCards.replaceChildren();
  for (const match of matches) {
    const card = document.createElement('article');
    const title = document.createElement('h2');
    const score = document.createElement('p');
    const reason = document.createElement('p');
    title.textContent = `Operator ${match.operatorId}`;
    score.className = 'fit-score';
    score.textContent = `${match.score}/100`;
    score.setAttribute('aria-label', `Fit score ${match.score} out of 100`);
    reason.textContent = match.why.replace(/\bSCM\b/g, 'supply chain management');
    const actions = document.createElement('div');
    actions.className = 'choice-actions';
    const status = document.createElement('p');
    status.className = 'choice-status';
    status.setAttribute('role', 'status');
    let savedChoice = match.choice || '';
    let savedResponse = match.response || '';
    const displayChoice = () => savedChoice === 'Requested' && savedResponse ? savedResponse : savedChoice;
    let saving = false;
    const buttons = [];
    const updateChoice = () => {
      status.classList.remove('error');
      status.textContent = displayChoice();
      for (const button of buttons) button.setAttribute('aria-pressed', String(button.dataset.status === savedChoice));
    };
    for (const [label, value] of [['Request to meet', 'Requested'], ['Park', 'Parked'], ['Reject', 'Rejected']]) {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = label;
      button.className = value === 'Requested' ? 'primary' : 'secondary';
      button.dataset.status = value;
      buttons.push(button);
      actions.append(button);
      button.addEventListener('click', async () => {
        if (saving || !personalCode) return;
        const code = personalCode;
        const version = searchVersion;
        saving = true;
        buttons.forEach(item => {item.disabled = true;});
        status.classList.remove('error');
        status.textContent = 'Saving...';
        try {
          const response = await fetch('/api/choice', {
            method: 'POST', headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({code, operatorId: match.operatorId, status: value}),
            cache: 'no-store', credentials: 'omit', referrerPolicy: 'no-referrer', signal: AbortSignal.timeout(15000),
          });
          const result = await response.json();
          if (personalCode !== code || searchVersion !== version || !card.isConnected) return;
          if (!response.ok || result.operatorId !== match.operatorId || result.status !== value) {
            if (response.status === 409) throw new Error('Reload to choose from your latest matches.');
            throw new Error('Could not confirm your choice. Try again or reload.');
          }
          savedChoice = result.status;
          savedResponse = result.response || '';
          updateChoice();
          window.dispatchEvent(new Event('connection-status-changed'));
        } catch (error) {
          if (personalCode !== code || searchVersion !== version || !card.isConnected) return;
          status.textContent = `${displayChoice() ? displayChoice() + '. ' : ''}${error.message === 'Reload to choose from your latest matches.' ? error.message : 'Could not confirm your choice. Try again or reload.'}`;
          status.classList.add('error');
        } finally {
          saving = false;
          buttons.forEach(item => {item.disabled = false;});
        }
      });
    }
    updateChoice();
    card.append(title, score, reason, actions, status);
    matchCards.append(card);
  }
  if (focus) navigateFounderScreen('results');
  else renderFounderScreen(false);
}

async function restoreMatches(code, signal, restoreAsk = false) {
  const version = searchVersion;
  const response = await fetch('/api/matches', {
    method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({code}),
    cache: 'no-store', credentials: 'omit', referrerPolicy: 'no-referrer', signal,
  });
  if (!response.ok) throw new Error('Could not load saved matches');
  const result = await response.json();
  if (personalCode !== code || version !== searchVersion) return;
  if (restoreAsk && typeof result.ask === 'string') {
    pilotAsk.value = result.ask;
    updateSearchButton();
  }
  if (result.matches?.length) showMatches(result.matches, false);
}

function showSearchMessage(message, error = false) {
  searchMessage.textContent = message;
  searchMessage.hidden = !message;
  searchMessage.classList.toggle('error', error);
  resultsMessage.textContent = message;
  resultsMessage.hidden = !message || matchesSection.hidden;
  resultsMessage.classList.toggle('error', error);
}

function updateSearchButton() {
  const words = pilotAsk.value.trim().split(/\s+/u).filter(Boolean).length;
  searchButton.disabled = !personalCode || remaining === 0 || !!submitting || words === 0 || words > 300 || pilotAsk.value.length > 12000;
  searchButton.textContent = submitting ? 'Searching...' : 'Search';
  document.getElementById('personal-link-guidance').hidden = !!personalCode;
  matchingNote.textContent = !personalCode ? 'A personal link is needed to search.'
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
  searchVersion++;
  clearMatches();
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
    try {
      await restoreMatches(personalCode, current.signal, true);
      if (lookup === current) renderFounderScreen();
    }
    catch { if (lookup === current) showSearchMessage('Your saved matches could not load. Reload to try again.', true); }
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
  searchVersion++;
  clearMatches();
  submitting?.abort();
  submitting = undefined;
  pendingRequest = undefined;
  showSearchMessage('');
  updateSearchButton();
  lookup?.abort();
  lookup = undefined;
  history.replaceState(null, '', personalCode ? '/#f=' + personalCode : '/');
  if (!personalCode) {
    company.hidden = true;
    company.textContent = '';
    pilotAsk.value = '';
  }
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
  searchVersion++;
  clearMatches();
  const code = personalCode;
  const text = pilotAsk.value.trim();
  if (!pendingRequest || pendingRequest.code !== code || pendingRequest.ask !== text)
    pendingRequest = {code, ask: text, requestId: crypto.randomUUID()};
  const controller = new AbortController();
  submitting = controller;
  updateSearchButton();
  showSearchMessage('Looking for the best operators...');
  const timeout = setTimeout(() => controller.abort(), 70000);
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
    if (!response.ok && response.status !== 429) {pendingRequest = undefined; throw new Error('Search failed');}
    const result = await response.json();
    if (submitting !== controller) return;
    if (result.status !== 'matched' && result.status !== 'limit_reached') throw new Error('Invalid reply');
    showSearchMessage('');
    if (result.status === 'matched') {
      showMatches(result.matches);
      try { await restoreMatches(code, controller.signal); }
      catch { showSearchMessage('Your matches are saved. Reload to see their saved choices.', true); }
    }
    applySearchState(result);
    pendingRequest = undefined;
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
  const version = searchVersion;
  try {
    const response = await fetch('/api/founder', {
      method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({code}),
      cache: 'no-store', credentials: 'omit', referrerPolicy: 'no-referrer', signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) return;
    const state = await response.json();
    if (personalCode === code && !submitting && searchVersion === version) applySearchState(state);
  } catch { /* Keep the last known count; Convex still enforces the limit. */ }
}
window.addEventListener('focus', refreshSearchCount);
document.addEventListener('visibilitychange', () => {if (!document.hidden) refreshSearchCount();});

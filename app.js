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

async function openPersonalLink() {
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

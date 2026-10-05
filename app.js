const landing = document.getElementById('landing');
const ask = document.getElementById('ask');
const pilotAsk = document.getElementById('pilot-ask');
const openAsk = document.getElementById('open-ask');

openAsk.addEventListener('click', () => {
  landing.hidden = true;
  ask.hidden = false;
  document.getElementById('ask-title').focus();
});

document.getElementById('back').addEventListener('click', () => {
  pilotAsk.value = '';
  ask.hidden = true;
  landing.hidden = false;
  openAsk.focus();
});

window.addEventListener('pageshow', () => { pilotAsk.value = ''; });

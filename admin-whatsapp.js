window.BestoAdminWhatsApp=(()=>{
const first=name=>name.trim().split(/\s+/)[0];
const url=(number,message)=>{let digits=number.replace(/\D/g,'');if(digits.length===10)digits='91'+digits;return digits?`https://wa.me/${digits}?text=${encodeURIComponent(message)}`:null;};
const welcome=(name,link)=>`Hi ${first(name)}, you're now on Besto. Founders' pilot requests for you will appear here: ${link}`;
const notify=(name,company,link)=>`Hi ${first(name)}, ${company} wants to meet you about a pilot on Besto. Review and respond here: ${link}`;
const button=(label,number,message)=>{const href=url(number,message);if(!href)return null;const link=document.createElement('a');link.className='primary admin-whatsapp';link.textContent=label;link.href=href;link.target='_blank';link.rel='noopener noreferrer';link.referrerPolicy='no-referrer';return link;};
return {url,welcome,notify,button};
})();

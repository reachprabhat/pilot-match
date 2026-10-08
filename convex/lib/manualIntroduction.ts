export type Person={name:string;currentRole:string;company:string;whatsappNumber:string;about?:string;topFeatures?:string};
export type Kind='founder'|'operator'|'outreach';
export type Parts={product:string;pilot:string;why:string;nextStep:string;paragraphs?:string[]};
export const firstName=(name:string)=>name.trim().split(/\s+/)[0];
const known=(s:string|undefined)=>s?.trim()&&!/^(not found|unknown|n\/?a|none|-)$/i.test(s.trim());
const clip=(s:string,n:number)=>s.trim().split(/\s+/).slice(0,n).join(' ').replace(/[.,;:!?]+$/,'');
const fragment=(s:string)=>s.replace(/^(?:we(?:'re| are)?|I(?:'m| am)?)\s+(?:(?:are|am)\s+)?(?:looking|seeking)\s+(?:to\s+(?:explore|run|do)\s+|for\s+)?/i,'').replace(/^planning\s+/i,'');
export function templateParts(founder:Person,ask:string,why:string):Parts{return {product:known(founder.topFeatures)?founder.topFeatures!.trim():known(founder.about)?founder.about!.trim():'a product they would like to pilot',pilot:ask.trim(),why:known(why)?why.trim():'relevant experience for this pilot',nextStep:'Would you be up for a 20-minute call this week?'};}
export function validateProse(text:string,kind:Kind){
 const paragraphs=text.split(/\n\s*\n/);return text.trim().split(/\s+/).length<90&&paragraphs.length>=2&&paragraphs.length<=3&&/^Hi [^\n]+,\n/.test(text)&&!/[{}<>]|\bthe (?:operator|founder)\b/i.test(text)&&!/(?:^|\n)\s*[^\n]{1,70}:|Why Besto's AI matched you:|The pilot they want:|Why it fits:|My product:|The pilot I'd like to explore:|I'd value your view on this:/i.test(text)&&(kind==='outreach'?!text.includes('Team Besto')&&text.endsWith('Would you be up for a 20-minute call this week?'):text.endsWith('Team Besto')&&!/\bI(?:['’]m| am)\b|\bmy (?:experience|role|background)\b|\b(?:matched|reach) me\b/i.test(text));
}
export function compose(founder:Person,operator:Person,kind:Kind,parts:Parts){
 const f=firstName(founder.name),o=firstName(operator.name),fc=clip(founder.company,5),oc=clip(known(operator.company)?operator.company:'their company',5),role=clip(known(operator.currentRole)?operator.currentRole:'a professional',8);
 const replace=(s:string)=>s.replace(/\bthe operator\b/gi,o).replace(/\bthe founder\b/gi,f);
 const product=clip(fragment(replace(parts.product)),8),pilot=clip(fragment(replace(parts.pilot)),10);
 let paragraphs=parts.paragraphs;
 if(!paragraphs){
   if(kind==='founder')paragraphs=[`I'd like to introduce ${o}, ${role} at ${oc}. Besto's AI saw a fit between your pilot and ${o}'s background.`,`You can reach ${o} on WhatsApp at ${operator.whatsappNumber}. Could you message ${o} to explore the pilot together?`];
   else if(kind==='operator')paragraphs=[`I'd like to introduce ${f} from ${fc}, who is building ${product}.`,`${f} is looking to explore ${pilot}. Your experience could help shape the pilot. You can reach ${f} on WhatsApp at ${founder.whatsappNumber}.`];
   else paragraphs=[`I'm ${f} from ${fc}. We're building ${product}.`,`I'd love to explore ${pilot} with you. Your experience as ${role} at ${oc} would be valuable in shaping it.`];
 }
 if(paragraphs.length!==2)throw Error('Use two short body paragraphs.');
 const substitutions:Record<string,string>={founder:f,operator:o,founderCompany:founder.company,operatorCompany:operator.company,operatorRole:operator.currentRole,phone:kind==='founder'?operator.whatsappNumber:founder.whatsappNumber};
 const body=paragraphs.map(s=>s.replace(/\{\{(\w+)\}\}/g,(token,key)=>substitutions[key]??token).trim());
 const message=`Hi ${kind==='founder'?f:o},\n${body[0]}\n\n${body[1]}\n\n${kind==='outreach'?'Would you be up for a 20-minute call this week?':'Team Besto'}`;
 if(!validateProse(message,kind))throw Error('Invalid introduction prose.');return message;
}
export function whatsappUrl(number:string,message:string){let digits=number.replace(/\D/g,'');if(digits.length===10)digits='91'+digits;if(digits.length<10||digits.length>15)throw Error('A valid WhatsApp number is required.');return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;}

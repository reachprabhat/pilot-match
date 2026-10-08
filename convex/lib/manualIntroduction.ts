export type Person={name:string;currentRole:string;company:string;whatsappNumber:string;about?:string;topFeatures?:string};
export type Kind='founder'|'operator'|'outreach';
export type Parts={product:string;pilot:string;why:string;nextStep:string};
export const firstName=(name:string)=>name.trim().split(/\s+/)[0];
const known=(s:string|undefined)=>s?.trim()&&!/^(not found|unknown|n\/?a|none|-)$/i.test(s.trim());
export function templateParts(founder:Person,ask:string,why:string):Parts{return {product:known(founder.topFeatures)?founder.topFeatures!.trim():known(founder.about)?founder.about!.trim():'The product details can be discussed directly.',pilot:ask.trim(),why:known(why)?why.trim():'The saved match identifies relevant experience for this pilot discussion.',nextStep:'Please message them on WhatsApp to discuss the pilot and agree on a next step.'};}
export function compose(founder:Person,operator:Person,kind:Kind,parts:Parts){
 const role=known(operator.currentRole)?operator.currentRole:'role not provided',company=known(operator.company)?operator.company:'company not provided';
 if(kind==='founder')return `Hi ${firstName(founder.name)},\n\nMeet ${operator.name}, ${role} at ${company}.\n\nWhy Besto's AI matched you: ${parts.why}\n\n${operator.name}'s WhatsApp: ${operator.whatsappNumber}\n\n${parts.nextStep}\n\nTeam Besto`;
 if(kind==='operator')return `Hi ${firstName(operator.name)},\n\nMeet ${founder.name}, from ${founder.company}. Their product: ${parts.product}\n\nThe pilot they want: ${parts.pilot}\n\nWhy it fits: ${parts.why}\n\n${founder.name}'s WhatsApp: ${founder.whatsappNumber}\n\nPlease connect to discuss the pilot.\n\nTeam Besto`;
 return `Hi ${firstName(operator.name)},\n\nI'm ${founder.name}, from ${founder.company}. My product: ${parts.product}\n\nThe pilot I'd like to explore: ${parts.pilot}\n\nI'd value your view on this: ${parts.why}\n\nWould you be open to discussing the pilot and suggesting a useful next step?`;
}
export function whatsappUrl(number:string,message:string){let digits=number.replace(/\D/g,'');if(digits.length===10)digits='91'+digits;if(digits.length<10||digits.length>15)throw Error('A valid WhatsApp number is required.');return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;}

type Person = {name:string;currentRole:string;company:string;whatsappNumber:string};
const known=(value:string)=>Boolean(value?.trim()&&!/^(not found|not provided|unknown|n\/?a|none|-)$/i.test(value.trim()));
const describe=(person:Person)=>`${person.name} — ${known(person.currentRole)?person.currentRole:'role not provided'}, ${known(person.company)?person.company:'company not provided'}. WhatsApp: ${person.whatsappNumber}`;
export function introductionDraft(founder:Person,operator:Person,recipient:'founder'|'operator'){
  const person=recipient==='founder'?founder:operator;
  const message=`Hi ${person.name.trim().split(/\s+/)[0]}, this is Prabhat from Besto. You have both agreed to connect about a pilot.\n\nFounder: ${describe(founder)}\nOperator: ${describe(operator)}\n\nPlease connect on WhatsApp to discuss the pilot.`;
  let digits=person.whatsappNumber.replace(/\D/g,'');if(digits.length===10)digits='91'+digits;
  if(digits.length<10||digits.length>15)throw Error('A valid WhatsApp number is required.');
  return {message,url:`https://wa.me/${digits}?text=${encodeURIComponent(message)}`};
}

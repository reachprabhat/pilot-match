// Only the operator copy is redacted. The saved founder ask is never changed.
export function privateOpportunity(ask:string,founder:{name?:string;company?:string;whatsappNumber?:string}):string {
  let result=ask;
  const identities=[founder.name,founder.company,...(founder.name??"").split(/\s+/).filter(part=>part.length>=3)].filter((value):value is string=>Boolean(value?.trim()));
  for(const value of identities.sort((a,b)=>b.length-a.length)){
    const escaped=value.trim().replace(/[.*+?^${}()|[\]\\]/g,"\\$&");
    result=result.replace(new RegExp(`(?<![\\p{L}\\p{N}])${escaped}(?![\\p{L}\\p{N}])`,"giu"),"[private]");
  }
  const phone=(founder.whatsappNumber??"").replace(/\D/g,"");
  for(const digits of [...new Set([phone,phone.slice(-10)])].filter(value=>value.length>=7)){
    const flexible=digits.split("").join("[\\s().-]*");
    result=result.replace(new RegExp(`\\+?${flexible}`,"g"),"[private]");
  }
  return result.replace(/\b[\w.+-]+@[\w.-]+\.[a-z]{2,}\b/gi,"[private]")
    .replace(/(?:https?:\/\/|www\.)[^\s<>]+/gi,"[private]")
    .replace(/\+?\d[\d\s().-]{7,}\d/g,match=>match.replace(/\D/g,"").length>=10?"[private]":match);
}

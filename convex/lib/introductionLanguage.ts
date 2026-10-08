// Presentation-only rules. Saved asks, profiles and matching calculations are never changed.
const internalTerms=/\brevenue[\s_-]+(?:thresholds?|criteria|requirements?|cut[- ]?offs?|floors?|bands?)\b|\bqualif(?:ying|ied|y|ies|ication)\b|\beligib(?:le|ility)\b|\b(?:fit(?:ment)?|match(?:ing)?)[\s_-]+scores?\b|\b80\s*(?:\+|plus|and\s+above)|\btop[\s\-\u2013\u2014]*(?:2|two)\b|\b(?:matching|score|scoring)\s+(?:thresholds?|criteria|rules?|ranks?|rankings?)\b/i;
export const hasInternalMatchingTerms=(text:string)=>internalTerms.test(text);
export function plainIntroductionText(text:string){
  return text.split(/(?<=[.!?])\s+|[;\r\n]+/).map(part=>part.replace(/\b(?:qualifying|qualified|eligible)\s+/gi,'').trim()).filter(part=>part&&!hasInternalMatchingTerms(part)).join(' ');
}

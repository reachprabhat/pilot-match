export const pilotPreferences = ["Food", "Glassware", "Electrical goods", "Automotive safety", "Automobile manufacturing", "Alcoholic beverages", "Digital healthcare", "Stainless steel", "Office furniture", "Other"];
export const helpAreas = ["Raw material costs", "Energy costs", "Packaging costs", "Supply chain disruptions", "Shipping disruptions", "Currency swings", "Regulatory shifts", "Physical impacts", "Seasonal sales", "Geopolitical uncertainty", "Competition", "Working capital"];
import {revenueRanges} from "./revenueLabels";
export {revenueRanges} from "./revenueLabels";
export const consentText = "I agree founders I accept can see my name and WhatsApp.";
export type ApplicationInput = {name:string;company:string;role:string;city:string;whatsapp:string;linkedin:string;revenue:string;preferences:string[];areas:string[];consent:boolean;painPoints?:string;industryOther?:string};
export function validateApplication(input:unknown,legacyIndustry=false):ApplicationInput {
  if(!input || typeof input!=="object" || Array.isArray(input))throw Error("Check your answers and try again.");
  const body=input as Record<string,unknown>;
  const text=(key:string,max:number)=>{const value=body[key];if(typeof value!=="string" || !value.trim() || value.trim().length>max || /[\u0000-\u001f]/.test(value))throw Error("Enter a valid "+key+".");return value.trim();};
  const name=text("name",100),company=text("company",160),role=text("role",160),city=text("city",100),whatsapp=text("whatsapp",40),linkedin=text("linkedin",300),revenue=text("revenue",100);
  const digits=whatsapp.replace(/\D/g,"");if(!/^[+\d\s().-]+$/.test(whatsapp)||digits.length<10||digits.length>15)throw Error("Enter a WhatsApp number with 10 to 15 digits.");
  let url:URL;try{url=new URL(linkedin);}catch{throw Error("Enter a LinkedIn profile URL.");}
  if(url.protocol!=="https:"||!['linkedin.com','www.linkedin.com'].includes(url.hostname)||!/^\/in\/[^/]+\/?$/.test(url.pathname)||url.username||url.password||url.search||url.hash)throw Error("Enter a LinkedIn profile URL starting with https://www.linkedin.com/in/.");
  if(!revenueRanges.includes(revenue))throw Error("Choose a revenue range.");
  const chips=(key:string,allowed:string[])=>{const values=body[key];if(!Array.isArray(values)||values.length>3||values.some(value=>typeof value!=="string"||!allowed.includes(value))||new Set(values).size!==values.length)throw Error("Choose up to 3 valid "+key+".");return values as string[];};
  if(body.consent!==true)throw Error("Tick the consent box to submit.");
  const preferences=chips("preferences",pilotPreferences);
  if(!legacyIndustry&&preferences.length!==1)throw Error("Choose exactly one industry.");
  if(body.industryOther!==undefined&&(typeof body.industryOther!=="string"||body.industryOther.length>50||/[\u0000-\u001f]/.test(body.industryOther)))throw Error("Keep your industry within 50 characters.");
  const industryOther=preferences.includes("Other")?((body.industryOther as string|undefined)??"").trim():"";
  if(preferences.includes("Other")&&!industryOther)throw Error("Enter your industry when choosing Other.");
  if(body.painPoints!==undefined&&(typeof body.painPoints!=="string"||body.painPoints.length>200||/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(body.painPoints)))throw Error("Keep pain points within 200 characters.");
  return {name,company,role,city,whatsapp,linkedin:url.href,revenue,preferences,industryOther,areas:chips("areas",helpAreas),consent:true,painPoints:((body.painPoints as string|undefined)??"").trim()};
}
export function matchingProfile(input:ApplicationInput,legacyIndustry=false) {
  return {name:input.name,company:input.company,currentRole:input.role,headline:input.role,location:input.city,whatsappNumber:input.whatsapp,sourceLink:input.linkedin,
    revenueBand:input.revenue==="Prefer not to disclose"?"not found":input.revenue,
    industry:input.preferences[0]==="Other"?input.industryOther!:input.preferences.length?(legacyIndustry?"Pilot preferences: ":"")+input.preferences.join("; "):"not found",
    about:input.areas.length?"Areas I can help with: "+input.areas.join("; "):"not found",companyProblems:input.painPoints?.trim()||"not found"};
}

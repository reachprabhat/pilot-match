import {v} from "convex/values";
export const applicationFields={name:v.string(),company:v.string(),role:v.string(),city:v.string(),whatsapp:v.string(),linkedin:v.string(),revenue:v.string(),preferences:v.array(v.string()),areas:v.array(v.string()),consent:v.boolean(),painPoints:v.optional(v.string()),industryOther:v.optional(v.string())};
export const applicationInput=v.object(applicationFields);

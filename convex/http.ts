import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";

const http=httpRouter();
http.route({path:"/operator/response",method:"POST",handler:httpAction(async(ctx,request)=>{
  const headers={"Content-Type":"application/json","Cache-Control":"no-store"};
  const reply=(body:unknown,status:number)=>new Response(JSON.stringify(body),{status,headers});
  try{
    if(Number(request.headers.get("content-length"))>1024)return reply({error:"Invalid response."},400);
    const text=await request.text();if(text.length>1024)return reply({error:"Invalid response."},400);
    let body;try{body=JSON.parse(text);}catch{return reply({error:"Invalid response."},400);}
    if(typeof body?.code!=="string"||!/^[A-Za-z0-9_-]{43}$/.test(body.code))return reply({error:"Invalid link."},404);
    if(typeof body.requestId!=="string"||body.requestId.length>100||!Number.isFinite(body.requestedAt)||!["Interested","Not relevant"].includes(body.status))return reply({error:"Invalid response."},400);
    const bytes=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(body.code));
    const linkHash=Array.from(new Uint8Array(bytes),b=>b.toString(16).padStart(2,"0")).join("");
    // The validator checks the document ID; ownership is checked in the mutation.
    const result=await ctx.runMutation(internal.operatorResponses.save,{linkHash,requestId:body.requestId,requestedAt:body.requestedAt,status:body.status});
    if("error" in result)return reply({error:result.error==="invalid_link"?"Invalid link.":"This request changed. Reload to see its latest status."},result.error==="invalid_link"?404:409);
    return reply(result,200);
  }catch{return reply({error:"Could not save your response. Try again or reload."},503);}
})});
http.route({path:"/operator/requests",method:"POST",handler:httpAction(async(ctx,request)=>{
  const headers={"Content-Type":"application/json","Cache-Control":"no-store"};
  const reply=(body:unknown,status:number)=>new Response(JSON.stringify(body),{status,headers});
  try{
    if(Number(request.headers.get("content-length"))>2048)return reply({error:"Invalid link."},400);
    const text=await request.text();
    if(text.length>2048)return reply({error:"Invalid link."},400);
    let body;
    try{body=JSON.parse(text);}catch{return reply({error:"Invalid link."},400);}
    if(typeof body?.code!=="string"||!/^[A-Za-z0-9_-]{43}$/.test(body.code))return reply({error:"Invalid link."},404);
    if(body.cursor!==undefined&&body.cursor!==null&&(typeof body.cursor!=="string"||body.cursor.length>1500))return reply({error:"Invalid request."},400);
    const bytes=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(body.code));
    const linkHash=Array.from(new Uint8Array(bytes),b=>b.toString(16).padStart(2,"0")).join("");
    const result=await ctx.runQuery(internal.operatorRequests.list,{linkHash,paginationOpts:{numItems:20,cursor:body.cursor??null}});
    return result?reply(result,200):reply({error:"Invalid link."},404);
  }catch{return reply({error:"Busy right now. Try again in a few minutes."},503);}
})});
http.route({path:"/founder",method:"POST",handler:httpAction(async(ctx,request)=>{
  const headers={"Content-Type":"application/json","Cache-Control":"no-store"};
  const reply=(body:unknown,status:number)=>new Response(JSON.stringify(body),{status,headers});
  if(Number(request.headers.get("content-length"))>1024)return reply({error:"Invalid link."},400);
  const text=await request.text();
  if(text.length>1024)return reply({error:"Invalid link."},400);
  let body;
  try{body=JSON.parse(text);}catch{return reply({error:"Invalid link."},400);}
  try{
    if(typeof body?.code!=="string"||!/^[A-Za-z0-9_-]{43}$/.test(body.code))return reply({error:"Invalid link."},400);
    const bytes=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(body.code));
    const linkHash=Array.from(new Uint8Array(bytes),b=>b.toString(16).padStart(2,"0")).join("");
    const founder=await ctx.runQuery(internal.founders.resolvePersonalLink,{linkHash});
    return founder?reply(founder,200):reply({error:"Invalid link."},404);
  }catch{return reply({error:"Unable to open link."},503);}
})});
export default http;

for(const path of ["/matches","/choice"]){
  http.route({path,method:"POST",handler:httpAction(async(ctx,request)=>{
    const headers={"Content-Type":"application/json","Cache-Control":"no-store"};
    const reply=(body:unknown,status:number)=>new Response(JSON.stringify(body),{status,headers});
    try{
      if(Number(request.headers.get("content-length"))>1024)return reply({error:"Invalid request."},400);
      const text=await request.text();
      if(text.length>1024)return reply({error:"Invalid request."},400);
      let body;
      try{body=JSON.parse(text);}catch{return reply({error:"Invalid request."},400);}
      if(typeof body?.code!=="string"||!/^[A-Za-z0-9_-]{43}$/.test(body.code))return reply({error:"Invalid link."},404);
      const bytes=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(body.code));
      const linkHash=Array.from(new Uint8Array(bytes),b=>b.toString(16).padStart(2,"0")).join("");
      if(path==="/matches"){
        const result=await ctx.runQuery(internal.choices.latest,{linkHash});
        return result?reply(result,200):reply({error:"Invalid link."},404);
      }
      if(typeof body.operatorId!=="string"||body.operatorId.length>100||!["Requested","Parked","Rejected"].includes(body.status))return reply({error:"Invalid choice."},400);
      const result=await ctx.runMutation(internal.choices.save,{linkHash,operatorId:body.operatorId,status:body.status});
      if("error" in result)return reply({error:result.error==="invalid_link"?"Invalid link.":"Reload to choose from your latest matches."},result.error==="invalid_link"?404:409);
      return reply(result,200);
    }catch{return reply({error:"Busy right now. Try again in a few minutes."},503);}
  })});
}

http.route({path:"/search",method:"POST",handler:httpAction(async(ctx,request)=>{
  const headers={"Content-Type":"application/json","Cache-Control":"no-store"};
  const reply=(body:unknown,status:number)=>new Response(JSON.stringify(body),{status,headers});
  try {
    if(Number(request.headers.get("content-length"))>80000)return reply({error:"Keep your ask within 300 words."},400);
    const text=await request.text();
    if(text.length>20000)return reply({error:"Keep your ask within 300 words."},400);
    let body;
    try {body=JSON.parse(text);}catch{return reply({error:"Invalid request."},400);}
    if(typeof body?.code!=="string"||!/^[A-Za-z0-9_-]{43}$/.test(body.code))return reply({error:"Invalid link."},404);
    if(typeof body.ask!=="string"||typeof body.requestId!=="string")return reply({error:"Enter your pilot ask in 300 words or fewer."},400);
    const bytes=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(body.code));
    const linkHash=Array.from(new Uint8Array(bytes),b=>b.toString(16).padStart(2,"0")).join("");
    const result=await ctx.runAction(internal.matching.run,{linkHash,requestId:body.requestId,ask:body.ask});
    if(result.status==="invalid_link")return reply({error:"Invalid link."},404);
    if(result.status==="invalid_ask")return reply({error:"Enter your pilot ask in 300 words or fewer."},400);
    if(result.status==="busy")return reply({error:"Busy right now. Try again in a few minutes."},503);
    return reply(result,result.status==="limit_reached"?429:200);
  }catch{return reply({error:"Busy right now. Try again in a few minutes."},503);}
})});

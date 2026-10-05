import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";

const http=httpRouter();
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

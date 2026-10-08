// Log message strings only: SDK error objects can also contain headers and request bodies.
export function safeWelcomeError(error:unknown,apiKey?:string){
  const messages:string[]=[];
  let current:unknown=error;
  const visited=new Set<unknown>();
  while(current&&!visited.has(current)&&messages.length<8){
    visited.add(current);
    if(typeof current==='string'){messages.push(current);break;}
    if(typeof current!=='object')break;
    const value=current as {message?:unknown;cause?:unknown};
    if(typeof value.message==='string')messages.push(value.message);
    current=value.cause;
  }
  let message=messages.join('\nCaused by: ')||'Unknown error';
  if(apiKey)message=message.split(apiKey).join('[REDACTED API KEY]');
  return message
    .replace(/\bBearer\s+\S+/gi,'Bearer [REDACTED]')
    .replace(/\bsk-[A-Za-z0-9_-]+/g,'[REDACTED API KEY]')
    .replace(/\+?\d[\d \t()./-]{5,}\d/g,value=>value.replace(/\D/g,'').length>=7?'[REDACTED NUMBER]':value);
}

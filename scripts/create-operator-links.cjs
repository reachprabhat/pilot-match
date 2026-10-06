// Raw personal codes are written only to the owner's private data folder.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),{spawnSync}=require('node:child_process');
const root=path.resolve(__dirname,'..');
const production=process.argv.includes('--prod');
const origin=production?'https://first-guanaco-957.convex.site':'https://neat-hyena-46.convex.site';
const folder='C:/Users/reach/OneDrive/Documents/build-sprint-data';
const file=path.join(folder,`Operator Links - ${production?'prod':'dev'}.txt`);
const hash=code=>crypto.createHash('sha256').update(code).digest('hex');
function run(name,args){
  const result=spawnSync(process.execPath,[path.join(root,'node_modules/convex/bin/main.js'),'run',...(production?['--prod']:[]),name,JSON.stringify(args)],{cwd:root,encoding:'utf8'});
  if(result.status!==0)throw new Error(`Convex could not finish ${name}. Private links remain in the data folder; rerun to resume.`);
  return result.stdout.trim()?JSON.parse(result.stdout.trim()):null;
}
try{
  const operators=run('operatorLinks:listForOwner',{});
  const codes=new Map();
  let firstReveal=false;
  if(fs.existsSync(file)){
    const text=fs.readFileSync(file,'utf8');
    for(const match of text.matchAll(/Operator ([^\r\n]+)\r?\n(https:\/\/[^\r\n]+)/g)){
      const url=new URL(match[2]);
      if(url.origin!==origin||url.pathname!=='/operator.html')throw new Error('Private file belongs to another environment.');
      const code=new URLSearchParams(url.hash.slice(1)).get('o');
      if(!/^[A-Za-z0-9_-]{43}$/.test(code??'')||codes.has(match[1]))throw new Error('Private file has an invalid or duplicate link.');
      codes.set(match[1],code);
    }
  }
  for(const operator of operators){
    const code=codes.get(operator.operatorId);
    if(operator.linkHash&&(!code||hash(code)!==operator.linkHash))throw new Error('An existing operator link is missing from the private file. It will not be replaced.');
  }
  const missing=operators.filter(operator=>!codes.has(operator.operatorId));
  if(missing.length){
    for(const operator of missing)codes.set(operator.operatorId,crypto.randomBytes(32).toString('base64url'));
    fs.mkdirSync(folder,{recursive:true});
    const sections=operators.map(operator=>`Operator ${operator.operatorId}\r\n${origin}/operator.html#o=${codes.get(operator.operatorId)}`);
    const text=`Operator personal links - ${production?'production':'development'}\r\nKeep this file private. Founder links are separate.\r\n\r\n${sections.join('\r\n\r\n')}\r\n`;
    // Save recoverable codes before sending their hashes to Convex.
    if(fs.existsSync(file)){
      const append=missing.map(operator=>`\r\nOperator ${operator.operatorId}\r\n${origin}/operator.html#o=${codes.get(operator.operatorId)}\r\n`).join('');
      fs.appendFileSync(file,append);
    }else{fs.writeFileSync(file,text,{flag:'wx'});firstReveal=true;}
  }
  for(const operator of operators){if(!operator.linkHash)run('operatorLinks:setPersonalLink',{operatorId:operator.operatorId,linkHash:hash(codes.get(operator.operatorId))});}
  console.log(JSON.stringify({environment:production?'production':'development',operators:operators.length,newLinks:missing.length,privateFile:file,firstReveal,rawCodesPrinted:false},null,2));
}catch(error){console.error(error.message);process.exitCode=1;}

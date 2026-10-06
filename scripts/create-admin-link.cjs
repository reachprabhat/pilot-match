// Raw admin code is saved only in the owner's private data folder.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),{spawnSync}=require('node:child_process');
const root=path.resolve(__dirname,'..'),production=process.argv.includes('--prod');
const origin=production?'https://first-guanaco-957.convex.site':'https://neat-hyena-46.convex.site';
const folder='C:/Users/reach/OneDrive/Documents/build-sprint-data',file=path.join(folder,`Admin Link - ${production?'prod':'dev'}.txt`);
function run(name,args){const r=spawnSync(process.execPath,[path.join(root,'node_modules/convex/bin/main.js'),'run',...(production?['--prod']:[]),name,JSON.stringify(args)],{cwd:root,encoding:'utf8'});if(r.status!==0)throw Error('Convex could not save the admin link. Rerun to resume; existing links are never replaced.');return r.stdout.trim()?JSON.parse(r.stdout):null;}
try{
 const existing=run('adminLinks:existing',{});let code,created=false;
 if(fs.existsSync(file)){const text=fs.readFileSync(file,'utf8'),match=text.match(/https:\/\/[^\r\n]+/);if(!match)throw Error('Private file has no admin link.');const url=new URL(match[0]);code=new URLSearchParams(url.hash.slice(1)).get('a');if(url.origin!==origin||url.pathname!=='/admin.html'||!/^[A-Za-z0-9_-]{43}$/.test(code??''))throw Error('Private file is invalid or belongs to another environment.');}
 else{if(existing)throw Error('Existing admin code is missing from the private folder. It will not be replaced.');code=crypto.randomBytes(32).toString('base64url');fs.mkdirSync(folder,{recursive:true});fs.writeFileSync(file,`Private admin link - ${production?'production':'development'}\r\nKeep this file private.\r\n\r\n${origin}/admin.html#a=${code}\r\n`,{flag:'wx'});created=true;}
 const linkHash=crypto.createHash('sha256').update(code).digest('hex');if(existing&&existing!==linkHash)throw Error('Private file does not match the stored admin link.');
 if(!existing)run('adminLinks:setPersonalLink',{linkHash});
 console.log(JSON.stringify({environment:production?'production':'development',privateFile:file,created,rawCodePrinted:false},null,2));
}catch(error){console.error(error.message);process.exitCode=1;}

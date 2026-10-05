const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');const vm=require('node:vm');
const root=path.resolve(__dirname,'..');const source=fs.readFileSync(path.join(__dirname,'build.cjs'),'utf8');
const files=new Map([['index.html','<link href="/styles.css"><script src="/app.js"></script>'],['styles.css','body {color:black}'],['app.js','const version=1;'],['fonts/inter-regular.ttf','font'],['fonts/inter-semibold.ttf','font'],['fonts/LICENSE.txt','license']].map(([p,v])=>[path.join(root,p),v]));
const fakeFs={mkdirSync:()=>{},readFileSync:(p,encoding)=>encoding?files.get(p):Buffer.from(files.get(p)),writeFileSync:(p,v)=>files.set(p,v),copyFileSync:(a,b)=>files.set(b,files.get(a))};
function build(){vm.runInNewContext(source,{__dirname,require:n=>n==='node:fs'?fakeFs:require(n),console:{log:()=>{}}});return files.get(path.join(root,'dist/index.html'));}
const before=build();assert.match(before,/app.js\?v=[a-f0-9]{12}/);const css=before.match(/styles.css[^"]+/)[0];files.set(path.join(root,'app.js'),'const version=2;');const after=build();assert.notEqual(after,before);assert.equal(after.match(/styles.css[^"]+/)[0],css);assert.equal(build(),after);
console.log('Build cache check passed: changed scripts get a fresh URL, unchanged styles keep their URL.');

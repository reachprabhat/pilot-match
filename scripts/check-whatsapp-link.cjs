const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
// Run the actual card renderer against minimal elements, not a copied URL builder.
const source=fs.readFileSync('connections.js','utf8'),start=source.indexOf('  function details('),end=source.indexOf('  async function recordSeen');
const document={createElement:tag=>({tag,dataset:{},children:[],append(...nodes){this.children.push(...nodes);}})};
const sandbox={document};vm.createContext(sandbox);vm.runInContext(source.slice(start,end),sandbox);
const render=(name,whatsappNumber)=>sandbox.details({requestId:'fictional',welcome:'Example welcome.',name,whatsappNumber});
const link=(name,number)=>render(name,number).children.find(n=>n.tag==='a');
const expected=(number,name)=>'https://wa.me/'+number+'?text='+encodeURIComponent('Hi '+name+', we were introduced through Pilot Match. Would love to set up a quick call.');
assert.equal(link('  Nikhil Example  ','(999) 555-0102').href,expected('919995550102','Nikhil'));
assert.equal(link('Aruna Example','+91 99955 50101').href,expected('919995550101','Aruna'));
assert.equal(link('Alex Example','+1 (999) 555-0101').href,expected('19995550101','Alex'));
assert.equal(link('Zoë Example','+91-99955-50101').href,expected('919995550101','Zoë'));
assert.equal(new URL(link("O'Neil Example",'+91 99955 50101').href).searchParams.get('text'),"Hi O'Neil, we were introduced through Pilot Match. Would love to set up a quick call.");
assert.equal(link('  ','+91 99955 50101').href,expected('919995550101','there'));
assert.equal(link('Example','not found'),undefined);
for(const [name,number]of [['Nikhil Example','9995550102'],['Aruna Example','+91 99955 50101']]){const a=link(name,number);assert.equal(a.target,'_blank');assert.equal(a.rel,'noopener noreferrer');assert.equal(a.referrerPolicy,'no-referrer');}
console.log('PASS: saved numbers cleaned, 10 digits prefixed with 91, existing country codes preserved, first names/Unicode encoded, exact message, new tab, and missing number behavior.');

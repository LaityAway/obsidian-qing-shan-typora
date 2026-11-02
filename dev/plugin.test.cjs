const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
function element() {
  const values = new Map(), classes = new Set();
  return { values, classes, classList: { toggle(k, v) { v ? classes.add(k) : classes.delete(k); }, remove(k) { classes.delete(k); }, contains(k) { return classes.has(k); } }, style: { setProperty(k,v) { values.set(k,v); }, removeProperty(k) { values.delete(k); }, getPropertyValue(k) { return values.get(k) ?? ''; } } };
}
function setup(data) {
  const docs = [{ body: element() }, { body: element() }];
  const events = new Map(), notices = [], noticeObjects = [];
  class Plugin {
    async loadData() { return data; }
    async saveData(value) { this.saved = JSON.parse(JSON.stringify(value)); }
    registerEvent(ref) { (this.refs ??= []).push(ref); }
    registerEditorExtension(extension) { this.editorExtension = extension; }
    registerMarkdownPostProcessor(processor) { this.markdownProcessor = processor; }
    addSettingTab(tab) { this.tab = tab; }
    addCommand(command) { (this.commands ??= []).push(command); }
  }
  class PluginSettingTab { constructor(app, plugin) { this.app=app; } }
  const exports = { exports: {} };
  const context = { module: exports, exports: exports.exports, document: docs[0], console, setTimeout, clearTimeout, require(name) { if(name==='@codemirror/view') return {ViewPlugin:{fromClass: cls=>cls},Decoration:{}}; if(name==='@codemirror/language') return {syntaxTree(){}}; assert.equal(name,'obsidian'); return { Plugin, PluginSettingTab, Setting: class {}, Notice: class { constructor(text) { notices.push(text); this.hidden=false; noticeObjects.push(this); } hide(){this.hidden=true;} } }; } };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../main.js'),'utf8'),context);
  const instance = new exports.exports();
  instance.app = { workspace: { iterateAllLeaves(cb) { docs.forEach(doc=>cb({ view: { containerEl: { ownerDocument: doc } } })); }, on(name,cb) { events.set(name,cb); return name; } } };
  return { instance, docs, events, notices, noticeObjects };
}
test('new installation uses the agreed defaults and styles all windows',async()=>{
  const {instance:p,docs}=setup(null); await p.onload();
  assert.deepEqual(JSON.parse(JSON.stringify(p.settings)),{enabled:true,fontSize:16,widthMode:'typora',contentWidth:800,lineHeight:1.6,paragraphIndent:false,whiteShell:true,hideInlineTitle:true,highContrast:false,codeFont:'typora'});
  for(const doc of docs) { assert.ok(doc.body.classes.has('qs-typora-enabled')); assert.equal(doc.body.values.get('--qs-typora-width'),'800px'); }
  assert.equal(p.commands.length,1); assert.equal(p.tab.plugin,p);
});
test('invalid persisted settings cannot inject CSS or enable unexpected values',async()=>{
  const {instance:p}=setup({enabled:'false',fontSize:'16px; color:red',contentWidth:99999,lineHeight:NaN,extra:'ignored'}); await p.onload();
  assert.deepEqual(JSON.parse(JSON.stringify(p.settings)),{enabled:true,fontSize:16,widthMode:'typora',contentWidth:1200,lineHeight:1.6,paragraphIndent:false,whiteShell:true,hideInlineTitle:true,highContrast:false,codeFont:'typora'});
});
test('null and non-object data safely use defaults',async()=>{
  for (const value of [null,5,'oops',[]]) { const {instance:p}=setup(value); await p.onload(); assert.equal(p.settings.fontSize,16); }
});
test('toggle persists and removes styling without touching application settings',async()=>{
  const {instance:p,docs}=setup(); await p.onload(); await p.commands[0].callback();
  assert.equal(p.saved.enabled,false); for (const doc of docs) assert.equal(doc.body.classes.size,0);
  await p.updateSettings({fontSize:20,contentWidth:640,lineHeight:2});
  await p.commands[0].callback(); assert.equal(p.saved.enabled,true);
  assert.equal(docs[1].body.values.get('--qs-typora-font-size'),'20px');
});
test('new windows inherit settings; unload removes every owned property and class',async()=>{
  const {instance:p,docs,events}=setup(); await p.onload();
  const doc={body:element()}; events.get('window-open')({doc});
  assert.ok(doc.body.classes.has('qs-typora-enabled'));
  p.onunload(); for(const d of [...docs,doc]) { assert.equal(d.body.classes.size,0); assert.equal(d.body.values.size,0); }
});
test('detached window with null defaultView is automatically pruned from documents',async()=>{
  const {instance:p}=setup(); await p.onload();
  const doc={body:element(),defaultView:null};
  p.documents.add(doc);
  p.applyDocument(doc);
  assert.equal(p.documents.has(doc),false);
});
test('closed window is pruned even if its close event was missed',async()=>{
  const {instance:p}=setup(); await p.onload();
  const doc={body:element(),defaultView:{closed:true}};
  p.documents.add(doc);
  p.applySettings();
  assert.equal(p.documents.has(doc),false);
  assert.equal(doc.body.classes.size,0);
});
test('window-close event removes its document and plugin styles',async()=>{
  const {instance:p,events}=setup(); await p.onload();
  const doc={body:element(),defaultView:{closed:false}};
  events.get('window-open')({doc});
  assert.equal(p.documents.has(doc),true);
  events.get('window-close')({doc});
  assert.equal(p.documents.has(doc),false);
  assert.equal(doc.body.classes.size,0);
});
test('css-change event re-applies settings and synchronizes monospace font',async()=>{
  const {instance:p,docs,events}=setup();
  let mono = 'Source Code Pro';
  docs[0].defaultView = {
    getComputedStyle: () => ({ getPropertyValue: k => (k === '--font-monospace' ? mono : '') }),
  };
  await p.onload();
  assert.equal(docs[0].body.values.get('--qs-typora-system-mono'), 'Source Code Pro');
  mono = 'Fira Code';
  events.get('css-change')();
  assert.equal(docs[0].body.values.get('--qs-typora-system-mono'), 'Fira Code');
  mono = '';
  events.get('css-change')();
  assert.equal(docs[0].body.values.has('--qs-typora-system-mono'), false);
});
test('reset defaults restores all parameters and enables styling',async()=>{
  const {instance:p}=setup({enabled:false,fontSize:22,contentWidth:480,lineHeight:2.2}); await p.onload(); await p.resetSettings();
  assert.deepEqual(p.saved,{enabled:true,fontSize:16,widthMode:'typora',contentWidth:800,lineHeight:1.6,paragraphIndent:false,whiteShell:true,hideInlineTitle:true,highContrast:false,codeFont:'typora'});
});
test('queued writes preserve the final user choice',async()=>{
  const {instance:p}=setup(); await p.onload(); const snapshots=[];
  p.saveData=async value=>{await new Promise(r=>setTimeout(r,3)); snapshots.push(value.fontSize);};
  await Promise.all([p.updateSettings({fontSize:18}),p.updateSettings({fontSize:20}),p.updateSettings({fontSize:22})]);
  assert.deepEqual(snapshots,[18,20,22]);
});
test('save failure is reported and a subsequent change still saves',async()=>{
  const {instance:p,notices}=setup(); await p.onload(); let fails=true;
  p.saveData=async value=>{if(fails)throw new Error('disk unavailable');p.saved=value;};
  await p.updateSettings({fontSize:18}); assert.ok(notices.some(n=>n.includes('保存失败')));
  fails=false; await p.updateSettings({fontSize:20}); assert.equal(p.saved.fontSize,20);
});
test('legacy fullWidth migrates to an explicit width mode',async()=>{
  const wide=setup({fullWidth:true});await wide.instance.onload();
  assert.equal(wide.instance.settings.widthMode,'full');
  assert.ok(wide.docs[0].body.classes.has('qs-typora-width-full'));
  const narrow=setup({fullWidth:false});await narrow.instance.onload();
  assert.equal(narrow.instance.settings.widthMode,'fixed');
  assert.ok(narrow.docs[0].body.classes.has('qs-typora-width-fixed'));
  const invalid=setup({widthMode:'huge'});await invalid.instance.onload();
  assert.equal(invalid.instance.settings.widthMode,'typora');
});
test('layout switches retain defaults and accept explicit opt-outs',async()=>{
  const {instance:p,docs}=setup({widthMode:'fixed',whiteShell:false,hideInlineTitle:true});await p.onload();
  assert.equal(p.settings.widthMode,'fixed');assert.equal(p.settings.whiteShell,false);
  assert.ok(docs[0].body.classes.has('qs-typora-hide-title'));
  assert.ok(docs[0].body.classes.has('qs-typora-width-fixed'));
  assert.ok(!docs[0].body.classes.has('qs-typora-white-shell'));
  await p.updateSettings({widthMode:'full',whiteShell:true,hideInlineTitle:false});
  assert.ok(docs[0].body.classes.has('qs-typora-width-full'));
  assert.ok(!docs[0].body.classes.has('qs-typora-width-fixed'));
  assert.ok(docs[0].body.classes.has('qs-typora-white-shell'));
  assert.ok(!docs[0].body.classes.has('qs-typora-hide-title'));
  p.onunload();assert.equal(docs[0].body.classes.size,0);
});
test('reapplies styles when another script strips the body classes',async()=>{
  const {instance:p,docs,events}=setup();await p.onload();
  docs[0].body.classes.delete('qs-typora-enabled');
  events.get('layout-change')();
  assert.ok(docs[0].body.classes.has('qs-typora-enabled'));
});
test('reapplies styles when an unexpected class is present',async()=>{
  const {instance:p,docs,events}=setup({whiteShell:false});await p.onload();
  docs[0].body.classes.add('qs-typora-white-shell');
  events.get('layout-change')();
  assert.ok(!docs[0].body.classes.has('qs-typora-white-shell'));
});
test('contrast, code-font and paragraph-indent toggles map to body classes',async()=>{
  const {instance:p,docs}=setup({highContrast:true,codeFont:'system',paragraphIndent:true});await p.onload();
  assert.ok(docs[0].body.classes.has('qs-typora-contrast'));
  assert.ok(docs[0].body.classes.has('qs-typora-code-system'));
  assert.ok(docs[0].body.classes.has('qs-typora-indent'));
  await p.updateSettings({highContrast:false,codeFont:'typora',paragraphIndent:false});
  assert.ok(!docs[0].body.classes.has('qs-typora-contrast'));
  assert.ok(!docs[0].body.classes.has('qs-typora-code-system'));
  assert.ok(!docs[0].body.classes.has('qs-typora-indent'));
});
test('unchanged settings do not write to disk',async()=>{
  const {instance:p}=setup();await p.onload();let saves=0;p.saveData=async()=>saves++;
  await p.updateSettings({fontSize:16});assert.equal(saves,0);
});
test('each document is only styled once per effective settings change',async()=>{
 const {instance:p,docs,events}=setup();await p.onload();let writes=0;
 for(const doc of docs){const original=doc.body.style.setProperty;doc.body.style.setProperty=(...args)=>{writes++;original(...args);};}
 events.get('layout-change')();assert.equal(writes,0);
 await p.updateSettings({fontSize:18});assert.equal(writes,6);
});
test('a failed save can be retried with exactly the same settings',async()=>{
 const {instance:p}=setup();await p.onload();let attempts=0;
 p.saveData=async()=>{if(++attempts===1)throw Error('temporary failure');};
 await p.updateSettings({fontSize:19});await p.updateSettings({fontSize:19});
 assert.equal(attempts,2);assert.equal(p.saveFailed,false);
});

test('failed load never overwrites unread settings during updates or reset',async()=>{
 const {instance:p,notices}=setup();p.loadData=async()=>{throw Error('temporary read error')};await p.onload();
 let saves=0;p.saveData=async()=>{saves++};
 await p.updateSettings({fontSize:20});await p.resetSettings();
 assert.equal(saves,0);assert.ok(notices.some(n=>n.includes('不会保存')));
});
test('media postprocessor distinguishes text, pending media and embedded notes',async()=>{
 const {instance:p}=setup();await p.onload();
 const paragraph=nodes=>{const classes=new Set();return {childNodes:nodes,classes,classList:{toggle(k,on){on?classes.add(k):classes.delete(k)}}}};
 const text=value=>({nodeType:3,textContent:value});
 const element=(selector,src='')=>({nodeType:1,matches(query){return query.split(', ').includes(selector)},getAttribute(){return src}});
 const media=element('.internal-embed[src]','picture.png');
 const mixed=paragraph([text('before '),media,text(' after')]);
 const standalone=paragraph([text(' '),media,text(' ')]);
 const note=paragraph([element('.internal-embed[src]','note.md')]);
 const root={matches:()=>false,querySelectorAll:()=>[mixed,standalone,note]};
 p.markdownProcessor(root);
 assert.equal(mixed.classes.has('qs-typora-media-only'),false);
 assert.equal(standalone.classes.has('qs-typora-media-only'),true);
 assert.equal(note.classes.has('qs-typora-media-only'),false);
 standalone.childNodes.push(text('caption'));p.markdownProcessor(root);
 assert.equal(standalone.classes.has('qs-typora-media-only'),false);
});
test('a read failure notice is dismissed on unload',async()=>{
 const {instance:p,noticeObjects}=setup();p.loadData=async()=>{throw Error('temporary read error')};await p.onload();
 assert.equal(noticeObjects.length,1);assert.equal(noticeObjects[0].hidden,false);
 p.onunload();assert.equal(noticeObjects[0].hidden,true);
});
test('unloading while a failing read is pending does not show an orphan notice',async()=>{
 const {instance:p,noticeObjects}=setup();let fail;
 p.loadData=()=>new Promise((resolve,reject)=>{fail=reject});
 const loading=p.onload();await new Promise(r=>setImmediate(r));p.onunload();fail(Error('read error'));await loading;
 assert.equal(noticeObjects.length,0);
});
test('reload after a failed load restores persisted settings and permits saving',async()=>{
 const {instance:old}=setup();old.loadData=async()=>{throw Error('temporary read error')};await old.onload();
 await old.updateSettings({fontSize:20});old.onunload();
 const {instance:fresh}=setup();fresh.app=old.app;fresh.loadData=async()=>({fontSize:18,whiteShell:false});await fresh.onload();
 assert.equal(fresh.settings.fontSize,18);assert.equal(fresh.settings.whiteShell,false);
 await fresh.updateSettings({lineHeight:1.8});assert.equal(fresh.saved.fontSize,18);assert.equal(fresh.saved.lineHeight,1.8);
});
test('reload waits for old writes before loading settings',async()=>{
 const {instance:old}=setup();await old.onload();let release;let disk={fontSize:16};
 old.saveData=async value=>{await new Promise(r=>release=r);disk=value};
 const saving=old.updateSettings({fontSize:18});await new Promise(r=>setImmediate(r));old.onunload();
 const {instance:fresh}=setup();fresh.app=old.app;fresh.loadData=async()=>disk;
 fresh.saveData=async value=>{disk=value};let loaded=false;const loading=fresh.onload().then(()=>loaded=true);
 await new Promise(r=>setImmediate(r));const loadedEarly=loaded;release();await saving;await loading;
 await fresh.updateSettings({fontSize:22});assert.equal(loadedEarly,false);assert.equal(disk.fontSize,22);
 await old.updateSettings({fontSize:20});assert.equal(disk.fontSize,22);
});
test('reapplies CSS variables when an external script removes or tampers them',async()=>{
 const {instance:p,docs,events}=setup({fontSize:18,contentWidth:840,lineHeight:1.8});await p.onload();
 assert.equal(docs[0].body.values.get('--qs-typora-width'),'840px');
 docs[0].body.values.delete('--qs-typora-width');
 docs[0].body.values.set('--qs-typora-line-height','1.2');
 events.get('layout-change')();
 assert.equal(docs[0].body.values.get('--qs-typora-width'),'840px');
 assert.equal(docs[0].body.values.get('--qs-typora-line-height'),'1.8');
});

test('slider updates apply immediately and coalesce writes to the final value',async()=>{
 const {instance:p,docs}=setup();await p.onload();const saves=[];
 p.saveData=async value=>{saves.push(value.fontSize)};
 const first=p.updateSettings({fontSize:18},{deferSave:true});
 const last=p.updateSettings({fontSize:20},{deferSave:true});
 assert.equal(docs[0].body.values.get('--qs-typora-font-size'),'20px');
 assert.deepEqual(saves,[]);
 await Promise.all([first,last]);
 assert.deepEqual(saves,[20]);
});
test('unload flushes a pending slider save before a reload reads settings',async()=>{
 const {instance:old}=setup();await old.onload();let disk={fontSize:16};
 old.saveData=async value=>{disk=value};
 const saving=old.updateSettings({fontSize:19},{deferSave:true});old.onunload();
 const {instance:fresh}=setup();fresh.app=old.app;fresh.loadData=async()=>disk;
 await fresh.onload();await saving;
 assert.equal(fresh.settings.fontSize,19);
});
test('normal setting writes flush pending slider values in order',async()=>{
 const {instance:p}=setup();await p.onload();let saves=[];
 p.saveData=async value=>saves.push([value.fontSize,value.enabled]);
 const pending=p.updateSettings({fontSize:18},{deferSave:true});
 const next=p.updateSettings({enabled:false});
 await Promise.all([pending,next]);
 assert.deepEqual(saves,[[18,true],[18,false]]);
});
test('failed deferred slider save can retry the same value',async()=>{
 const {instance:p,notices}=setup();await p.onload();let attempts=0;
 p.saveData=async()=>{if(++attempts===1)throw Error('disk unavailable')};
 const first=p.updateSettings({fontSize:18},{deferSave:true});p.flushPendingSave();await first;
 assert.equal(p.saveFailed,true);assert.ok(notices.some(n=>n.includes('保存失败')));
 const retry=p.updateSettings({fontSize:18},{deferSave:true});p.flushPendingSave();await retry;
 assert.equal(attempts,2);assert.equal(p.saveFailed,false);
});

test('malformed long media syntax returns promptly without blocking the editor',()=>{
 const {spawnSync}=require('node:child_process');
 const script=`const fs=require('node:fs'),vm=require('node:vm');
 const module={exports:{}};
 const context={module,exports:module.exports,require(name){
  if(name==='obsidian')return {Plugin:class{},PluginSettingTab:class{},Setting:class{},Notice:class{}};
  if(name==='@codemirror/view')return {ViewPlugin:{fromClass:cls=>cls},Decoration:{}};
  if(name==='@codemirror/language')return {};
  throw Error(name);
 }};
 vm.runInNewContext(fs.readFileSync(process.argv[1],'utf8')+';globalThis.check=standaloneMediaLine',context);
 if(context.check('![x]('+('"a"'.repeat(5000))+'(')!==false)process.exit(2);
 if(context.check('![x](<'+('('.repeat(50000)))!==false)process.exit(3);`;
 const result=spawnSync(process.execPath,['-e',script,path.join(__dirname,'../main.js')],{timeout:2000,encoding:'utf8'});
 assert.equal(result.error?.code,undefined,result.error?.message);
 assert.equal(result.status,0,result.stderr);
});

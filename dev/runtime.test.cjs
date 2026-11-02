'use strict';
// Only disposable fixtures. Verify the exact vault and code hashes before touching notes.
const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || '/Users/laity/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const VAULT = '/tmp/qs-audit-20261101/vault';
const ENDPOINT = 'http://127.0.0.1:19352';
const PLUGIN = 'qing-shan-typora';
const root = path.join(__dirname, '..');
const digest = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');

const fixtures = {
 '验收布局.md': '# 虚构标题\n\n## 可折叠章节\n\n正文 needle needle\n\n### 三级\n\n#### 四级\n\n##### 五级\n\n###### 六级\n\n> 一级引用\n>> 二级引用\n>>> 三级引用\n\n---\n\nH<sub>2</sub>O 和 X<sup>2</sup>\n\n[[验收浮窗]]\n\n末段\n',
 '验收长行.md': '# 长行\n\n```js\n' + 'x'.repeat(1000) + '\n```\n\nhttps://example.invalid/' + 'a'.repeat(1000) + '\n\n末段\n',
 '验收表格.md': '# 表格\n\n| A | B | C |\n| --- | --- | --- |\n| A1 | B1 | C1 |\n| A2 | B2 | C2 |\n\n末段\n',
 '验收宽表.md': '# 宽表\n\n|'+Array.from({length:40},(_,i)=>'Col'+i).join('|')+'|\n|'+Array(40).fill('---').join('|')+'|\n|'+Array(40).fill('虚构单元格').join('|')+'|\n\n末段\n',
 '验收浮窗.md': '# 浮窗标题\n\n虚构正文\n\n```js\nconst value = 1;\n```\n',
 '验收打印.md': '# 打印测试\n\n<kbd>Cmd</kbd> + <kbd>P</kbd>\n\n<details open>\n<summary>虚构摘要</summary>\n内容\n</details>\n\n```js\nconst value = "PRINT_TOKEN";\n```\n\n```mermaid\nflowchart LR\n A[开始] --> B[完成]\n```\n\n$$\nx=1\n$$\n\n末段\n',
};

test('isolated Obsidian runtime acceptance', { timeout: 180000 }, async t => {
 let browser;
 try { browser = await chromium.connectOverCDP(ENDPOINT); }
 catch (error) {
  if (String(error).includes('ECONNREFUSED') && process.env.QS_REQUIRE_RUNTIME !== '1') {
   t.skip('Start the isolated vault on port 19352; QS_REQUIRE_RUNTIME=1 makes missing runtime fail.');return;
  }
  throw error;
 }
 let page;
 try {
  page=browser.contexts().flatMap(c=>c.pages()).find(p=>p.url().startsWith('app://obsidian.md/'));
  assert.ok(page);
  assert.equal(await page.evaluate(()=>app.vault.adapter.basePath),VAULT,'Refuse any other vault');
  for(const file of ['main.js','styles.css','manifest.json']) {
   assert.equal(digest(path.join(VAULT,'.obsidian/plugins',PLUGIN,file)),digest(path.join(root,file)),`Test copy differs: ${file}`);
  }
  await page.evaluate(async fixtures=>{
   await app.workspace.getLeaf(false).setViewState({type:'empty'});
   for(const [name,text] of Object.entries(fixtures)){
    const f=app.vault.getAbstractFileByPath(name);
    if(f)await app.vault.modify(f,text);else await app.vault.create(name,text);
   }
   await app.plugins.setEnable(true);
   await app.plugins.disablePlugin('qing-shan-typora');await app.plugins.enablePlugin('qing-shan-typora');
   await app.plugins.plugins['qing-shan-typora'].resetSettings();
   app.workspace.leftSplit.collapse();app.workspace.rightSplit.collapse();
  },fixtures);
  const open=async(file,mode='live')=>{
   await page.evaluate(async({file,mode})=>{
    await app.workspace.getLeaf(false).setViewState({type:'markdown',state:{file,mode:mode==='preview'?'preview':'source',source:mode==='source'}});
   },{file,mode});
   await page.waitForFunction(mode=>mode==='preview'?!!document.querySelector('.markdown-reading-view .markdown-preview-view'):!!document.querySelector(mode==='source'?'.markdown-source-view.mod-cm6:not(.is-live-preview) .cm-content':'.is-live-preview .cm-content'),mode);
   await page.waitForTimeout(100);
  };
  const settings=patch=>page.evaluate(patch=>app.plugins.plugins['qing-shan-typora'].updateSettings(patch),patch);
  const viewport=async(width,height=1000)=>{await page.setViewportSize({width,height});await page.waitForFunction(width=>innerWidth===width,width);};

  await t.test('line numbers honor host setting and stay next to centered content',async()=>{
   for(const width of [600,1440,1900]){
    await viewport(width);
    await page.evaluate(()=>app.vault.setConfig('showLineNumber',true));
    await open('验收布局.md','source');await open('验收布局.md');
    for(const widthMode of ['typora','fixed','full']){
     await settings({widthMode,contentWidth:800});
     const result=await page.locator('.is-live-preview .cm-scroller').evaluate(sc=>{
      const g=sc.querySelector('.cm-gutters'),s=sc.querySelector('.cm-sizer'),gr=g.getBoundingClientRect(),sr=s.getBoundingClientRect(),cr=sc.getBoundingClientRect();
      return {display:getComputedStyle(g).display,gap:sc.querySelector('.cm-content').getBoundingClientRect().left-gr.right,center:(sr.left+sr.right)/2,scCenter:(cr.left+cr.right)/2,width:sr.width,inside:gr.left>=cr.left-1&&sr.right<=cr.right+1};
     });
     assert.notEqual(result.display,'none');assert.ok(result.inside,JSON.stringify(result));
     assert.ok(result.gap>=0&&result.gap<=40,JSON.stringify(result));
     assert.ok(Math.abs(result.center-result.scCenter)<12,JSON.stringify(result));
    }
   }
   await page.evaluate(()=>app.vault.setConfig('showLineNumber',false));
   await open('验收布局.md','source');await open('验收布局.md');
   assert.equal(await page.locator('.is-live-preview .cm-lineNumbers').count(),0);
   await viewport(1440);await settings({widthMode:'typora'});
  });

  await t.test('reading and live widths retain fixed and full modes',async()=>{
   await viewport(1440);
   for(const mode of ['preview','live']){
    await open('验收布局.md',mode);
    for(const width of [480,800,1000]){
     await settings({widthMode:'fixed',contentWidth:width});
     const actual=await page.locator(mode==='preview'?'.markdown-reading-view .markdown-preview-sizer':'.is-live-preview .cm-scroller > .cm-sizer').first().evaluate(e=>e.getBoundingClientRect().width);
     assert.ok(Math.abs(actual-width)<2,`${mode}: ${actual} != ${width}`);
    }
    await settings({widthMode:'full'});
    const actual=await page.locator(mode==='preview'?'.markdown-reading-view .markdown-preview-sizer':'.is-live-preview .cm-scroller > .cm-sizer').first().evaluate(e=>e.getBoundingClientRect().width);
    assert.ok(actual>1000);
   }
   await settings({widthMode:'typora'});
  });

  await t.test('true source mode remains editable and keeps host line numbers',async()=>{
   await page.evaluate(()=>app.vault.setConfig('showLineNumber',true));await open('验收布局.md','source');
   assert.equal(await page.locator('.markdown-source-view.is-live-preview').count(),0);
   assert.notEqual(await page.locator('.cm-gutters').first().evaluate(e=>getComputedStyle(e).display),'none');
   const result=await page.evaluate(()=>{const e=app.workspace.activeLeaf.view.editor,old=e.getValue();e.replaceRange('测试', {line:2,ch:0});const inserted=e.getLine(2).startsWith('测试');e.setValue(old);return inserted});
   assert.ok(result);
   await page.evaluate(()=>app.vault.setConfig('showLineNumber',false));await open('验收布局.md');
  });

  await t.test('heading fold is clickable without forced events',async()=>{
   await open('验收布局.md');
   const button=page.locator('.HyperMD-header-2 .cm-fold-indicator .collapse-indicator');
   await button.scrollIntoViewIfNeeded();await button.hover();await button.click();
   await page.waitForFunction(()=>!!document.querySelector('.HyperMD-header-2 .cm-fold-indicator.is-collapsed'));
   await button.click();await page.waitForFunction(()=>!document.querySelector('.HyperMD-header-2 .cm-fold-indicator.is-collapsed'));
  });

  await t.test('long code and URL caret positions stay visible in narrow and wide panes',async()=>{
   for(const width of [600,1440]){
    await viewport(width);await open('验收长行.md');
    for(const line of [3,6]){
     await page.evaluate(line=>{const e=app.workspace.activeLeaf.view.editor,ch=e.getLine(line).length;e.setCursor({line,ch});e.focus();e.scrollIntoView({from:{line,ch},to:{line,ch}},true)},line);
     await page.waitForTimeout(120);
     const r=await page.evaluate(()=>{const v=app.workspace.activeLeaf.view.editor.cm,c=v.coordsAtPos(v.state.selection.main.head),s=v.scrollDOM.getBoundingClientRect();return {cursor:c,scroll:{left:s.left,right:s.right,top:s.top,bottom:s.bottom}}});
     assert.ok(r.cursor);assert.ok(r.cursor.left>=r.scroll.left-1&&r.cursor.right<=r.scroll.right+1,JSON.stringify(r));
     assert.ok(r.cursor.top>=r.scroll.top-1&&r.cursor.bottom<=r.scroll.bottom+1,JSON.stringify(r));
    }
   }
   await viewport(1440);
  });

  await t.test('wide table scroll remains usable',async()=>{
   await open('验收宽表.md');await settings({widthMode:'fixed',contentWidth:480});
   const wrapper=page.locator('.cm-table-widget .table-wrapper').first();await wrapper.scrollIntoViewIfNeeded();
   const r=await wrapper.evaluate(e=>{e.scrollLeft=120;return {x:e.scrollLeft,overflow:getComputedStyle(e).overflowX,sw:e.scrollWidth,cw:e.clientWidth}});
   assert.equal(r.overflow,'auto');assert.ok(r.sw>r.cw);assert.ok(r.x>0);
   await settings({widthMode:'typora'});
  });

  await t.test('column drag moves corresponding data without losing cells',async()=>{
   await open('验收表格.md');
   const th=page.locator('.cm-table-widget:visible th');await th.first().hover();
   const h=await th.first().locator('.table-col-drag-handle').boundingBox(),d=await th.nth(1).boundingBox();
   await page.mouse.move(h.x+h.width/2,h.y+h.height/2);await page.mouse.down();await page.mouse.move(d.x+d.width*.8,d.y+d.height/2,{steps:20});await page.mouse.up();
   await page.waitForTimeout(250);
   const rows=await page.evaluate(()=>app.workspace.activeLeaf.view.editor.getValue().split('\n').filter(l=>l.startsWith('|')).map(l=>l.split('|').slice(1,-1).map(x=>x.trim())));
   assert.deepEqual(rows[0],['B','A','C']);assert.deepEqual(rows[2],['B1','A1','C1']);assert.deepEqual(rows[3],['B2','A2','C2']);
  });

  await t.test('slider coalesces while disabled cleanup and re-enable preserve settings',async()=>{
   const r=await page.evaluate(async()=>{
    const p=app.plugins.plugins['qing-shan-typora'],original=p.saveData.bind(p),saved=[];
    p.saveData=async x=>{saved.push(x.fontSize);return original(x)};
    try{const a=p.updateSettings({fontSize:18},{deferSave:true}),b=p.updateSettings({fontSize:20},{deferSave:true});const immediate=getComputedStyle(document.querySelector('.is-live-preview')).fontSize;await Promise.all([a,b]);return {immediate,saved}}finally{p.saveData=original}
   });
   assert.equal(r.immediate,'20px');assert.deepEqual(r.saved,[20]);await settings({enabled:false});
   assert.equal(await page.evaluate(()=>[...document.body.classList].some(x=>x.startsWith('qs-typora-'))),false);
   await settings({enabled:true});await page.evaluate(()=>app.plugins.plugins['qing-shan-typora'].resetSettings());
  });
  await t.test('row drag preserves every cell',async()=>{
   await page.evaluate(async text=>app.vault.modify(app.vault.getAbstractFileByPath('验收表格.md'),text),fixtures['验收表格.md']);await open('验收表格.md');
   const rows=page.locator('.cm-table-widget:visible tbody tr');await rows.first().hover();
   const h=await rows.first().locator('.table-row-drag-handle').first().boundingBox(),d=await rows.nth(1).boundingBox();
   await page.mouse.move(h.x+h.width/2,h.y+h.height/2);await page.mouse.down();await page.mouse.move(d.x+d.width/2,d.y+d.height*.9,{steps:20});await page.mouse.up();await page.waitForTimeout(250);
   const data=await page.evaluate(()=>app.workspace.activeLeaf.view.editor.getValue().split('\n').filter(l=>l.startsWith('|')).map(l=>l.split('|').slice(1,-1).map(x=>x.trim())));
   assert.deepEqual(data[0],['A','B','C']);assert.deepEqual(data[2],['A2','B2','C2']);assert.deepEqual(data[3],['A1','B1','C1']);
  });

  await t.test('H1-H6 heading spans keep the same line height as their line',async()=>{
   await open('验收布局.md');
   for(const level of [1,2,3,4,5,6]){
    const line=page.locator('.is-live-preview .HyperMD-header-'+level).first();await line.scrollIntoViewIfNeeded();
    const r=await line.evaluate(e=>[getComputedStyle(e).lineHeight,...[...e.querySelectorAll('.cm-header')].map(s=>getComputedStyle(s).lineHeight)]);
    assert.ok(r.length>1);assert.ok(r.every(v=>v===r[0]),`H${level}: ${r}`);
   }
  });

  await t.test('hover preview receives light and dark typography without changing popover width',async()=>{
   await open('验收布局.md','preview');
   for(const dark of [false,true]){
    await page.evaluate(dark=>{document.body.classList.toggle('theme-dark',dark);document.body.classList.toggle('theme-light',!dark)},dark);
    const link=page.locator('a.internal-link').filter({hasText:'验收浮窗'});await link.scrollIntoViewIfNeeded();
    await page.keyboard.down('Meta');await link.hover();
    try {
     const pop=page.locator('.hover-popover').last();await pop.waitFor({state:'visible'});
     await pop.locator('pre').waitFor();
     const r=await pop.evaluate(e=>({width:e.getBoundingClientRect().width,line:getComputedStyle(e.querySelector('p')).lineHeight,border:getComputedStyle(e.querySelector('h1')).borderBottomWidth,pre:getComputedStyle(e.querySelector('pre')).backgroundColor}));
     assert.equal(r.line,'25.6px');assert.equal(r.border,'1px');assert.ok(r.width<800&&r.width>100);assert.equal(r.pre,dark?'rgb(43, 48, 53)':'rgb(248, 248, 248)');
    }finally{await page.keyboard.up('Meta');await page.mouse.move(10,10);await page.waitForTimeout(350)}
   }
   await page.evaluate(()=>{document.body.classList.remove('theme-dark');document.body.classList.add('theme-light')});
  });

  await t.test('reading and live search move the active match',async()=>{
   for(const mode of ['preview','live']){
    await open('验收布局.md',mode);await page.evaluate(()=>app.commands.executeCommandById('editor:open-search'));
    const input=page.locator('.document-search-container input[type="text"]').first();await input.fill('needle');
    const selector=mode==='preview'?'.search-highlight > .is-active':'.is-live-preview .obsidian-search-match-highlight';
    await page.locator(selector).waitFor();
    const first=await page.locator(selector).evaluate(e=>e.getBoundingClientRect().left);await input.press('Enter');
    await page.waitForFunction(({selector,first})=>{const e=document.querySelector(selector);return e&&Math.abs(e.getBoundingClientRect().left-first)>1},{selector,first});
    await input.press('Escape');
   }
  });

  await t.test('paragraph-indent input preserves heading/list text and caret',async()=>{
   await settings({paragraphIndent:true});await open('验收布局.md','source');
   await page.evaluate(()=>app.workspace.activeLeaf.view.editor.setValue('\n\n'));
   await open('验收布局.md');
   await page.evaluate(()=>{const e=app.workspace.activeLeaf.view.editor;e.setCursor({line:0,ch:0});e.focus()});
   await page.keyboard.type('# Heading');await page.keyboard.press('Enter');await page.keyboard.type('- item');
   const value=await page.evaluate(()=>app.workspace.activeLeaf.view.editor.getValue());assert.ok(value.startsWith('# Heading\n- item'));
   await settings({paragraphIndent:false});await page.evaluate(async text=>{app.workspace.activeLeaf.view.editor.setValue(text);await app.workspace.activeLeaf.view.save()},fixtures['验收布局.md']);
  });

  await t.test('real popout is styled and its document is released on close',async()=>{
   const result=await page.evaluate(async()=>{
    const p=app.plugins.plugins['qing-shan-typora'],before=p.documents.size;
    const leaf=await app.workspace.openPopoutLeaf();await leaf.setViewState({type:'markdown',state:{file:'验收布局.md',mode:'preview'}});
    const doc=leaf.view.containerEl.ownerDocument;if(doc===document)throw Error('Popout is not isolated');
    const styled=doc.body.classList.contains('qs-typora-enabled'),tracked=p.documents.has(doc);
    const font=doc.defaultView.getComputedStyle(doc.querySelector('.markdown-preview-view')).fontSize;
    doc.defaultView.close();return {before,styled,tracked,font};
   });
   assert.ok(result.styled);assert.ok(result.tracked);assert.equal(result.font,'16px');
   await page.waitForFunction(before=>app.plugins.plugins['qing-shan-typora'].documents.size<=before,result.before);
  });

  await t.test('native PDF exports code, keyboard keys, details, math and rendered Mermaid',async()=>{
   await open('验收打印.md','preview');
   const allow=page.locator('.markdown-preview-view button').filter({hasText:'允许'});
   if(await allow.count())await allow.first().click();
   await page.locator('.markdown-preview-view .mermaid svg').waitFor();
   const output='/tmp/qs-audit-20261101/runtime-export.pdf';
   if(fs.existsSync(output))fs.unlinkSync(output);
   await page.evaluate(output=>{
    const d=require('electron').remote.dialog;
    window.__qsPrintRestore={async:d.showSaveDialog,sync:d.showSaveDialogSync};
    d.showSaveDialog=async()=>({canceled:false,filePath:output});d.showSaveDialogSync=()=>output;
   },output);
   try {
    await page.evaluate(()=>app.commands.executeCommandById('workspace:export-pdf'));
    await page.locator('.modal button').filter({hasText:'导出'}).click();
    for(let i=0;i<60&&!fs.existsSync(output);i++)await page.waitForTimeout(250);
    assert.ok(fs.existsSync(output),'Native PDF did not appear');
    const bytes=fs.readFileSync(output);assert.equal(bytes.subarray(0,5).toString(),'%PDF-');assert.ok(bytes.length>5000);
    const text=require('node:child_process').execFileSync('pdftotext',['-layout',output,'-'],{encoding:'utf8'});
    for(const word of ['Cmd','虚构摘要','PRINT_TOKEN','开始','完成'])assert.ok(text.includes(word),`PDF missing ${word}`);
    assert.ok(!text.includes('flowchart LR'),'Mermaid source leaked into PDF');
    assert.match(text,/[x𝑥]\s*=\s*1/u,'Rendered formula is missing from PDF');
   }finally{
    await page.evaluate(()=>{const d=require('electron').remote.dialog;d.showSaveDialog=window.__qsPrintRestore.async;d.showSaveDialogSync=window.__qsPrintRestore.sync;delete window.__qsPrintRestore});
   }
  });

  await t.test('title preferences and actual settings controls retain their behavior',async()=>{
   await open('验收布局.md');
   const title=page.locator('.is-live-preview .cm-sizer > .inline-title');
   await settings({hideInlineTitle:true});assert.equal(await title.evaluate(e=>getComputedStyle(e).display),'none');
   await settings({hideInlineTitle:false});assert.notEqual(await title.evaluate(e=>getComputedStyle(e).display),'none');
   await settings({hideInlineTitle:true,widthMode:'typora',contentWidth:800});
   await page.evaluate(()=>{app.setting.open();app.setting.openTabById('qing-shan-typora')});
   try {
    await page.waitForTimeout(100);
    const panel=browser.contexts().flatMap(c=>c.pages()).find(p=>p.url()==='about:blank') || page;
    const mode=panel.locator('.setting-item').filter({has:panel.locator('.setting-item-name',{hasText:'正文宽度'})});
    const width=panel.locator('.setting-item').filter({has:panel.locator('.setting-item-name',{hasText:'正文最大宽度'})});
    assert.ok(await width.locator('input[type=range]').isDisabled());
    await mode.locator('select:not(.is-measuring)').selectOption('fixed');
    await panel.waitForFunction(()=>{const e=document.querySelector('.setting-item input[type=range][min="480"]');return e&&!e.disabled});
    await width.locator('input[type=range]').focus();await width.locator('input[type=range]').press('ArrowRight');
    await page.waitForFunction(()=>app.plugins.plugins['qing-shan-typora'].settings.contentWidth===820);
    await page.waitForFunction(async()=> (await app.plugins.plugins['qing-shan-typora'].loadData()).contentWidth===820);
    await mode.locator('select:not(.is-measuring)').selectOption('typora');
    await panel.waitForFunction(()=>document.querySelector('.setting-item input[type=range][min="480"]')?.disabled);
    assert.ok(await width.locator('input[type=range]').isDisabled());
   } finally {await page.evaluate(()=>app.setting.close())}
   await viewport(600);await open('验收布局.md');
   assert.equal(await page.locator('.is-live-preview .cm-scroller').evaluate(e=>getComputedStyle(e).paddingLeft),'18px');
   await viewport(1440);await page.evaluate(()=>app.plugins.plugins['qing-shan-typora'].resetSettings());
  });

  await t.test('unload removes plugin body state and reload restores defaults',async()=>{
   await page.evaluate(()=>app.plugins.disablePlugin('qing-shan-typora'));
   assert.equal(await page.evaluate(()=>[...document.body.classList].some(x=>x.startsWith('qs-typora-'))),false);
   await page.evaluate(async()=>{await app.plugins.enablePlugin('qing-shan-typora');await app.plugins.plugins['qing-shan-typora'].resetSettings()});
   assert.equal(await page.evaluate(()=>document.body.classList.contains('qs-typora-enabled')),true);
  });
 } finally {if(browser)await browser.close();}
});

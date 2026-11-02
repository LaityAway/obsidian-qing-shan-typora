// Synthetic DOM only: no Obsidian vault or notes are opened.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE || '/Users/laity/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');

test('nested live-preview formula keeps spacing on the outer container only',async()=>{
  const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH || '/Users/laity/.cache/hyperframes/chrome/chrome-headless-shell/mac_arm-152.0.7977.30/chrome-headless-shell-mac-arm64/chrome-headless-shell'});
  try {
    const page=await browser.newPage();
    await page.setContent('<body class="qs-typora-enabled"><div class="workspace-leaf-content" data-type="markdown"><div class="markdown-source-view mod-cm6 is-live-preview"><div class="cm-embed-block cm-math" id="outer"><div class="math math-block" id="inner">x</div></div></div></div></body>');
    await page.addStyleTag({content:fs.readFileSync(path.join(__dirname,'../styles.css'),'utf8')});
    const values=await page.evaluate(()=>['outer','inner'].map(id=>{const s=getComputedStyle(document.getElementById(id));return {margin:s.marginTop,padding:s.paddingTop}}));
    assert.equal(values[0].margin,'16px');
    assert.equal(values[0].padding,'4px');
    assert.equal(values[1].margin,'0px');
    assert.equal(values[1].padding,'0px');
  } finally { await browser.close(); }
});

test('live preview heading spans inherit the line height of each heading',async()=>{
  const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH || '/Users/laity/.cache/hyperframes/chrome/chrome-headless-shell/mac_arm-152.0.7977.30/chrome-headless-shell-mac-arm64/chrome-headless-shell'});
  try {
    const page=await browser.newPage();
    await page.setContent('<body class="qs-typora-enabled"><div class="workspace-leaf-content" data-type="markdown"><div class="markdown-source-view mod-cm6 is-live-preview"><div class="cm-line HyperMD-header-1"><span class="cm-header cm-header-1">标题一</span></div><div class="cm-line HyperMD-header-2"><span class="cm-header cm-header-2">标题二</span></div></div></div></body>');
    await page.addStyleTag({content:fs.readFileSync(path.join(__dirname,'../styles.css'),'utf8')});
    const values=await page.locator('.cm-line').evaluateAll(lines=>lines.map(line=>[getComputedStyle(line).lineHeight,getComputedStyle(line.querySelector('.cm-header')).lineHeight]));
    for(const [line,span] of values) assert.equal(span,line);
  } finally { await browser.close(); }
});

test('print code uses the light Typora token palette in either application theme',async()=>{
  const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH || '/Users/laity/.cache/hyperframes/chrome/chrome-headless-shell/mac_arm-152.0.7977.30/chrome-headless-shell-mac-arm64/chrome-headless-shell'});
  try {
    const page=await browser.newPage();
    await page.setContent('<body class="qs-typora-enabled theme-light"><div class="print"><div class="markdown-preview-view"><pre><code><span class="token keyword">const</span> <span class="token string">text</span></code></pre></div></div></body>');
    await page.addStyleTag({content:fs.readFileSync(path.join(__dirname,'../styles.css'),'utf8')});
    for(const theme of ['theme-light','theme-dark']){
      await page.evaluate(theme=>document.body.className='qs-typora-enabled '+theme,theme);
      const colors=await page.locator('.print .token').evaluateAll(nodes=>nodes.map(node=>getComputedStyle(node).color));
      assert.deepEqual(colors,['rgb(119, 0, 136)','rgb(170, 17, 17)']);
    }
  } finally { await browser.close(); }
});

test('live preview keeps host gutters visible and adjacent to a centered content group',async()=>{
  const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH || '/Users/laity/.cache/hyperframes/chrome/chrome-headless-shell/mac_arm-152.0.7977.30/chrome-headless-shell-mac-arm64/chrome-headless-shell'});
  try {
    const page=await browser.newPage();
    await page.setContent('<style>*{box-sizing:border-box}body{margin:0}.cm-scroller{display:flex;width:100%}.cm-contentContainer{display:flex}.cm-content{flex:2 1 auto}.cm-gutters{display:flex;flex-shrink:0;width:40px;margin-right:24px}</style><body class="qs-typora-enabled qs-typora-width-fixed"><div class="workspace-leaf-content" data-type="markdown"><div class="markdown-source-view mod-cm6 is-live-preview"><div class="cm-editor"><div class="cm-scroller"><div class="cm-sizer"><div class="cm-contentContainer"><div class="cm-gutters">1</div><div class="cm-content">虚构内容</div></div></div></div></div></div></div></body>');
    await page.addStyleTag({content:fs.readFileSync(path.join(__dirname,'../styles.css'),'utf8')});
    for(const width of [600,1400,1900]) {
      await page.setViewportSize({width,height:800});
      const r=await page.evaluate(()=>{const g=document.querySelector('.cm-gutters'),s=document.querySelector('.cm-sizer'),c=document.querySelector('.cm-scroller');const gr=g.getBoundingClientRect(),sr=s.getBoundingClientRect(),cr=c.getBoundingClientRect(),content=document.querySelector('.cm-content').getBoundingClientRect();return {display:getComputedStyle(g).display,gap:content.left-gr.right,groupCenter:(sr.left+sr.right)/2,center:(cr.left+cr.right)/2,width:sr.width,inside:gr.left>=cr.left&&sr.right<=cr.right}});
      assert.notEqual(r.display,'none');
      assert.ok(Math.abs(r.gap-24)<1,`gutter gap at ${width}: ${r.gap}`);
      assert.ok(Math.abs(r.groupCenter-r.center)<1,`group center at ${width}`);
      assert.ok(r.inside);assert.ok(r.width>0&&r.width<=800);
    }
  } finally { await browser.close(); }
});

test('print components have explicit light-paper styles and contain wide diagrams',async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH || '/Users/laity/.cache/hyperframes/chrome/chrome-headless-shell/mac_arm-152.0.7977.30/chrome-headless-shell-mac-arm64/chrome-headless-shell'});
 try {
  const page=await browser.newPage();
  await page.setContent('<body class="qs-typora-enabled theme-dark"><div class="print"><div class="markdown-preview-view" style="width:400px"><kbd>Cmd</kbd><details open><summary>虚构摘要</summary>内容</details><div class="mermaid"><svg width="900" height="100" viewBox="0 0 900 100"></svg></div></div></div></body>');
  await page.addStyleTag({content:fs.readFileSync(path.join(__dirname,'../styles.css'),'utf8')});
  const r=await page.evaluate(()=>{const k=getComputedStyle(document.querySelector('kbd')),d=getComputedStyle(document.querySelector('details'));return {kbdBorder:k.borderTopStyle,kbdColor:k.color,detailsBorder:d.borderTopStyle,detailsColor:d.borderTopColor,svgWidth:document.querySelector('svg').getBoundingClientRect().width}});
  assert.equal(r.kbdBorder,'solid');assert.equal(r.kbdColor,'rgb(36, 39, 41)');assert.equal(r.detailsBorder,'solid');assert.equal(r.detailsColor,'rgb(223, 226, 229)');assert.ok(r.svgWidth<=400);
 } finally {await browser.close()}
});

test('body-level hover preview receives typography without full-page sizing',async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH || '/Users/laity/.cache/hyperframes/chrome/chrome-headless-shell/mac_arm-152.0.7977.30/chrome-headless-shell-mac-arm64/chrome-headless-shell'});
 try {
  const page=await browser.newPage();
  await page.setContent('<body class="qs-typora-enabled theme-light"><div class="popover hover-popover" style="width:360px"><div class="markdown-embed"><div class="markdown-embed-content"><div class="markdown-preview-view"><h1>虚构标题</h1><p>正文</p><pre><code><span class="token keyword">const</span> value = 1;<span class="token deleted">old</span></code></pre></div></div></div></div></body>');
  await page.addStyleTag({content:fs.readFileSync(path.join(__dirname,'../styles.css'),'utf8')});
  const r=await page.evaluate(()=>{const p=document.querySelector('p'),h=document.querySelector('h1'),pre=document.querySelector('pre');return {lh:getComputedStyle(p).lineHeight,border:getComputedStyle(h).borderBottomWidth,bg:getComputedStyle(pre).backgroundColor,width:document.querySelector('.hover-popover').getBoundingClientRect().width}});
  assert.equal(r.lh,'25.6px');assert.equal(r.border,'1px');assert.equal(r.bg,'rgb(248, 248, 248)');assert.equal(r.width,360);
  await page.evaluate(()=>{document.body.classList.replace('theme-light','theme-dark')});
  assert.equal(await page.locator('.token.deleted').evaluate(e=>getComputedStyle(e).color),'rgb(255, 161, 152)');
 } finally {await browser.close()}
});

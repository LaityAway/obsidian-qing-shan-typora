// Synthetic DOM only. Never connects to Obsidian or opens any vault note.
const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE || '/Users/laity/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const cells='<td><div class="table-cell-wrapper">示例</div></td>'.repeat(50);
test('synthetic browser layout: Typora widths, tables, code, inline elements and focus',async t=>{
 const b=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH || '/Users/laity/.cache/hyperframes/chrome/chrome-headless-shell/mac_arm-152.0.7977.30/chrome-headless-shell-mac-arm64/chrome-headless-shell'});
 try{const p=await b.newPage({viewport:{width:1400,height:1000}});
 await p.setContent(`<style>*{box-sizing:border-box}body{margin:0}.workspace-leaf-content[data-type=markdown]{width:1400px}.markdown-preview-view,.cm-scroller{width:100%}.workspace-leaf-content[data-type=canvas]{background:#abcdef}.inline-title{display:block}</style>
 <body class="theme-light qs-typora-enabled qs-typora-width-fixed"><div class="workspace-leaf-content" data-type="markdown">
 <div class="markdown-reading-view"><div class="markdown-preview-view"><div class="inline-title">虚构标题</div><div class="markdown-preview-sizer">
 <div class="internal-embed"><h1>虚构嵌入</h1></div>
 <h1>一级标题</h1>
 <h2>二级 <code>code-in-h2</code></h2>
 <h6>六级标题</h6>
 <p id="prose-p">正文 <code>行内</code> <mark>高亮</mark> <kbd>Cmd</kbd> <a class="internal-link" href="#">双链示例</a> <sup class="footnote-ref"><a href="#fn1">[1]</a></sup> <strong>粗体测试</strong></p>
 <p id="media-p"><span class="image-embed is-loaded"><img src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"></span></p>
 <div class="toc-reader">
   <ul class="toc-reader-list">
     <li class="toc-reader-item"><a href="#一级标题"><span class="toc-reader-num">1.</span>一级标题</a></li>
   </ul>
 </div>
 <div class="toc">
   <ul class="generic-toc-list">
     <li><a href="#一级标题">Generic TOC 1</a><ul><li>Sub item</li></ul></li>
   </ul>
 </div>
 <details open><summary>Details Title</summary><p>Details body</p></details>
 <blockquote><p>引用正文</p></blockquote>
 <div class="callout" style="--callout-color: 8, 109, 221;"><div class="callout-title"><div class="callout-icon">i</div>提示</div><div class="callout-content"><p>这是提示正文</p></div></div>
 <div class="el-ul"><ul class="test-ul"><li>一级项<ul class="nested-ul"><li>二级子项</li></ul></li></ul></div>
 <div class="math-block">E = mc^2</div>
 <pre class="language-js"><code>const a = 1; <span class="token keyword">function</span> ${'x'.repeat(300)}</code></pre>
 <div class="el-table"><table><tr>${cells}</tr></table></div>
 <div class="footnotes"><ol><li>脚注 <a class="footnote-backref">↩</a></li></ol></div>
 </div></div></div>
 <div class="markdown-source-view mod-cm6 is-live-preview"><div class="cm-editor"><div class="cm-scroller"><div class="cm-sizer"><div class="cm-contentContainer"><div class="cm-content">
 <div class="cm-line HyperMD-header-6">LP六级标题</div>
 <div class="cm-line HyperMD-frontmatter" id="lp-frontmatter">tags: [test]</div>
 <div class="cm-line HyperMD-footnote" id="lp-footnote">[^1]: Footnote def</div>
 <div class="cm-line" id="lp-img"><span class="image-embed"><img src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"></span></div>
 <div class="cm-line" id="lp-prose">LP普通正文段落</div>
 <div class="cm-line HyperMD-quote">LP引用正文</div>
 <div class="cm-line HyperMD-list-line HyperMD-list-line-2" style="text-indent: -24px; padding-inline-start: 48px;">LP列表项</div>
 <div class="cm-line HyperMD-task-line is-checked"><input type="checkbox" checked> 任务已完成</div>
 <div class="cm-line HyperMD-codeblock HyperMD-codeblock-begin"><span class="cm-keyword">const</span> a = 1; <span class="cm-def">myFunc</span>();</div>
 <div class="cm-line HyperMD-codeblock">return a;</div>
 <div class="cm-line HyperMD-codeblock HyperMD-codeblock-end">}</div>
 <div class="cm-embed-block cm-table-widget"><div class="table-wrapper"><table><tr>${'<td><div class="table-cell-wrapper">示例</div></td>'.repeat(24)}</tr></table></div></div>
 </div></div></div></div></div></div>
 </div><div class="workspace-leaf-content" data-type="canvas">虚构画布</div><button class="nav-file-title">示例</button><div class="print"><div class="markdown-preview-view" id="pdf-export-view"><h1 id="pdf-h1">PDF 一级标题</h1><p id="pdf-prose-p">PDF普通段落</p><p id="pdf-media-p"><img src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"></p><pre><code id="pdf-code">const x = 1;</code></pre><div class="markdown-embed"><div class="markdown-preview-view"><h1 id="pdf-embed-h1">PDF 嵌入标题</h1></div></div><div class="callout" id="pdf-callout" style="--callout-color: 8, 109, 221;"><div class="callout-title">PDF Callout</div></div><table><thead><tr><th>PDF Th</th></tr></thead><tbody><tr><td>PDF Td</td></tr></tbody></table></div></div></body>`);
 await p.addStyleTag({content:fs.readFileSync(path.join(__dirname,'../styles.css'),'utf8')});
 await t.test('fixed widths affect both reading and editing',async()=>{for(const w of [480,800,1000,1200]){const a=await p.evaluate(w=>{document.body.style.setProperty('--qs-typora-width',w+'px');return ['.markdown-preview-sizer','.cm-scroller > .cm-sizer'].map(s=>document.querySelector(s).getBoundingClientRect().width)},w);assert.deepEqual(a,[w,w]);}});
 await t.test('full width restores available width',async()=>{await p.evaluate(()=>{document.body.classList.remove('qs-typora-width-fixed');document.body.classList.add('qs-typora-width-full')});assert.equal(await p.locator('.markdown-preview-sizer').evaluate(x=>x.getBoundingClientRect().width),1340);await p.evaluate(()=>{document.body.classList.remove('qs-typora-width-full');document.body.classList.add('qs-typora-width-typora')});});
 await t.test('Typora scale is 860 / 1024 / 1200 by viewport',async()=>{for(const [vw,expected] of [[1200,860],[1500,1024],[1900,1200]]){await p.setViewportSize({width:vw,height:1000});assert.equal(await p.locator('.markdown-preview-sizer').evaluate(x=>x.getBoundingClientRect().width),expected);}await p.setViewportSize({width:1400,height:1000});await p.evaluate(()=>{document.body.classList.remove('qs-typora-width-typora');document.body.classList.add('qs-typora-width-fixed')});});
 await t.test('embedded h1 does not hide outer title',async()=>assert.notEqual(await p.locator('.inline-title').evaluate(x=>getComputedStyle(x).display),'none'));
 await t.test('title hiding is explicit',async()=>{await p.evaluate(()=>document.body.classList.add('qs-typora-hide-title'));assert.equal(await p.locator('.inline-title').evaluate(x=>getComputedStyle(x).display),'none');await p.evaluate(()=>document.body.classList.remove('qs-typora-hide-title'));});
 await t.test('shell is #fafafa while paper stays white',async()=>{assert.equal(await p.locator('[data-type=canvas]').evaluate(x=>getComputedStyle(x).backgroundColor),'rgb(171, 205, 239)');await p.evaluate(()=>document.body.classList.add('qs-typora-white-shell'));assert.equal(await p.locator('[data-type=canvas]').evaluate(x=>getComputedStyle(x).backgroundColor),'rgb(255, 255, 255)');});
 await t.test('dark mode uses the night palette',async()=>{
 await p.evaluate(()=>{document.body.classList.remove('theme-light');document.body.classList.add('theme-dark');});
 const a=await p.evaluate(()=>{const cs=e=>getComputedStyle(e);const main=document.querySelector('.markdown-reading-view > .markdown-preview-view');const pre=main.querySelector('pre');const det=document.querySelector('details');return{bg:cs(main).backgroundColor,text:cs(main).color,h1:cs(main.querySelector('.markdown-preview-sizer > h1')).color,pre:cs(pre).backgroundColor,token:cs(pre.querySelector('.token.keyword')).color,lpDef:cs(document.querySelector('.cm-def')).color,strong:cs(main.querySelector('strong')).color,detBorder:cs(det).borderLeftColor}});
 assert.equal(a.bg,'rgb(54, 59, 64)');assert.equal(a.text,'rgb(184, 191, 198)');assert.equal(a.h1,'rgb(222, 222, 222)');assert.equal(a.pre,'rgb(43, 48, 53)');assert.equal(a.token,'rgb(255, 123, 114)');assert.equal(a.lpDef,'rgb(210, 168, 255)');assert.equal(a.strong,'rgb(222, 222, 222)');assert.equal(a.detBorder,'rgb(71, 77, 84)');
 await p.evaluate(()=>{document.body.classList.remove('theme-dark');document.body.classList.add('theme-light');});
});
await t.test('narrow split uses the same padding in both views',async()=>{await p.locator('[data-type=markdown]').evaluate(x=>x.style.width='500px');const a=await p.evaluate(()=>['.markdown-preview-view','.is-live-preview > .cm-editor > .cm-scroller'].map(s=>getComputedStyle(document.querySelector(s)).paddingLeft));assert.deepEqual(a,['18px','18px']);});
 await t.test('wide tables scroll instead of shrinking below 32px',async()=>{await p.locator('[data-type=markdown]').evaluate(x=>x.style.width='1400px');const a=await p.locator('.markdown-preview-view .el-table').evaluate(x=>{x.scrollLeft=120;const th=x.querySelector('th,td');return{overflow:getComputedStyle(x).overflowX,scroll:x.scrollLeft,minWidth:getComputedStyle(th).minWidth,sw:x.scrollWidth,cw:x.clientWidth}});assert.equal(a.overflow,'auto');assert.equal(a.minWidth,'32px');assert.ok(a.sw>a.cw);assert.ok(a.scroll>0);});
 await t.test('live preview table reserves a 20px gutter for native handles',async()=>{await p.locator('[data-type=markdown]').evaluate(x=>x.style.width='1400px');const a=await p.locator('.cm-table-widget > .table-wrapper').evaluate(x=>{const r=x.getBoundingClientRect(),t=x.querySelector('table').getBoundingClientRect(),c=x.closest('.cm-content').getBoundingClientRect();return{padding:getComputedStyle(x).padding,marginLeft:getComputedStyle(x).marginLeft,tableLeft:Math.round(t.left),contentLeft:Math.round(c.left),sw:x.scrollWidth,cw:x.clientWidth}});assert.equal(a.padding,'20px');assert.equal(a.marginLeft,'0px');assert.equal(a.tableLeft,a.contentLeft+20);assert.equal(a.sw,a.cw);});
 await t.test('code blocks match Typora box, wrap, font and palette',async()=>{const a=await p.evaluate(()=>{const cs=e=>getComputedStyle(e);const pre=document.querySelector('.markdown-preview-view pre');const code=pre.querySelector('code');const inline=document.querySelector('.markdown-preview-view p code');const line=document.querySelector('.HyperMD-codeblock');const begin=document.querySelector('.HyperMD-codeblock-begin');const end=document.querySelector('.HyperMD-codeblock-end');return{pre:cs(pre).whiteSpace,code:cs(code).whiteSpace,pad:cs(pre).padding,margin:cs(pre).marginTop,font:cs(code).fontFamily,preFont:cs(pre).fontSize,preLH:cs(pre).lineHeight,codeFont:cs(code).fontSize,inlinePad:cs(inline).padding,token:cs(pre.querySelector('.token.keyword')).color,lpToken:cs(document.querySelector('.cm-keyword')).color,lpPad:cs(line).paddingLeft,lpTop:cs(begin).paddingTop,lpBottom:cs(end).paddingBottom,lpFont:cs(line).fontSize,lpLH:cs(line).lineHeight}});assert.equal(a.pre,'pre-wrap');assert.equal(a.code,'pre-wrap');assert.equal(a.pad,'8px 8px 6px');assert.equal(a.margin,'15px');assert.ok(a.font.includes('Lucida Console'));assert.equal(a.preFont,'14.4px');assert.equal(a.preLH,'23.04px');assert.equal(a.codeFont,'14.4px');assert.equal(a.inlinePad,'0px 2px');assert.equal(a.token,'rgb(119, 0, 136)');assert.equal(a.lpToken,'rgb(119, 0, 136)');assert.equal(a.lpPad,'8px');assert.equal(a.lpTop,'8px');assert.equal(a.lpBottom,'6px');assert.equal(a.lpFont,'14.4px');assert.equal(a.lpLH,'23.04px');});
 await t.test('mark, kbd and footnotes follow Typora',async()=>{const a=await p.evaluate(()=>{const mark=document.querySelector('.markdown-preview-view mark');const kbd=document.querySelector('.markdown-preview-view kbd');const fn=document.querySelector('.markdown-preview-view .footnotes');return{mark:getComputedStyle(mark).backgroundColor,kbd:getComputedStyle(kbd).borderStyle,fn:getComputedStyle(fn).fontSize,opacity:getComputedStyle(fn).opacity}});assert.equal(a.mark,'rgb(255, 255, 0)');assert.equal(a.kbd,'solid');assert.equal(a.fn,'14.4px');assert.equal(a.opacity,'0.8');});
 await t.test('headings do not add Typora-absent bottom padding',async()=>{const a=await p.locator('.markdown-preview-sizer > h1').evaluate(x=>getComputedStyle(x).paddingBottom);assert.equal(a,'0px');});
 await t.test('callout uses RGB callout color and keeps normal content color',async()=>{
  const a=await p.evaluate(()=>{
   const c=document.querySelector('.callout');
   const title=c.querySelector('.callout-title');
   const text=c.querySelector('.callout-content');
   return {border:getComputedStyle(c).borderLeftColor,title:getComputedStyle(title).color,text:getComputedStyle(text).color};
  });
  assert.equal(a.border,'rgb(8, 109, 221)');
  assert.equal(a.title,'rgb(8, 109, 221)');
  assert.equal(a.text,'rgb(51, 51, 51)');
 });
 await t.test('h6 is #777777 in light mode and code inside headings inherits font size',async()=>{
  const a=await p.evaluate(()=>{
   const h6=document.querySelector('.markdown-preview-sizer > h6');
   const h2=document.querySelector('.markdown-preview-sizer > h2');
   const code=h2.querySelector('code');
   const lpH6=document.querySelector('.HyperMD-header-6');
   return {h6Color:getComputedStyle(h6).color,lpH6Color:getComputedStyle(lpH6).color,h2Font:getComputedStyle(h2).fontSize,codeFont:getComputedStyle(code).fontSize};
  });
  assert.equal(a.h6Color,'rgb(119, 119, 119)');
  assert.equal(a.lpH6Color,'rgb(119, 119, 119)');
  assert.equal(a.codeFont,a.h2Font);
 });
 await t.test('nested list margin is 0, top list inside .el-ul keeps 0.8em margin, and links/footnotes match Typora',async()=>{
  const a=await p.evaluate(()=>{
   const topUl=document.querySelector('.test-ul');
   const subUl=document.querySelector('.nested-ul');
   const link=document.querySelector('.internal-link');
   const fnLink=document.querySelector('sup.footnote-ref a');
   const m=document.querySelector('.math-block');
   const lpQuote=document.querySelector('.HyperMD-quote');
   const lpList=document.querySelector('.HyperMD-list-line-2');
   return {
    topMargin:getComputedStyle(topUl).marginTop,
    subMargin:getComputedStyle(subUl).marginTop,
    linkDecor:getComputedStyle(link).textDecorationLine,
    fnColor:getComputedStyle(fnLink).color,
    fnDecor:getComputedStyle(fnLink).textDecorationLine,
    mathDisplay:getComputedStyle(m).display,
    lpQuotePad:getComputedStyle(lpQuote).paddingLeft,
    lpListPad:getComputedStyle(lpList).paddingLeft,
   };
  });
  assert.equal(a.topMargin,'12.8px');
  assert.equal(a.subMargin,'0px');
  assert.equal(a.linkDecor,'none');
  assert.equal(a.fnColor,'rgb(85, 85, 85)');
  assert.equal(a.fnDecor,'none');
  assert.equal(a.mathDisplay,'block');
  assert.equal(a.lpQuotePad,'15px');
  assert.equal(a.lpListPad,'48px');
 });
 await t.test('high-contrast mode updates both reading blockquote, live preview HyperMD-quote, and completed tasks',async()=>{
  await p.evaluate(()=>document.body.classList.add('qs-typora-contrast'));
  const a=await p.evaluate(()=>{
   const bq=document.querySelector('blockquote');
   const lpq=document.querySelector('.HyperMD-quote');
   const lpt=document.querySelector('.HyperMD-task-line.is-checked');
   return {bq:getComputedStyle(bq).color,lpq:getComputedStyle(lpq).color,lpt:getComputedStyle(lpt).color};
  });
  assert.equal(a.bq,'rgb(95, 107, 118)');
  assert.equal(a.lpq,'rgb(95, 107, 118)');
  assert.equal(a.lpt,'rgb(95, 107, 118)');
  await p.evaluate(()=>document.body.classList.remove('qs-typora-contrast'));
 });
 await t.test('keyboard focus has a visible outline',async()=>{await p.locator('.nav-file-title').focus();const a=await p.locator('.nav-file-title').evaluate(x=>({focused:x.matches(':focus-visible'),style:getComputedStyle(x).outlineStyle,width:getComputedStyle(x).outlineWidth}));assert.ok(a.focused);assert.notEqual(a.style,'none');assert.notEqual(a.width,'0px');});
 await t.test('TOC Reader list has no bullets, PDF export container is styled, and paragraphIndent works',async()=>{
  await p.evaluate(()=>{document.body.classList.add('qs-typora-indent');});
  const extraMetrics = await p.evaluate(() => {
    const cs = (sel) => getComputedStyle(document.querySelector(sel));
    return {
      tocListStyle: cs('.toc-reader-list').listStyleType,
      genericTocListStyle: cs('.generic-toc-list').listStyleType,
      genericTocSubListStyle: cs('.generic-toc-list ul').listStyleType,
      proseIndent: cs('#prose-p').textIndent,
      mediaIndent: cs('#media-p').textIndent,
      quoteIndent: cs('blockquote p').textIndent,
      lpProseIndent: cs('#lp-prose').textIndent,
      lpFrontmatterIndent: cs('#lp-frontmatter').textIndent,
      lpFootnoteIndent: cs('#lp-footnote').textIndent,
      lpImgIndent: cs('#lp-img').textIndent,
      pdfH1BorderBottom: cs('#pdf-h1').borderBottomWidth,
      pdfH1Size: cs('#pdf-h1').fontSize,
      pdfEmbedH1Size: cs('#pdf-embed-h1').fontSize,
      pdfEmbedH1Border: cs('#pdf-embed-h1').borderBottomStyle,
      pdfCodeFont: cs('#pdf-code').fontFamily,
      pdfThBg: cs('#pdf-export-view thead th').backgroundColor,
      pdfProseIndent: cs('#pdf-prose-p').textIndent,
      pdfMediaIndent: cs('#pdf-media-p').textIndent,
      pdfCalloutBorder: cs('#pdf-callout').borderLeftColor,
      pdfCalloutTitle: cs('#pdf-callout .callout-title').color,
    };
  });
  assert.equal(extraMetrics.tocListStyle, 'none');
  assert.equal(extraMetrics.genericTocListStyle, 'none');
  assert.equal(extraMetrics.genericTocSubListStyle, 'none');
  assert.equal(extraMetrics.proseIndent, '32px');
  assert.equal(extraMetrics.mediaIndent, '0px');
  assert.equal(extraMetrics.quoteIndent, '0px');
  assert.equal(extraMetrics.lpProseIndent, '32px');
  assert.equal(extraMetrics.lpFrontmatterIndent, '0px');
  assert.equal(extraMetrics.lpFootnoteIndent, '0px');
  assert.equal(extraMetrics.lpImgIndent, '0px');
  assert.equal(extraMetrics.pdfH1BorderBottom, '1px');
  assert.equal(extraMetrics.pdfH1Size, '32px');
  assert.equal(extraMetrics.pdfEmbedH1Size, '18px');
  assert.equal(extraMetrics.pdfEmbedH1Border, 'none');
  assert.ok(extraMetrics.pdfCodeFont.includes('Lucida Console'));
  assert.equal(extraMetrics.pdfThBg, 'rgb(248, 248, 248)');
  assert.equal(extraMetrics.pdfProseIndent, '32px');
  assert.equal(extraMetrics.pdfMediaIndent, '0px');
  assert.equal(extraMetrics.pdfCalloutBorder, 'rgb(8, 109, 221)');
  assert.equal(extraMetrics.pdfCalloutTitle, 'rgb(8, 109, 221)');
  await p.evaluate(()=>{document.body.classList.remove('qs-typora-indent');});
 });
 await t.test('overrides Obsidian is-readable-line-width 700px cap on inner containers',async()=>{
  const a=await p.evaluate(()=>{
   const style=document.createElement('style');
   style.id='obs-readable-mock';
   style.textContent='body{--file-line-width:700px}.markdown-preview-sizer,.markdown-preview-sizer>div,.cm-sizer,.cm-content{max-width:var(--file-line-width)}';
   document.head.appendChild(style);
   document.body.classList.remove('qs-typora-width-fixed');
   document.body.classList.add('qs-typora-width-typora');
   const previewDiv=document.querySelector('.markdown-preview-sizer > div');
   const cmContent=document.querySelector('.cm-content');
   const fileLineWidth=getComputedStyle(document.querySelector('.markdown-preview-view')).getPropertyValue('--file-line-width').trim();
   const res={
    fileLineWidth,
    previewDivWidth:previewDiv.getBoundingClientRect().width,
    cmContentWidth:cmContent.getBoundingClientRect().width,
   };
   style.remove();
   return res;
  });
  assert.equal(a.fileLineWidth,'100%');
  assert.equal(a.previewDivWidth,1024);
  assert.equal(a.cmContentWidth,1024);
 });
 }finally{await b.close();}
});
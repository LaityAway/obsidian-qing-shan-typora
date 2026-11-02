// Synthetic DOM only. Never connects to Obsidian or opens a vault note.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || '/Users/laity/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const css = fs.readFileSync(path.join(__dirname, '../styles.css'), 'utf8');
const executablePath = process.env.CHROME_PATH || '/Users/laity/.cache/hyperframes/chrome/chrome-headless-shell/mac_arm-152.0.7977.30/chrome-headless-shell-mac-arm64/chrome-headless-shell';
const vars = '--text-normal:#333;--text-muted:#777;--text-accent:#4183c4;--background-primary:#fff;--background-modifier-border:#dfe2e5;--background-modifier-hover:#f5f5f5;--font-text:system-ui;';

const home = `
<body class="theme-light qs-typora-enabled qs-typora-width-typora" style="${vars}">
<div class="workspace-leaf-content" data-type="markdown" style="width:760px">
  <div class="markdown-reading-view"><div class="markdown-preview-view qs-home"><div class="markdown-preview-sizer">
    <div class="mod-header mod-ui"><div class="inline-title">首页</div><div class="metadata-container">属性</div></div>
    <div class="el-h1"><h1>青山</h1></div>
    <div class="el-blockquote"><blockquote><p>工作、知识与思考</p></blockquote></div>
    <div class="el-h2"><h2>快速开始</h2></div>
    <div class="el-ul"><ul><li><span class="list-bullet"></span><a class="internal-link">一</a> — 说明</li><li><span class="list-bullet"></span><a class="internal-link">二</a> — 说明</li><li><span class="list-bullet"></span><a class="internal-link">三</a> — 说明<ul class="nested"><li><span class="list-bullet"></span>嵌套</li></ul></li></ul></div>
    <div class="el-p"><p>正文 <em>强调词</em> 不应独占一行。</p></div>
    <div class="el-blockquote"><blockquote><p>普通引用，不应变成副标题。</p></blockquote></div>
    <div class="el-p"><div class="internal-embed markdown-embed"><div class="markdown-embed-content"><div class="markdown-preview-view"><div class="markdown-preview-sizer"><div class="el-h1"><h1>嵌入标题</h1></div><div class="el-ul"><ul><li>嵌入列表</li></ul></div></div></div></div></div></div>
    <div class="el-p"><p><em>留下记录，让知识生长。</em></p></div>
    <div class="el-div"><div class="callout" style="--callout-color:8,109,221"><div class="callout-content"><ul class="callout-list"><li>Callout 项</li></ul></div></div></div>
    <div class="mod-footer mod-ui"></div>
  </div></div></div>
</div></body>`;

test('home grid clips the first-column separator and leaves nested/callout lists alone', async () => {
  const browser = await chromium.launch({ headless: true, executablePath });
  try {
    const page = await browser.newPage({ viewport: { width: 760, height: 1000 } });
    await page.setContent(home);
    await page.addStyleTag({ content: css });
    const r = await page.evaluate(() => {
      const view = document.querySelector('.markdown-preview-view.qs-home');
      const top = view.querySelector('.el-ul > ul');
      const nested = view.querySelector('.el-ul > ul > li > ul');
      const callout = view.querySelector('.callout ul');
      const cs = (e) => getComputedStyle(e);
      return {
        top: cs(top).display,
        overflow: cs(top).overflow,
        bg: cs(top).backgroundColor,
        marginLeft: cs(top.children[0]).marginLeft,
        items: [...top.children].map((li) => cs(li).borderLeftWidth),
        bullets: [...top.children].map((li) => cs(li.querySelector(':scope > .list-bullet')).display),
        nested: cs(nested).display,
        nestedBullet: cs(nested.querySelector('.list-bullet')).display,
        callout: cs(callout).display,
      };
    });
    assert.equal(r.top, 'grid');
    assert.equal(r.overflow, 'hidden');
    assert.equal(r.bg, 'rgba(0, 0, 0, 0)');
    assert.equal(r.marginLeft, '-1px');
    assert.deepEqual(r.items, ['1px', '1px', '1px']);
    assert.deepEqual(r.bullets, ['none', 'none', 'none']);
    assert.equal(r.nested, 'block');
    assert.notEqual(r.nestedBullet, 'none');
    assert.equal(r.callout, 'block');
  } finally { await browser.close(); }
});

test('home prose emphasis and blockquotes stay scoped', async () => {
  const browser = await chromium.launch({ headless: true, executablePath });
  try {
    const page = await browser.newPage();
    await page.setContent(home);
    await page.addStyleTag({ content: css });
    const r = await page.evaluate(() => {
      const view = document.querySelector('.markdown-preview-view.qs-home');
      const bqs = [...view.querySelectorAll('.el-blockquote > blockquote')];
      const ems = [...view.querySelectorAll('.el-p > p > em')];
      const cs = (e) => getComputedStyle(e);
      return {
        first: { align: cs(bqs[0]).textAlign, size: cs(bqs[0]).fontSize },
        second: { align: cs(bqs[1]).textAlign, size: cs(bqs[1]).fontSize },
        ems: ems.map((e) => ({ text: e.textContent, display: cs(e).display, size: cs(e).fontSize })),
      };
    });
    assert.equal(r.first.align, 'center');
    assert.equal(r.first.size, '18px');
    assert.notEqual(r.second.align, 'center');
    assert.notEqual(r.second.size, '18px');
    assert.deepEqual(r.ems.map((e) => e.display), ['inline', 'block']);
    assert.deepEqual(r.ems.map((e) => e.size), ['16px', '12px']);
  } finally { await browser.close(); }
});

test('home styles do not leak into embedded notes', async () => {
  const browser = await chromium.launch({ headless: true, executablePath });
  try {
    const page = await browser.newPage();
    await page.setContent(home);
    await page.addStyleTag({ content: css });
    const r = await page.evaluate(() => {
      const embed = document.querySelector('.markdown-preview-view.qs-home .markdown-embed');
      const h1 = embed.querySelector('h1');
      const ul = embed.querySelector('ul');
      const preview = embed.querySelector('.markdown-preview-view');
      const cs = (e) => getComputedStyle(e);
      return {
        h1: cs(h1).fontSize,
        h1Var: cs(preview).getPropertyValue('--h1-size').trim(),
        padding: cs(preview).padding,
        ul: cs(ul).display,
        before: cs(h1, '::before').content,
      };
    });
    assert.equal(r.h1, '18px');
    assert.equal(r.h1Var, '1.125em');
    assert.equal(r.padding, '0px');
    assert.equal(r.ul, 'block');
    assert.notEqual(r.before, '""');
  } finally { await browser.close(); }
});

test('home callout and footer only affect their own sections', async () => {
  const browser = await chromium.launch({ headless: true, executablePath });
  try {
    const page = await browser.newPage();
    await page.setContent(home);
    await page.addStyleTag({ content: css });
    const r = await page.evaluate(() => {
      const view = document.querySelector('.markdown-preview-view.qs-home');
      const callout = view.querySelector('.callout');
      const footer = [...view.querySelectorAll('.el-p > p > em')].find((e) => e.textContent.includes('留下记录'));
      return {
        callout: { margin: getComputedStyle(callout).marginTop, font: getComputedStyle(callout).fontSize },
        footer: { display: getComputedStyle(footer).display, font: getComputedStyle(footer).fontSize },
      };
    });
    assert.equal(r.callout.margin, '18px');
    assert.equal(r.callout.font, '12px');
    assert.equal(r.footer.display, 'block');
    assert.equal(r.footer.font, '12px');
  } finally { await browser.close(); }
});

test('white shell keeps sidebars on the sidebar colour and the main pane on paper', async () => {
  const browser = await chromium.launch({ headless: true, executablePath });
  try {
    const page = await browser.newPage();
    await page.setContent(`
      <body class="theme-light qs-typora-enabled qs-typora-white-shell">
      <div class="workspace">
        <div class="workspace-split mod-left-split"><div class="workspace-leaf"><div class="workspace-leaf-content" data-type="outline"><div class="view-content">大纲</div></div></div></div>
        <div class="workspace-split mod-root"><div class="workspace-leaf"><div class="workspace-leaf-content" data-type="markdown"><div class="view-content">正文</div></div></div></div>
      </div></body>`);
    await page.addStyleTag({ content: css });
    const r = await page.evaluate(() => {
      const cs = (s) => getComputedStyle(document.querySelector(s));
      return {
        side: cs('.mod-left-split').backgroundColor,
        outline: cs('[data-type="outline"]').backgroundColor,
        main: cs('.mod-root [data-type="markdown"]').backgroundColor,
      };
    });
    assert.equal(r.side, 'rgb(250, 250, 250)');
    assert.equal(r.outline, 'rgba(0, 0, 0, 0)');
    assert.equal(r.main, 'rgb(255, 255, 255)');
  } finally { await browser.close(); }
});

test('print uses balanced 16mm margins, tight padding and centred images', async () => {
  const browser = await chromium.launch({ headless: true, executablePath });
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'qs-home-print-'));
  try {
    const page = await browser.newPage();
    await page.setContent(`<style>body{margin:0}</style>
      <body class="theme-light qs-typora-enabled"><div class="print"><div class="markdown-preview-view">
        <p>PDF_SIDE_MARGIN</p>
        <p class="qs-typora-media-only"><span class="image-embed"><img width="120" height="80" src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"></span></p>
      </div></div></body>`);
    await page.addStyleTag({ content: css });
    const r = await page.evaluate(() => {
      const view = document.querySelector('.print > .markdown-preview-view');
      const embed = view.querySelector('.image-embed');
      const img = view.querySelector('img');
      const cs = (e) => getComputedStyle(e);
      return {
        padding: cs(view).padding,
        pSpacing: cs(view).getPropertyValue('--p-spacing').trim(),
        embedDisplay: cs(embed).display,
        imgRadius: cs(img).borderRadius,
      };
    });
    assert.equal(r.padding, '0px');
    assert.equal(r.pSpacing, '0.8em');
    assert.equal(r.embedDisplay, 'block');
    assert.equal(r.imgRadius, '4px');

    const file = path.join(dir, 'print.pdf');
    await page.pdf({ path: file, format: 'A4', printBackground: true });
    const xml = execFileSync('pdftotext', ['-bbox', file, '-'], { encoding: 'utf8' });
    const x = Number(xml.match(/xMin="([\d.]+)"[^>]*>PDF_SIDE_MARGIN/)[1]);
    assert.ok(Math.abs(x - 16 * 72 / 25.4) < 2, `PDF left margin: ${x}pt`);
  } finally {
    await browser.close();
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('details summary keeps a visible focus ring', async () => {
  const browser = await chromium.launch({ headless: true, executablePath });
  try {
    const page = await browser.newPage();
    await page.setContent(`
      <body class="theme-light qs-typora-enabled"><div class="workspace-leaf-content" data-type="markdown">
      <div class="markdown-preview-view"><details><summary>摘要</summary>内容</details></div></div></body>`);
    await page.addStyleTag({ content: css });
    const r = await page.evaluate(() => {
      const summary = document.querySelector('summary');
      summary.focus();
      const cs = getComputedStyle(summary);
      return { style: cs.outlineStyle, width: cs.outlineWidth, userSelect: cs.userSelect };
    });
    assert.notEqual(r.style, 'none');
    assert.notEqual(r.width, '0px');
    assert.notEqual(r.userSelect, 'none');
  } finally { await browser.close(); }
});

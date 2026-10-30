// Synthetic DOM only; never connects to Obsidian or reads notes.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || '/Users/laity/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const luminance = rgb => rgb.match(/\d+/g).slice(0, 3).map(Number).map(v => v / 255).map(v => v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4).reduce((sum, v, i) => sum + v * [0.2126, 0.7152, 0.0722][i], 0);
const contrast = (a, b) => (Math.max(luminance(a), luminance(b)) + 0.05) / (Math.min(luminance(a), luminance(b)) + 0.05);
test('font scope and accessible contrast regressions', async t => {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_PATH || '/Users/laity/.cache/hyperframes/chrome/chrome-headless-shell/mac_arm-152.0.7977.30/chrome-headless-shell-mac-arm64/chrome-headless-shell' });
  try {
    const page = await browser.newPage();
    await page.setContent(`<style>.markdown-source-view:not(.is-live-preview) .cm-line{font-family:Arial}</style><body class="qs-typora-enabled theme-light"><div class="workspace-leaf-content" data-type="markdown">
    <div class="markdown-preview-view"><p>Fictional prose <code id="reading-code">code</code></p><blockquote>Quote</blockquote><div class="metadata-property-key">Property</div><div class="metadata-properties-heading">Properties</div></div>
    <div class="markdown-source-view mod-cm6 is-live-preview"><div class="cm-editor"><div class="cm-line" id="prose">Prose <span class="cm-inline-code" id="inline-code">code</span></div><div class="cm-line HyperMD-codeblock" id="fence">Code</div><div class="cm-line HyperMD-quote">Quote</div><div class="cm-line HyperMD-task-line is-checked">Done</div></div></div>
    <div class="markdown-source-view mod-cm6"><div class="cm-editor"><div class="cm-line" id="source">Source <code id="source-code">code</code></div></div></div></div></body>`);
    await page.addStyleTag({ content: fs.readFileSync(path.join(__dirname, '../styles.css'), 'utf8') });
    await t.test('only rendered code uses the code font; source stays unchanged', async () => {
      for (const system of [false, true]) {
        const result = await page.evaluate(system => {
          document.body.classList.toggle('qs-typora-code-system', system);
          document.body.style.setProperty('--qs-typora-system-mono', 'TestMono, monospace');
          const font = selector => getComputedStyle(document.querySelector(selector)).fontFamily;
          return { prose: font('#prose'), parent: font('.is-live-preview'), source: font('#source'), code: ['#reading-code', '#inline-code', '#fence'].map(font) };
        }, system);
        assert.equal(result.prose, result.parent);
        assert.equal(result.source, 'Arial');
        for (const font of result.code) assert.ok(font.includes(system ? 'TestMono' : 'Lucida Console'));
      }
    });
    for (const dark of [false, true]) await t.test(`enhanced contrast reaches 4.5 for text (${dark ? 'dark' : 'light'})`, async () => {
      const result = await page.evaluate(dark => {
        document.body.classList.toggle('theme-dark', dark);
        document.body.classList.toggle('theme-light', !dark);
        const selectors = ['blockquote', '.HyperMD-quote', '.is-checked', '.metadata-property-key', '.metadata-properties-heading'];
        const colors = () => selectors.map(s => getComputedStyle(document.querySelector(s)).color);
        document.body.classList.remove('qs-typora-contrast');
        const before = colors();
        document.body.classList.add('qs-typora-contrast');
        return { before, after: colors(), background: getComputedStyle(document.querySelector('.markdown-preview-view')).backgroundColor };
      }, dark);
      result.after.forEach((color, i) => {
        const ratio = contrast(color, result.background);
        assert.ok(ratio >= 4.5, `text ${i}: contrast ${ratio.toFixed(2)}`);
        assert.ok(ratio >= contrast(result.before[i], result.background));
      });
    });
  } finally { await browser.close(); }
});

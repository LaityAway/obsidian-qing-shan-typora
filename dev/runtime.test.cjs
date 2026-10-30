'use strict';
// Only run against disposable synthetic vault. Never connects to the user's instance.
const assert = require('node:assert/strict');
const { test } = require('node:test');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || '/Users/laity/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');

test('live obsidian runtime cdp test', async (t) => {
  let b;
  try {
    b = await chromium.connectOverCDP('http://127.0.0.1:19351');
  } catch (err) {
    if (err && (err.code === 'ECONNREFUSED' || String(err).includes('ECONNREFUSED'))) {
      t.skip('Obsidian CDP port 19351 not running (skipping live runtime test)');
      return;
    }
    throw err;
  }
  try {
    const p = b.contexts().flatMap(c => c.pages()).find(p => p.url().startsWith('app://obsidian.md/'));
    assert.ok(p);
    assert.equal(await p.evaluate(() => app.vault.adapter.basePath), '/tmp/qs-optimize-vault-20261029');
    await p.setViewportSize({ width: 1440, height: 1000 });
    await p.evaluate(async () => {
      await app.plugins.enablePlugin('qing-shan-typora');
      await app.workspace.getLeaf(false).openFile(app.vault.getAbstractFileByPath('虚构排版测试.md'));
      app.workspace.leftSplit.collapse();
      app.workspace.rightSplit.collapse();
    });
    await p.waitForFunction(() => !!app.plugins.plugins['qing-shan-typora']);
    for (const mode of ['preview', 'source']) {
      await p.evaluate(async mode => {
        await app.workspace.activeLeaf.setViewState({ type: 'markdown', state: { file: '虚构排版测试.md', mode, source: false } });
      }, mode);
      await p.waitForTimeout(300);
      for (const width of [480, 800, 1000]) {
        await p.evaluate(width => app.plugins.plugins['qing-shan-typora'].updateSettings({ widthMode: 'fixed', contentWidth: width }), width);
        await p.waitForTimeout(100);
        const actual = await p.locator(mode === 'preview' ? '.markdown-reading-view > .markdown-preview-view > .markdown-preview-sizer' : '.is-live-preview > .cm-editor > .cm-scroller > .cm-sizer').evaluate(x => x.getBoundingClientRect().width);
        assert.ok(Math.abs(actual - width) < 2, `${mode} expected ${width}, got ${actual}`);
      }
      await p.evaluate(() => app.plugins.plugins['qing-shan-typora'].updateSettings({ widthMode: 'full' }));
      const actual = await p.locator(mode === 'preview' ? '.markdown-reading-view > .markdown-preview-view > .markdown-preview-sizer' : '.is-live-preview > .cm-editor > .cm-scroller > .cm-sizer').evaluate(x => x.getBoundingClientRect().width);
      assert.ok(actual > 1000);
      console.log('PASS widths and full-width', mode);
    }
    await p.evaluate(() => app.plugins.plugins['qing-shan-typora'].updateSettings({ widthMode: 'fixed', contentWidth: 480, whiteShell: false, hideInlineTitle: false }));
    const table = await p.locator('.cm-table-widget .table-wrapper').first().evaluate(x => {
      x.scrollLeft = 100;
      return { overflow: getComputedStyle(x).overflowX, scroll: x.scrollLeft, width: x.clientWidth, table: x.querySelector('table').getBoundingClientRect().width };
    });
    console.log('table', table);
    assert.equal(table.overflow, 'auto');
    assert.ok(table.scroll > 0);
    await p.locator('.cm-table-widget .table-wrapper').first().evaluate(x => x.scrollLeft = 0);
    await p.locator('.is-live-preview .table-cell-wrapper').first().scrollIntoViewIfNeeded();
    for (const type of ['col', 'row']) {
      const handle = p.locator('.is-live-preview .table-' + type + '-drag-handle').first();
      const r = await handle.boundingBox();
      await p.mouse.move(r.x + r.width / 2, r.y + r.height / 2);
      await p.waitForTimeout(200);
      assert.ok(await handle.evaluate(x => {
        const r = x.getBoundingClientRect(), hit = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
        return x === hit || x.contains(hit);
      }), type + ' drag handle must receive pointer');
    }
    console.log('PASS row and column handle hit tests');
    await p.evaluate(() => app.plugins.plugins['qing-shan-typora'].updateSettings({ hideInlineTitle: true }));
    assert.equal(await p.locator('.is-live-preview > .cm-editor > .cm-scroller > .cm-sizer > .inline-title').evaluate(x => getComputedStyle(x).display), 'none');
    await p.evaluate(() => app.plugins.plugins['qing-shan-typora'].updateSettings({ hideInlineTitle: false }));
    assert.notEqual(await p.locator('.is-live-preview > .cm-editor > .cm-scroller > .cm-sizer > .inline-title').evaluate(x => getComputedStyle(x).display), 'none');
    await p.evaluate(() => { app.setting.open(); app.setting.openTabById('qing-shan-typora'); });
    await p.waitForTimeout(300);
    const settings = b.contexts().flatMap(c => c.pages()).find(x => x.url() === 'about:blank') || p;
    const panel = (await settings.locator('.setting-item').count()) ? settings : p;
    console.log('settings rows', await panel.locator('.setting-item-name').allTextContents());
    const widthMode = panel.locator('.setting-item').filter({ has: panel.locator('.setting-item-name', { hasText: '正文宽度' }) });
    await widthMode.locator('select:not(.is-measuring)').selectOption('typora');
    await p.waitForTimeout(200);
    const widthRow = panel.locator('.setting-item').filter({ has: panel.locator('.setting-item-name', { hasText: '正文最大宽度' }) });
    assert.ok(await widthRow.locator('input[type=range]').isDisabled());
    await p.evaluate(() => app.setting.close());
    await p.setViewportSize({ width: 600, height: 900 });
    await p.waitForTimeout(200);
    assert.equal(await p.locator('.is-live-preview > .cm-editor > .cm-scroller').evaluate(x => getComputedStyle(x).paddingLeft), '18px');
    await p.screenshot({ path: '/tmp/qs-optimized-live.png' });
    await p.evaluate(() => app.plugins.plugins['qing-shan-typora'].updateSettings({ enabled: false }));
    assert.equal(await p.evaluate(() => [...document.body.classList].some(x => x.startsWith('qs-typora-'))), false);
    await p.evaluate(() => app.plugins.plugins['qing-shan-typora'].resetSettings());
    console.log('PASS table scroll, title toggle, settings panel, narrow layout, disabled cleanup');
  } finally {
    if (b) await b.close();
  }
});

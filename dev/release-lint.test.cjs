const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
test('release description omits the redundant host name', () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(root, 'manifest.json'), 'utf8'));
  assert.doesNotMatch(manifest.description, /obsidian/i);
});
test('CSS only overrides the forced Minimal gutter position', () => {
  const css = fs.readFileSync(path.join(root, 'styles.css'), 'utf8');
  const exceptions = css.match(/[^{}]+\{[^{}]*!\s*important[^{}]*\}/gi) || [];
  assert.equal(exceptions.length, 1);
  assert.match(exceptions[0], /is-live-preview\s+\.cm-contentContainer\s*>\s*\.cm-gutters\s*\{\s*position:\s*static\s*!important;\s*\}/);
});
test('relational selectors are limited to direct media children in opt-in indent rules', () => {
  const css = fs.readFileSync(path.join(root, 'styles.css'), 'utf8');
  for (const line of css.split('\n').filter(line => line.includes(':has('))) {
    if (!line.includes('body.qs-typora-enabled.qs-typora-indent')) {
      // The home footer uses :has() only to find the paragraph before a callout/footer.
      assert.ok(line.includes('.qs-home .el-p:has(+ .el-div)') || line.includes('.qs-home .el-p:has(+ .mod-footer)'), line);
      continue;
    }
    const matches = [...line.matchAll(/:has\(([^)]*)\)/g)];
    assert.equal(matches.length, 1);
    for (const selector of matches[0][1].split(',')) assert.ok(selector.trim().startsWith('> '));
  }
});

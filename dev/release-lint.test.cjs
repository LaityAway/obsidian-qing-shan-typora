const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
test('release description omits the redundant host name', () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(root, 'manifest.json'), 'utf8'));
  assert.doesNotMatch(manifest.description, /obsidian/i);
});
test('CSS uses normal cascade instead of important declarations', () => {
  assert.doesNotMatch(fs.readFileSync(path.join(root, 'styles.css'), 'utf8'), /!\s*important\b/i);
});
test('relational selectors are limited to direct media children in opt-in indent rules', () => {
  const css = fs.readFileSync(path.join(root, 'styles.css'), 'utf8');
  for (const line of css.split('\n').filter(line => line.includes(':has('))) {
    assert.ok(line.includes('body.qs-typora-enabled.qs-typora-indent'));
    const matches = [...line.matchAll(/:has\(([^)]*)\)/g)];
    assert.equal(matches.length, 1);
    for (const selector of matches[0][1].split(',')) assert.ok(selector.trim().startsWith('> '));
  }
});

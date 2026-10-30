'use strict';

const { Plugin, PluginSettingTab, Setting, Notice } = require('obsidian');

// App-scoped queue survives plugin module reloads without touching note data.
const WRITE_STATE = Symbol.for('qing-shan-typora.settings-writes');

const WIDTH_MODES = Object.freeze(['typora', 'fixed', 'full']);
const CODE_FONTS = Object.freeze(['typora', 'system']);
const MONO_VARIABLE = '--qs-typora-system-mono';
const DEFAULTS = Object.freeze({
  enabled: true,
  fontSize: 16,
  widthMode: 'typora',
  contentWidth: 800,
  lineHeight: 1.6,
  whiteShell: true,
  hideInlineTitle: true,
  highContrast: false,
  codeFont: 'typora',
});
const CLASSES = [
  'qs-typora-enabled',
  'qs-typora-white-shell',
  'qs-typora-hide-title',
  'qs-typora-contrast',
  'qs-typora-code-system',
  ...WIDTH_MODES.map(mode => `qs-typora-width-${mode}`),
];
const VARIABLES = ['--qs-typora-font-size', '--qs-typora-width', '--qs-typora-line-height'];

function normalizeSettings(value) {
  const data = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  const number = (key, min, max, step) => {
    const raw = data[key];
    if (typeof raw !== 'number' || !Number.isFinite(raw)) return DEFAULTS[key];
    return Number((Math.round(Math.min(max, Math.max(min, raw)) / step) * step).toFixed(2));
  };
  const boolean = key => (typeof data[key] === 'boolean' ? data[key] : DEFAULTS[key]);
  // 0.2.x stored a fullWidth boolean; map it before falling back to the Typora scale.
  let widthMode = DEFAULTS.widthMode;
  if (WIDTH_MODES.includes(data.widthMode)) widthMode = data.widthMode;
  else if (typeof data.fullWidth === 'boolean') widthMode = data.fullWidth ? 'full' : 'fixed';
  return {
    enabled: boolean('enabled'),
    fontSize: number('fontSize', 14, 22, 1),
    widthMode,
    contentWidth: number('contentWidth', 480, 1200, 20),
    lineHeight: number('lineHeight', 1.4, 2.2, 0.1),
    whiteShell: boolean('whiteShell'),
    hideInlineTitle: boolean('hideInlineTitle'),
    highContrast: boolean('highContrast'),
    codeFont: CODE_FONTS.includes(data.codeFont) ? data.codeFont : DEFAULTS.codeFont,
  };
}

class TyporaSettingsTab extends PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display() {
    const { containerEl } = this;
    const plugin = this.plugin;
    containerEl.empty();
    containerEl.createEl('p', {
      text: '默认按 Typora 1.13.8 的 github 主题取 860 / 1024 / 1200px 三档宽度、1.6 倍行距和 30px 内边距；深色模式使用 Typora night 配色。排版只作用于阅读视图与实时预览，不修改笔记原文。',
      cls: 'qs-typora-settings-description',
    });
    new Setting(containerEl).setName('启用正文排版')
      .setDesc('不会修改笔记原文。关闭后恢复当前主题和样式片段的效果。')
      .addToggle(toggle => toggle.setValue(plugin.settings.enabled).onChange(value => plugin.updateSettings({ enabled: value })));
    const toggle = (key, name, desc) => new Setting(containerEl)
      .setName(name).setDesc(desc).addToggle(control => control.setValue(plugin.settings[key]).onChange(value => plugin.updateSettings({ [key]: value })));
    new Setting(containerEl).setName('正文宽度')
      .setDesc('Typora 自适应：860px，窗口 ≥1400px 时 1024px，≥1800px 时 1200px。固定宽度使用下方滑块；全宽铺满可用区域。')
      .addDropdown(dropdown => dropdown
        .addOption('typora', 'Typora 自适应')
        .addOption('fixed', '固定宽度')
        .addOption('full', '全宽')
        .setValue(plugin.settings.widthMode)
        .onChange(async value => {
          await plugin.updateSettings({ widthMode: value });
          this.display();
        }));
    toggle('whiteShell', '整个界面统一底色', '默认开启。浅色下侧栏 #fafafa、正文 #ffffff；深色下侧栏 #2f3439、正文 #363b40。关闭后仅笔记正文使用 Typora 排版，其他区域跟随当前主题。');
    toggle('hideInlineTitle', '隐藏顶部文件名', '默认开启。开启后隐藏阅读视图与实时预览顶部的文件名；不检查正文或嵌入笔记中的标题。');
    new Setting(containerEl).setName('代码字体')
      .setDesc('Typora 使用 Lucida Console / Consolas / Courier；跟随 Obsidian 使用你设置的等宽字体。')
      .addDropdown(dropdown => dropdown
        .addOption('typora', 'Typora（Courier）')
        .addOption('system', '跟随 Obsidian')
        .setValue(plugin.settings.codeFont)
        .onChange(value => plugin.updateSettings({ codeFont: value })));
    toggle('highContrast', '增强对比度', '默认关闭。开启后链接、引用与元数据使用 AA 对比度色，偏离 Typora 原色。');
    const slider = (key, name, min, max, step, unit, detail, disabled = () => false) => {
      const row = new Setting(containerEl).setName(name);
      const describe = () => row.setDesc(`${plugin.settings[key]}${unit} · ${detail}`);
      describe();
      row.addSlider(control => control.setLimits(min, max, step).setValue(plugin.settings[key]).setDynamicTooltip().setDisabled(disabled())
        .onChange(async value => {
          const saving = plugin.updateSettings({ [key]: value });
          describe();
          await saving;
        }));
    };
    slider('fontSize', '正文字号', 14, 22, 1, ' px', '默认 16 px，与 Typora 一致');
    slider('contentWidth', '正文最大宽度', 480, 1200, 20, ' px', '仅固定宽度模式生效；默认 800 px，Typora 三档为 860 / 1024 / 1200 px', () => plugin.settings.widthMode !== 'fixed');
    slider('lineHeight', '行距', 1.4, 2.2, 0.1, ' 倍', '默认 1.6 倍，与 Typora 一致');
    new Setting(containerEl).setName('恢复默认')
      .setDesc('恢复 16 px 字号、1.6 倍行距、Typora 自适应宽度、界面浅色，并隐藏顶部文件名。')
      .addButton(button => button.setButtonText('恢复默认').onClick(async () => {
        await plugin.resetSettings();
        this.display();
      }));
    containerEl.createEl('p', {
      text: '提示：Typora 自适应按窗口宽度切换档位；固定宽度是上限，超宽表格可在表格内横向滚动。命令面板中可搜索“切换正文排版”。',
      cls: 'qs-typora-settings-description',
    });
  }
}

module.exports = class QingShanTyporaPlugin extends Plugin {
  async onload() {
    this.documents = new Set();
    this.appliedSettings = new WeakMap();
    this.saveFailed = false;
    this.active = true;
    this.writeState = this.app[WRITE_STATE] ??= { tail: Promise.resolve() };
    this.writeQueue = this.writeState.tail;
    await this.writeQueue;
    try {
      this.settings = normalizeSettings(await this.loadData());
    } catch {
      this.saveFailed = true;
      this.settings = { ...DEFAULTS };
      new Notice('Typora 正文排版：设置读取失败，本次使用默认值。');
    }
    if (!this.active) return;
    this.addSettingTab(new TyporaSettingsTab(this.app, this));
    this.addCommand({
      id: 'toggle-typora-typography',
      name: '切换正文排版',
      callback: async () => {
        await this.updateSettings({ enabled: !this.settings.enabled });
        new Notice(this.settings.enabled ? 'Typora 正文排版已开启（仅浅色模式生效）' : 'Typora 正文排版已关闭');
      },
    });
    this.registerEvent(this.app.workspace.on('layout-change', () => this.applySettings()));
    this.registerEvent(this.app.workspace.on('window-open', workspaceWindow => {
      this.applyDocument(workspaceWindow.doc);
    }));
    this.registerEvent(this.app.workspace.on('window-close', workspaceWindow => {
      this.clearDocument(workspaceWindow.doc);
      this.documents.delete(workspaceWindow.doc);
    }));
    this.applySettings();
  }

  applyDocument(doc) {
    if (!doc || !doc.body) return;
    this.documents.add(doc);
    if (!this.settings.enabled) {
      this.clearDocument(doc);
      return;
    }
    const view = doc.defaultView;
    if (view) {
      const mono = view.getComputedStyle(doc.body).getPropertyValue('--font-monospace').trim();
      if (mono && doc.body.style.getPropertyValue(MONO_VARIABLE) !== mono) doc.body.style.setProperty(MONO_VARIABLE, mono);
    }
    const signature = JSON.stringify(this.settings);
    const applied = this.appliedSettings.get(doc) === signature;
    // A theme, snippet or another plugin can replace body classes; re-assert them.
    const expected = new Set(['qs-typora-enabled', `qs-typora-width-${this.settings.widthMode}`]);
    if (this.settings.whiteShell) expected.add('qs-typora-white-shell');
    if (this.settings.hideInlineTitle) expected.add('qs-typora-hide-title');
    if (this.settings.highContrast) expected.add('qs-typora-contrast');
    if (this.settings.codeFont === 'system') expected.add('qs-typora-code-system');
    const classesIntact = CLASSES.every(name => doc.body.classList.contains(name) === expected.has(name));
    if (applied && classesIntact && doc.body.style.getPropertyValue(VARIABLES[0])) return;
    doc.body.classList.toggle('qs-typora-enabled', true);
    doc.body.classList.toggle('qs-typora-white-shell', this.settings.whiteShell);
    doc.body.classList.toggle('qs-typora-hide-title', this.settings.hideInlineTitle);
    doc.body.classList.toggle('qs-typora-contrast', this.settings.highContrast);
    doc.body.classList.toggle('qs-typora-code-system', this.settings.codeFont === 'system');
    for (const mode of WIDTH_MODES) {
      doc.body.classList.toggle(`qs-typora-width-${mode}`, this.settings.widthMode === mode);
    }
    doc.body.style.setProperty(VARIABLES[0], `${this.settings.fontSize}px`);
    doc.body.style.setProperty(VARIABLES[1], `${this.settings.contentWidth}px`);
    doc.body.style.setProperty(VARIABLES[2], String(this.settings.lineHeight));
    this.appliedSettings.set(doc, signature);
  }

  applySettings() {
    const docs = new Set([document]);
    this.app.workspace.iterateAllLeaves(leaf => {
      const doc = leaf?.view?.containerEl?.ownerDocument;
      if (doc) docs.add(doc);
    });
    for (const doc of docs) this.applyDocument(doc);
  }

  clearDocument(doc) {
    if (!doc || !doc.body) return;
    for (const name of CLASSES) doc.body.classList.remove(name);
    this.appliedSettings.delete(doc);
    for (const name of VARIABLES) doc.body.style.removeProperty(name);
    doc.body.style.removeProperty(MONO_VARIABLE);
  }

  updateSettings(patch) {
    if (!this.active) return this.writeQueue;
    const next = normalizeSettings({ ...this.settings, ...patch });
    if (!this.saveFailed && JSON.stringify(next) === JSON.stringify(this.settings)) return this.writeQueue;
    this.settings = next;
    this.applySettings();
    const snapshot = { ...this.settings };
    this.writeQueue = this.writeState.tail.then(async () => {
      await this.saveData(snapshot);
      this.saveFailed = false;
    }).catch(() => {
      this.saveFailed = true;
      new Notice('Typora 正文排版：设置保存失败，当前外观已更新，请检查磁盘后重试。');
    });
    this.writeState.tail = this.writeQueue;
    return this.writeQueue;
  }

  resetSettings() {
    return this.updateSettings(DEFAULTS);
  }

  onunload() {
    this.active = false;
    for (const doc of this.documents) this.clearDocument(doc);
    this.documents.clear();
  }
};
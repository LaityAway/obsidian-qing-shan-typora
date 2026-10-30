# Changelog 更新日志

All notable changes to the **Qing Shan Typography (青山 · Typora 正文排版)** plugin are documented in this file.

GitHub Releases 在线查看：[https://github.com/LaityAway/obsidian-qing-shan-typora/releases](https://github.com/LaityAway/obsidian-qing-shan-typora/releases)

---

## [0.4.8] - 2026-10-30

### 新增与优化
- **外观与主题高频同步 (`css-change`)**：在工作区注册了 `css-change` 事件。当用户在 Obsidian「外观」设置中切换浅色/深色模式或更改「等宽字体」时，排版变量与类名立即同步，无需等待文档重新分栏。
- **测试套件容错提升**：`dev/runtime.test.cjs` 增加了端口连通性检测，当外置 CDP 守护进程离线时优雅跳过（`t.skip`），确保本地与 CI `node --test dev/*.test.cjs` 自动化全量通过。
- **自动化测试**：新增 `css-change` 动态字体同步测试用例（总计 50 项测试，49 项通过，1 项自适应跳过，0 失败）。

---

## [0.4.7] - 2026-10-30

### 修复与优化
- **原生 PDF 导出居中修复**：为 `.print > .markdown-preview-view > .markdown-preview-sizer` 明确注入 `width: 100%; max-width: none;`，彻底消除原生 PDF 导出时可能产生的页面左右不对称空白。
- **嵌入笔记 (Transclusion) 打印样式隔离**：将嵌入块标题缩放范围拓展至 `.print` 打印容器，防止嵌套笔记在导出 PDF 时 H1 标题异常放大。
- **中文字体栈补全**：在打印样式中同步注入 `"PingFang SC", "Hiragino Sans GB", "Microsoft YaHei"` 中文字体回退栈。

---

## [0.4.6] - 2026-10-30

### 修复与优化
- **独立窗口 (Popout) 内存自动回收**：检测到已关闭/断开的独立窗口 (`defaultView === null`) 时自动从内存集合清除，杜绝长时间会话下的 DOM 引用泄漏。
- **多窗口设置广播**：在 `applySettings()` 时确保多窗口文档集合与所有分栏叶节点实时同步生效。
- **深色折叠块细节适配**：`<details>` 与 `<summary>` 边框在深色模式下自适应切换为 `--background-modifier-border` (`#474d54`)，避免轻微偏亮问题。
- **安全样式读取**：在获取 body 样式时增加更严苛的空值防护。

---

## [0.4.5] - 2026-10-30

### 修复与还原
- **正文自适应宽度全面复原**：解除此前过渡轻量化导致的宽度约束问题，精准重置 Obsidian `is-readable-line-width`（默认 700px）对内层容器的限制，完全恢复 Typora 响应式阶梯（860px / 1024px / 1200px）、固定宽度与全宽排版能力。
- **实时预览表格重置**：确保 Live Preview 表格内层单元格与文本严格对齐，同时保留拖拽手柄安全边距。
- **严格规范**：保持全量 0 `!important` 声明并通过自动化回归测试。

---

## [0.4.4] - 2026-10-30

### 规范与对比度优化
- **CSS 级联规范化**：移除所有 `!important` 声明，重构嵌套列表选择器特异性以符合 Obsidian 社区插件审查标准。
- **代码字体作用域精准化**：代码字体仅对渲染后的行内代码与代码块生效，严格保留正文与源码模式的默认文本字体。
- **AA 级对比度模式提升**：增强对比度模式下链接、引用块、已完成待办与元数据文本对比度达到 4.5:1。
- **关系选择器收敛**：严格将 `:has` 限制为可选首行缩进下的直接子媒体检测。

---

## [0.4.3] - 2026-10-30

### 社区规范审查
- 针对社区插件目录扫描告警，清理多余的非直接关系选择器。
- 规范 GitHub 发布产物流程。

---

## [0.4.2] - 2026-10-30

### 描述合规
- 移除 `manifest.json` 描述中的 "Obsidian" 宿主名称，符合社区插件目录上架规范。

---

## [0.4.1] - 2026-10-30

### 插件命名规范
- 将插件显示名称调整为 **Qing Shan Typography**，以符合社区插件目录英文主标题要求（中文名「青山 · Typora 正文排版」在 README 中保留）。

---

## [0.4.0] - 2026-10-30

### 首发正式版
- **三档自适应宽度**：按 Typora 1.13.8 规范自适应 860 / 1024 / 1200 px，支持固定宽度与全宽。
- **Typora 经典排版**：1.6 倍行距、层级标题、行内代码与代码块样式。
- **白天与黑夜配色**：完整移植 Typora github 白天主题与 night 黑夜主题配色方案。
- **统一浅色底色**：侧边栏 #fafafa 与白纸 #ffffff 统一风格。
- **Callout 语义适配**：自动继承 Obsidian callout 原生强调色，内容区保持正文色彩。
- **可选高级功能**：段落首行缩进 2em、代码字体跟随系统、AA 对比度增强、隐藏顶部文件名。

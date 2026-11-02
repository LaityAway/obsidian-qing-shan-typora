# Changelog 更新日志

All notable changes to the **Qing Shan Typography (青山 · Typora 正文排版)** plugin are documented in this file.

GitHub Releases 在线查看：[https://github.com/LaityAway/obsidian-qing-shan-typora/releases](https://github.com/LaityAway/obsidian-qing-shan-typora/releases)

---

## [Unreleased] - 2026-11-02

### 修复
- **实时预览图文混排**：限制图片 Markdown 匹配范围，避免两张图片之间有文字时被误判为纯图片；保留文件名含括号的单图识别。
- **媒体段落边界**：识别带链接的图片及多行纯媒体段落；图片后同段有文字时，实时预览与阅读视图使用一致的缩进，并在编辑时更新。
- **读取失败提示清理**：插件卸载时关闭持久提示；读取尚未结束就卸载时不再创建孤立提示。
- **图文混排首行缩进**：阅读、悬浮预览、打印和实时预览区分含文字的媒体段落与纯媒体段落，前者照常缩进，行内图片不再被误设为块级居中。
- **设置读取失败保护**：读取配置失败时本次会话暂停写入，显示持续提示；检查配置并重新加载插件后恢复，避免用默认值覆盖原配置。
- **实时预览首行缩进**：按编辑器文档标记段落首行，续行和空行不再重复缩进；编辑时同步更新，不改变笔记内容。
- **首页样式作用域**：首页 H1/H2、副标题引用块、链接栅格、页脚斜体与 Callout 现在只命中首页自己的 `.el-h1` / `.el-h2` / `.el-blockquote` / `.el-ul` / `.el-p` / `.el-div` section，并排除 `.markdown-embed` 与 `.callout` 内的后代。修复了嵌套列表/Callout 列表被改成网格、正文行内斜体被当成页脚、所有引用块都变成副标题、首页样式泄漏进嵌入笔记等问题。
- **首页列表分隔线**：去掉换行后落在页面左边缘的 `border-left`，改为 `margin-left:-1px` + `ul { overflow:hidden }`，只保留列与列之间的分隔线；单列和末行空单元格不再出现多余竖线或灰块，顶层列表的 `.list-bullet` 圆点也一并隐藏。
- **首页嵌入隔离**：嵌入规则不再因外层 `.qs-home` 而失效，首页内嵌笔记恢复 `--h1-size: 1.125em`、`padding: 0` 与正常列表排版。
- **PDF 页边距与图片**：`@page` 改为四边 16mm，`.print > .markdown-preview-view` 内边距归零；补充打印态独立图片居中/圆角、`--p-spacing: .8em` 与键帽阴影。左右边距不再依赖主题的 `--file-margins`。
- **统一底色与焦点**：纸色背景只作用于 `.workspace-split.mod-root`，侧栏大纲/反链恢复 `#fafafa`（深色 `#2f3439`）；`details > summary` 恢复可见的 `:focus-visible` 轮廓，并允许选中摘要文字。
- **文档更正**：0.4.5 条目中“保持全量 0 `!important`”的表述不准确；实际保留 1 处针对 Minimal gutter 的 `!important`。

### 测试
- 新增 `dev/home.test.cjs` 7 项合成测试：首页网格与嵌套/Callout 列表、行内 `em` 与副标题引用块、嵌入笔记隔离、页脚与 Callout、侧栏底色、PDF 16mm 页边距与图片、`details` 焦点。
- 更新 `dev/layout.test.cjs` 的画布夹具以匹配真实 `.workspace-split.mod-root` 结构，并更新 `dev/release-lint.test.cjs` 以允许首页页脚的 `:has(+ .el-div)` / `:has(+ .mod-footer)`。
- 首页修复时全量测试 90 项通过；本次推送前执行 `QS_REQUIRE_RUNTIME=1 node --test dev/*.test.cjs`，99 项通过、0 失败、0 跳过，包含隔离 Obsidian 1.14.5 运行时场景。

---

## [0.4.9] - 2026-10-31

### 修复与优化
- **PDF 导出字号、行距与标题比例同步**：`.print > .markdown-preview-view` 现继承用户设定的 `--qs-typora-font-size` 与 `--qs-typora-line-height`，且导出标题（`h1~h6`）改用相对单位 `em` 并排除 `.markdown-embed *`，随正文字号成比例缩放。
- **嵌入笔记（Transclusion）标题字号与下边框隔离**：为 `.markdown-embed .markdown-preview-view` 内的 `h1~h6` 显式绑定 `--h1-size ~ --h4-size`，并排除导出视图中外层 `h1/h2` 的底部分隔线泄漏到嵌入块内。
- **PDF 导出代码字体一致性**：在 `.print > .markdown-preview-view` 中注入 Typora 默认等宽字体栈，并支持 `qs-typora-code-system` 跟随系统/Obsidian 等宽字体，同时重置 `pre code` 内联样式。
- **行内公式与脚注字号相对化**：`.math-inline` / `.cm-inline-math` 与 `.footnotes` 由 `rem` 改为 `em`，随用户自定义字号及所在标题层级同步缩放。
- **系统等宽字体置空清理**：当用户在 Obsidian 外观设置中清空自定义等宽字体时，自动移除残留的 `--qs-typora-system-mono` 属性。

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

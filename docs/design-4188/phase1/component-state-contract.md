# 4188 组件状态契约

## 适用范围

本契约只适用于带有 `.lili-theme-4188` 祖先的界面。旧 C+ 页面在逐页迁移前继续消费旧令牌，禁止把 4188 数值全局覆盖到 `:root`。设计来源为 `prototypes/biu-discover-option2/src/styles.css`；源文件哈希必须先通过 `verify-source-lock.mjs`。

## 颜色角色

- 紫色 `action`：导航选择、主操作、筛选选择、通用焦点关联操作。
- 青色 `playback`：正在播放、播放进度、实时播放状态；不得用于普通选择。
- 粉色 `favorite`：仅表示喜欢/取消喜欢。
- 绿、黄、红：仅表示成功、警告、错误/危险，不能作为装饰色。
- `text-muted` 只用于辅助标签、索引和非正文；禁用内容使用 `text-disabled`，不可仅依赖颜色表达禁用。

## 状态矩阵

| 组件族 | 默认 | 悬停 | 聚焦 | 按下 | 选中/当前 | 禁用 | 加载 | 错误 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Button | action 或 surface-elevated | action-hover / action-soft | 2px focus，2px 外偏移 | `press-scale` + pressed surface | 不适用 | 降低文字和表面强调，移除指针反馈 | 保持尺寸，显示 spinner 并保留可访问名称 | error 只用于破坏性操作 |
| IconButton | 透明、secondary 文本 | action-hover-soft | 2px focus | scale(.92) | 普通状态用 action；播放状态用 playback；喜欢用 favorite | 不响应 hover/press，`aria-disabled` 同步 | 原位 spinner | 错误通过邻近反馈呈现 |
| NavItem | 透明、secondary 文本 | action-hover-soft | 2px focus | pressed surface | selection-bg + 左侧 3px action | muted 且不可点击 | 不适用 | 不适用 |
| Pill/Tab | elevated + border | action-soft | 2px focus | scale(.97) | action 实底 + primary 文本反色 | disabled | 保持宽度 | error 仅用于表单校验关联 |
| Search/Input | elevated + border | border 不变 | 内 2px action + 外 4px soft ring | pressed surface | 内容选择遵循系统选择语义 | disabled | 尾部 spinner | error border + 文本说明 |
| Card/Row | surface | elevated/hover | 2px focus（可操作卡片） | scale(.985) | 普通当前项 action；正在播放 playback | disabled | skeleton 保持最终几何 | 内联错误或 ErrorState |
| QueueRow | 透明 | surface-hover | 行内操作各自聚焦 | 轻微位移归零 | elevated + 左侧 3px playback | disabled | skeleton row | 保留条目并给重试入口 |
| Dialog/Drawer | elevated + scrim | 不适用 | 初始焦点进入、焦点圈闭 | 不适用 | 不适用 | 操作级禁用 | 内容 skeleton，不改变外框 | 顶部/字段级明确错误 |

## 交互与无障碍规则

1. 所有可键盘操作元素必须显示 `--lili-4188-focus` 焦点环；不得用 `outline: none` 后不补偿。
2. 选中、播放、喜欢、错误不得只靠颜色区分；同时使用图标、边线、文本或 `aria-*` 状态。
3. 加载态保持最终组件宽高，避免壳层和列表跳动；异步按钮保持原标签作为可访问名称。
4. `prefers-reduced-motion: reduce` 时三档时长归零，状态变化仍必须立即可见。
5. 禁用态不响应 hover/active，不进入业务提交路径；只读态与禁用态需分别建模。
6. 设计源未定义的状态先按本契约补全；若页面需要不同表现，必须先登记到 `phase0/deviation-log.md`。

## 验证入口

- 静态令牌契约：`node tools/design-4188/verify-tokens.mjs`
- 源文件未漂移：`node tools/design-4188/verify-source-lock.mjs`
- 字面色护栏：`node tools/design-fidelity/check-literals.mjs`
- 组件视觉核验：阶段 3 在 `/design-system` 逐项覆盖本表全部状态。

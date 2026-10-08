# 阶段 3：通用组件与交互状态

状态：已完成（2026-09-30）。

## 实施范围

- 将 `Button`、`IconButton`、`Pill`、`SegmentedControl`、`SearchField`、`Tag`、`ProgressBar` 接入 `--biu-4188-*` 语义令牌，同时保留原有 props 与事件边界。
- 将 `Dialog` 的宽度、圆角、表面、遮罩和阴影切换到 4188 弹层规则；仍由 HeroUI 负责焦点陷阱、Esc 和 aria-modal。
- 将 `PageState` 的 loading / empty / error 统一到 4188 视觉语言，保留 status / alert 语义。
- 在 `/design-system` 新增 4188 令牌展位与 default / hover / focus-visible / pressed / selected / disabled / loading / error 八态矩阵。
- loading 图形改用 Remix Icon，不再用 CSS 边框绘制图标。

## 兼容策略

- 没有删除旧组件或修改业务 handler；4188 样式通过 `.biu-theme-4188` 作用域覆盖。
- 旧 C+ 类仍作为迁移期适配层存在，阶段 4–7 的业务页只装配公共组件，不再复制相似样式。
- 本阶段没有新增 API、数据状态或业务规则。

## 验证

- `pnpm exec vitest run --exclude 'prototypes/**'`：43 个测试文件、458 项通过。
- ESLint、Stylelint、Prettier、字面色/越层引用检查通过。
- `BIU_WEB_ONLY=1 node node_modules/@rsbuild/core/bin/rsbuild.js build` 通过。
- 浏览器在 1280×720 下检查 `/design-system`；八态、键盘焦点、ARIA、禁用与加载语义均可见。
- 视觉证据与结论见 [`design-qa.md`](./design-qa.md)。

## 已知环境限制

- 不带排除项直接执行 `vitest run` 会把用户提供且未纳入主项目测试环境的 `prototypes/biu-discover-option2/tests/sites-worker.test.mjs` 收集进 JSDOM；其 `node:test` 无法被客户端环境打包。主项目测试使用 `--exclude 'prototypes/**'` 全部通过。
- 纯浏览器预览没有 Electron preload，控制台会出现既有 API/监听器桩错误；组件页本身可完整渲染，生产 Web build 与组件测试不受影响。

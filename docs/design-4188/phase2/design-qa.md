# 阶段 2 Design QA

- Source visual truth: `prototypes/biu-discover-option2/src/App.jsx`, `src/styles.css`, `docs/design-4188/phase2-reference.png`
- Implementation: `http://127.0.0.1:4190/`, `docs/design-4188/phase2-implementation.png`
- Comparison: `docs/design-4188/phase2-comparison.png`
- Viewport: 1280 × 720 CSS px; source and implementation images均为 1280 × 720，deviceScaleFactor 1，无密度缩放
- State: 深色主题、发现页、播放队列抽屉打开；实现侧业务 API 不可用，正文呈现既有 Network Error 状态

**Findings**

- 没有遗留的 P0/P1/P2 壳层差异。侧栏、顶栏、内容区、队列栏和播放器的区域比例与设计源一致；常驻控件没有横向溢出或相互覆盖。
- 字体与排版：壳层使用 Inter / Noto Sans SC / PingFang SC 回退链；品牌、导航、队列标题和辅助文字层级与设计源一致。
- 间距与布局节奏：220px 侧栏、80px 顶栏、100px 播放器、388px 队列均由 4188 几何令牌驱动。1280px 下抽屉覆盖内容，与设计源行为一致。
- 颜色与令牌：画布、表面、紫色选择、青色播放状态及边框全部消费阶段 1 语义令牌；未发现新增页面级字面颜色。
- 图像与图标：阶段 2 没有新增业务图像；壳层使用项目现有 Remix Icon，没有使用文本符号或手工 SVG 近似图标。账户无头像时使用现有文字回退机制，这是业务状态而非设计替换。
- 文案：导航、搜索占位、队列标题、空队列说明与设计源一致。账户文案因当前未登录状态合理不同。

**Open Questions**

- 正文内容因为本地浏览器无法访问 Electron 业务接口而显示 Network Error，不属于阶段 2 壳层范围；业务页面会在后续迁移阶段以固定 fixture 单独验收。

**Full-view comparison evidence**

- `phase2-comparison.png` 左侧为设计源，右侧为实现。两张截图在同一视口、同一抽屉状态下并排生成。
- 本阶段目标全部是四个大区域和响应式骨架，完整视图中这些区域均可清楚辨认，因此不需要额外局部裁切；组件级字号、状态和控件间距将在阶段 3 的 design-system 状态矩阵中做聚焦比较。

**Primary interactions tested**

- 点击播放器“队列”按钮可打开共享队列抽屉。
- 抽屉关闭按钮、完整队列页入口和空队列状态均可访问。
- 路由变化会自动收起抽屉，不保留遮挡状态。

**Comparison history**

- Pass 1：发现旧测试仍锁定 C+ 顶栏段导航与旧播放器类名；已将测试更新为 4188 壳层断点和三栏布局契约。
- Pass 2：同视口视觉对比未发现可执行的 P0/P1/P2 壳层问题，无需继续修图。

**Implementation Checklist**

- [x] 桌面、紧凑、移动三种导航形态
- [x] 顶栏、内容区、播放器独立网格区域
- [x] 队列抽屉与完整队列页共享业务数据
- [x] 键盘焦点与 reduced-motion 令牌
- [x] 构建、令牌护栏、单元测试和同视口视觉对比

**Follow-up Polish**

- 阶段 3 在 `/design-system` 展开所有通用组件状态；阶段 4 起再对正文业务页面逐页做固定数据截图回归。

final result: passed

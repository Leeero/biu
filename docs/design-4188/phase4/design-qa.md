# 阶段 4 Design QA

- source visual truth path: `prototypes/biu-discover-option2/src/App.jsx`, `Pages.jsx`, `styles.css`
- source screenshot: `docs/design-4188/phase4/source-discover.png`
- implementation screenshots: `implementation-queue.png`, `implementation-now-playing.png`
- viewport: 浏览器截图实际内容视口 1280 × 720 CSS px
- pixels / density: 源与实现均为 1280 × 720，deviceScaleFactor 1，无缩放归一化
- state: 深色主题；设计源为发现页 + 打开的队列抽屉；实现为队列夹具页、正在播放夹具页

## Findings

- 无剩余 P0/P1/P2。
- [P3] 夹具封面在 Web-only 截图中使用中性色块；真实业务路径继续显示接口/本地封面。该差异来自历史夹具不包含真实图片 URL，不影响业务呈现。
- [P3] 发现页的真实接口态无法稳定用于离线截图，视觉依据由设计源截图、实现组件结构及构建回归共同覆盖。

## Required fidelity surfaces

- 字体与排版：沿用 4188 全局字体令牌；36px 页面标题、紧凑的小字号状态信息与设计层级一致。
- 间距与布局：侧栏/顶栏/播放栏沿用阶段 2；队列行密度、双栏沉浸布局和底部控制区与源稿一致。
- 色彩与令牌：新增样式只消费 `--biu-4188-*` 语义令牌；紫色操作态和青色播放态分工一致。
- 图片质量：真实路径保留原封面 URL 与 `object-fit: cover`；没有生成或替换产品图片。
- 文案：保留现有功能文案；设计稿覆盖的“发现音乐 / 播放队列 / 正在播放 / 接下来播放”保持一致。

## Full-view comparison evidence

- 设计源与队列实现共同验证了 220px 侧栏、80px 顶栏、100px 播放栏、深蓝黑画布、当前项青色状态和紫色主操作。
- 正在播放实现验证了方形封面、歌词/队列切换、突出当前歌词、进度及三段式控制布局。

## Focused region evidence

- 队列当前行：左侧强调线、当前状态、时长和行操作已逐项核对。
- 沉浸页底部：首次截图发现控制区低于视口（P2），随后将页面锁定为 `100vh`、缩减垂直留白与封面尺寸；复验截图显示进度、传输控制、音量和队列入口完整可见。

## Interaction and console checks

- 核对：队列行播放/移除/排序入口、播放模式、歌词/队列切换、进度、上/下一首、静音和音量控件。
- Console：存在 Web-only 环境既有的 Electron listener cleanup 与 Bilibili `AxiosError`；没有发现由阶段 4 组件新增的渲染异常。
- 窄屏：390 × 844 捕获受上述 Web-only 启动问题阻塞；CSS 断点与阶段 2 壳层断点已保留，列裁剪规则通过代码审查。此项记为残余环境测试缺口，不是实现差异。

## Comparison history

1. P2：1280 × 720 首次沉浸页截图中，底部持久控制区落到视口外。
2. 修复：页面改为 `100vh` 且隐藏桌面溢出，缩减页边距、主区间距与封面上限；移动端恢复自然高度与滚动。
3. 复验：`implementation-now-playing.png` 中全部持久控制项可见，未引入横向溢出。

## Open questions / residual gaps

- 无需产品决策；窄屏浏览器截图待 Web-only shim 稳定后可补充自动化证据。

final result: passed

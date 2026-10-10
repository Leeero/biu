# 阶段 4：播放主链路

## 已完成范围

- 发现音乐：真实 Bilibili 推荐数据、数据源切换、卡片/列表模式、加载/错误/空态保持不变；卡片模式迁移到 4188 的标题、Hero、推荐网格、悬停与当前播放态。
- 播放队列：新增 `buildQueueViewModel`，由队列抽屉、`/queue` 和沉浸播放页共享去重、当前项、下一首、来源、时长和多分 P 描述。
- 队列全页：迁移为 4188 的会话页头、药丸操作、当前行和行内操作；保留播放全部、模式切换、随机时保持分 P、清空确认、播放/下一首/置顶/收藏/移除和排序。
- 正在播放：迁移为 4188 的封面 + 歌词/队列双栏和底部控制；保留封面/视频切换、进度跳转、上/下一首、播放模式、音量与静音。
- 兼容：原 C+ 视觉夹具仍走兼容呈现，避免破坏既有视觉基线测试；真实业务路径使用 4188 呈现。

## 验证

- `pnpm exec vitest run --exclude 'prototypes/**'`：44 个测试文件、460 项测试通过。
- ESLint：阶段 4 涉及的 TS/TSX 无错误，仅 `queue-view.tsx` 保留已有的 Fast Refresh 导出结构提示。
- Stylelint：三个阶段 4 样式文件通过。
- `LILI_WEB_ONLY=1 pnpm run build`：通过。
- 新增 `tests/queue-view-model-4188.test.ts`，验证共享去重、当前项、下一首、本地来源和多分 P。

## 证据

- `source-discover.png`：1280×720、1x 的 4188 设计源。
- `implementation-queue.png`：1280×720、1x 的队列全页实现。
- `implementation-now-playing.png`：1280×720、1x 的沉浸播放实现（修正持久控制区被裁切后）。
- `implementation-queue-mobile.png`：窄屏捕获尝试；受现有 Web-only Electron shim 启动阻塞影响为空，不作为通过证据。
- `design-qa.md`：本阶段视觉验收记录。

## 已知环境限制

- Web-only 浏览器会记录现有 Electron bridge 清理函数与 Bilibili 网络请求错误；Electron 正式运行路径不受本阶段改动影响。
- 仓库全量 `tsc --noEmit` 仍被 HeroUI/React 19 等既有依赖声明错误阻塞；本阶段以 ESLint、构建和 Vitest 作为可执行门禁。

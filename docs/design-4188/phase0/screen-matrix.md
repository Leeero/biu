# 4188 屏幕与状态矩阵

所有设计页面由 `App.jsx` 的壳层和 `Pages.jsx` 的 `PageRouter` 组合。页面不是 URL 路由；验收夹具必须通过确定性的状态注入或专用查询参数进入目标状态，不能依赖连续手点。

| ID | 设计状态 | 源文件入口 | 核心操作 | 必须冻结的状态 | 目标正式路由 |
| --- | --- | --- | --- | --- | --- |
| D01 | 发现音乐 | `App.jsx: active=discover` | 换一批、播放、稍后播放、推荐翻组 | 默认、加载、空搜索、播放中、队列开/关 | `/` |
| D02 | 我的音乐 | `Pages.jsx: Library` | 新建歌单、扫描本地、进入歌单 | 默认、卡片 hover/focus | `/library` |
| D03 | 播放列表详情 | `Pages.jsx: Playlist` | 全部播放、收藏、批量下载、选择、行操作 | 默认、当前行、选择、各弹窗 | `/collection/:id` |
| D04 | 稍后播放 | `Pages.jsx: Later` | 全部播放、类型筛选、搜索、行操作 | 全部/音乐视频/合集 | `/later` |
| D05 | 搜索结果 | `Pages.jsx: Search` | 综合/歌曲/创作者/播放列表 | 有结果、空结果、各分类、输入聚焦 | `/search` |
| D06 | 本地音乐 | `Pages.jsx: Local` | 添加目录、重新扫描、筛选、播放 | ready/loading/empty/error | `/local-music` |
| D07 | 下载管理 | `Pages.jsx: Downloads` | 新建下载、任务更多 | 下载/转换/完成/等待/失败 | `/download-list` |
| D08 | 播放队列页 | `Pages.jsx: Queue` | 模式、清空、播放、行操作 | 默认、当前项、空队列 | `/queue` |
| D09 | 观看历史 | `Pages.jsx: History` | 时间筛选、清空、行操作 | 全部/7 天/30 天/确认弹窗 | `/history` |
| D10 | 关注与动态 | `Pages.jsx: Social` | 创作者/动态、主页、关注 | 双 Tab、关注/已关注、登录门禁 | `/follow` |
| D11 | 创作者详情 | `Pages.jsx: Creator` | 关注、内容/歌单/动态、播放 | 三 Tab、关注态 | `/user/:id` |
| D12 | 设置 | `Pages.jsx: Settings` | 分类、开关、恢复默认、Mini 预览 | 常规/播放/下载/快捷键/高级/关于 | `/settings` |
| D13 | 正在播放 | `Pages.jsx: NowPlaying` | 歌词/队列、播放、进度、音量、下载 | 歌词、队列、喜欢、播放/暂停 | `/now-playing` |
| D14 | 迷你播放器 | `Pages.jsx: Mini` | 播放、下一首、队列、返回 | 播放/暂停、不同内容长度 | `/mini-player` |
| D15 | 队列抽屉 | `App.jsx: QueuePanel` | 拖排、删除、清空、关闭 | 满、空、当前项、窄屏覆盖 | 壳层浮层 |
| D16 | 通用弹窗 | `Pages.jsx: DemoModal` | 表单、选择、确认、重试、账户 | playlist/favorite/download/folder/confirm/error/track/account | 全局弹层 |
| D17 | 移动端壳层 | `styles.css: max-width 640px` | 顶部搜索、底部四入口、播放器 | 390×844、队列覆盖、内容滚动 | 全路由 |

## 状态命名约定

- `default`：数据已加载、无浮层。
- `loading`：原尺寸 skeleton，不能改变页面主要几何。
- `empty`：说明原因和下一步操作。
- `error`：错误原因、重试或重新选择。
- `selected/current`：选中导航、药丸、当前曲目、当前行。
- `modal-*`：弹窗类型名。
- `responsive-{width}x{height}`：固定视口。

## 已发现的源设计缺口

- 设置源文件当前只有五类，已确认目标必须增加独立第六类“关于”。这属于已批准的源文件待更新项，阶段 1 不得按五类固化组件契约。
- 搜索源页面展示“歌曲/播放列表”，实现时按已确认业务口径映射，不得新增远程 API。
- 当前源文件仍写有“跟随系统深色模式”开关；目标已确认仅保留深色主题。该开关不进入正式实现。


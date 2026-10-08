# 设计—功能—目标实现映射

| 设计状态 | 当前代码能力 | 目标实现与约束 | 主要生产文件 |
| --- | --- | --- | --- |
| 全局壳层 | 现有 C+ 顶栏壳层、路由契约、播放器 | 改为 220/78/0 三态导航；保持路由、返回前进和播放不中断 | `src/app/shell/*`、`src/layout/*`、`src/layout/route-shell.ts` |
| 顶部搜索 | 搜索历史、`/search`、视频/用户 API | Enter 导航；歌曲=视频；播放列表=现有资产聚合 | `src/pages/search/*`、`src/features/search/*`、`src/store/search-history.ts` |
| 播放器 | 播放/进度/音量/模式/歌词/系统控制 | 只重排 UI，不改 store 和播放规则 | `src/features/player/*`、`src/store/play-list.ts`、`src/store/play-progress.ts` |
| 队列抽屉与页面 | `/queue`、队列 store、去重与分 P | 双形态保留，共享 selector/ViewModel，不建第二状态源 | `src/pages/queue`、`src/features/player/queue*` |
| 音乐库 | 收藏 store、收藏夹/合集/系列、本地资产 | 按设计网格与统计重排；所有来源继续可达 | `src/pages/library`、`src/store/favorite.ts` |
| 列表详情 | 三集合 adapter、capability、批量动作 | 统一视觉；权限决定操作，不因设计未展示而删除 | `src/pages/video-collection`、playlist features |
| 稍后播放 | B 站稍后再看、分页、搜索 | 采用设计筛选/表格；保留真实数据逻辑 | `src/pages/later`、`src/features/later/*` |
| 本地音乐 | 目录扫描、筛选、删除目录、Track adapter | 保留 empty/loading/error；无封面继续格式降级 | `src/pages/local-music`、`src/features/local-music/*` |
| 下载 | 完整 Electron IPC 状态机 | 采用任务卡；暂停/继续/重试/取消/定位进入统一菜单 | `src/pages/download-list`、`src/features/downloads/*`、`electron/ipc/download.ts` |
| 历史 | B 站历史 API、删除/清空、筛选 | 采用三档时间筛选；保留搜索和分页 | `src/pages/history` |
| 关注/创作者 | 关注、动态、创作者内容、登录门禁 | 采用卡片和双/三 Tab；不改 API 语义 | `src/pages/social`、`src/pages/user-profile` |
| 设置 | 六类设置、代理、快捷键、导入导出、更新 | 第六类“关于”；本轮单一深色；旧主题字段读取后归一 | `src/pages/settings/*`、`src/store/settings.ts` |
| 沉浸/迷你 | 正在播放页、歌词、独立窗口、系统媒体键 | 按源文件布局；真实 Electron 单独验收 | `src/pages/now-playing`、`src/pages/mini-player`、`electron/*` |
| 通用弹窗 | 收藏、确认、下载、发布说明、登录、图片裁剪 | 复用同一 Dialog/Menu/Toast 状态语言 | `src/components/*modal*`、`src/store/modal/*` |

## 功能边界锁

- 不修改 `src/service/` 请求语义。
- 不修改下载状态字符串和 IPC 契约。
- 不修改播放持久化、登录态、用户设置的既有存储键格式；主题旧值只做兼容归一。
- 不新增远程歌曲或播放列表搜索接口。
- 所有设计未展示的现有功能必须在页面、菜单或弹窗中保留入口。


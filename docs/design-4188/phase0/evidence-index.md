# 阶段 0 视觉证据索引

## 本轮浏览器核验

本轮使用 Codex 内置浏览器直接打开源文件驱动的 4188 运行时，检查并接受了以下状态：

1. 发现音乐 + 队列抽屉，默认浏览器视口。
2. 1440×1024：标准侧栏、三列壳层、388px 队列、100px 播放器。
3. 1024×768：220px 侧栏、380px 固定覆盖队列。
4. 720×900：78px 图标侧栏、390px 固定覆盖队列。
5. 390×844：无侧栏、68px 顶栏、52px 移动导航、124px 播放器。

计算样式和几何已写入 `measurements.json`。浏览器截图在本轮工具记录中可见；长期复现以源文件和下列源目录内的持久化截图为准。

## 源目录已有持久化截图

| 文件 | 尺寸 | 用途 |
| --- | --- | --- |
| `prototypes/biu-discover-option2/implementation-1440x1024-v2.png` | 1440×1024 | 桌面发现页基线 |
| `prototypes/biu-discover-option2/implementation-visual-polish-1440x1024.png` | 1440×1024 | 视觉完善后的桌面壳层 |
| `prototypes/biu-discover-option2/implementation-night-voyage-theme.png` | 1367×1354 | 深色主题与完整纵向页面 |
| `prototypes/biu-discover-option2/implementation-night-voyage-search.png` | 1367×1354 | 搜索状态 |
| `prototypes/biu-discover-option2/implementation-night-voyage-favorite.png` | 1367×1354 | 收藏弹窗状态 |
| `prototypes/biu-discover-option2/implementation-visual-polish-01.png` | 1367×1354 | 交互完善状态 1 |
| `prototypes/biu-discover-option2/implementation-visual-polish-02.png` | 1367×1354 | 交互完善状态 2 |
| `prototypes/biu-discover-option2/implementation-visual-polish-search.png` | 1367×1354 | 搜索交互完善状态 |
| `prototypes/biu-discover-option2/public/reference/selected-option-2.png` | 1487×1058 | 最初选定方向，只作来源历史 |

## 使用限制

- 已有截图不是所有页面的完整截图集；页面验收仍以源文件重放目标状态后生成的新截图为准。
- `selected-option-2.png` 早于当前源码，只能解释方向，不能覆盖当前源码。
- 动效、键盘、ARIA、系统窗口和真实数据行为不能由截图证明，必须单独测试。


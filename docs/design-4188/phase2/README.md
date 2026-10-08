# 阶段 2：基础壳层与响应式

## 已实现

- 220px 桌面侧栏、78px 紧凑侧栏，以及 640px 以下隐藏侧栏的移动模式。
- 80px 桌面顶栏、68px 移动顶栏；保留历史导航、全局搜索、账户菜单和窗口操作。
- 100px 桌面播放器、124px 移动播放器；保留播放、进度、音量、倍速、下载及沉浸入口。
- 388px 桌面队列栏；1380px 以下转为 380px 覆盖抽屉，移动端为全宽抽屉。
- `/queue` 完整页面与队列抽屉共享 `usePlayList` 数据，抽屉只拥有开关状态。
- 640px 以下提供 52px 移动端主导航。

## 视觉证据

- 设计稿：[`phase2-reference.png`](../phase2-reference.png)
- 当前实现：[`phase2-implementation.png`](../phase2-implementation.png)
- 同视口并排对比：[`phase2-comparison.png`](../phase2-comparison.png)
- 视口：1280 × 720 CSS px，设备像素比 1；状态为深色主题、队列抽屉打开。

当前实现截图中的正文网络错误来自本地浏览器无法访问桌面应用业务接口；本阶段只验收壳层，错误态没有突破内容区或遮挡常驻控件。

## 回退边界

本阶段没有修改播放队列、搜索、账户、路由或播放器业务 store。若需回退，只需撤销 `shell4188`、Sidebar、MobileNav、QueueDrawer 的装配及样式；原页面和业务数据层不受影响。

import { PageState } from "@/ui/states/page-state";

/**
 * 页面级错误兜底（内容区）。
 *
 * 与 `components/error-fallback`（整页兜底）的分工：整页兜底留给**应用级**边界，
 * 只在壳层自己都崩了时出现；页面级边界只包住路由内容，所以兜底也必须是
 * **内容区尺寸**的一块，不能是 `h-screen`。
 *
 * 为什么要有这一层（2026-10-10 的事故）：此前唯一的错误边界包着
 * `<AppShell>` 加全部弹层（含登录宿主）。任何一个页面报错——实测最典型的是
 * 懒加载 chunk 读不到（`ChunkLoadError`，应用运行中产物被清理就会触发）——
 * 都会把侧栏、账户卡、播放栏、登录弹窗宿主**一起卸载**，屏幕上只剩「反馈 /
 * 回到首页」，用户既没有出口也登录不了。下沉到内容区后，页面挂掉只影响
 * `<Outlet />` 那一块，壳层照常可用。
 *
 * 动作为什么是**整窗重载**而不是 `resetErrorBoundary`（重试渲染）：实测
 * （2026-10-10，Electron 38 真机 + 拦截 chunk 复现）——`React.lazy` 会把
 * 首次失败的 rejection **永久缓存**在该 payload 上，之后无论 chunk 是否恢复，
 * 重渲染都只会再抛同一个错。也就是「重试」对 chunk 失败这条主路径是无效的，
 * 点了没有任何变化。整窗重载会把 `index.tsx` 与全部懒加载 payload 重新求值，
 * 是唯一能真正恢复的动作；代价只是丢掉当前渲染进程状态（播放进度本来就会
 * 持久化）。想避免重载的用户，出口是左侧导航——壳层活着，那条路一直在。
 *
 * 组件刻意不接 `FallbackProps`：`resetErrorBoundary` 在上面那条主路径上是无效
 * 动作，摆在这里只会诱使后来者把它接回按钮上。
 */
const ContentFallback = () => (
  <PageState
    kind="error"
    className="h-full"
    title="页面加载失败"
    description="这个页面没能加载出来。可以重新加载应用，或从左侧导航切换到其他页面。"
    actionLabel="重新加载应用"
    onAction={() => window.location.reload()}
  />
);

export default ContentFallback;

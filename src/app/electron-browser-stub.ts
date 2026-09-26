/**
 * 浏览器模式的 Electron 桥接桩。
 *
 * 为什么需要：应用运行在 Electron 里时 preload 注入 `window.electron`；
 * 但保真度比对（verify.py --target app）与浏览器 dev 都是无 preload 的
 * 纯网页，store 的 zustand persist 在**模块初始化**时就调用
 * `window.electron.getStore(...)` —— 没有桥接直接 TypeError，整页白屏。
 *
 * 这是 fixtures/README.md 契约 4 说的「mock 层」：
 *   · 桩只做**安全空实现**：所有方法默认解析为 undefined（persist 拿不到
 *     存储值就回落到代码里的默认设置 —— 这正是浏览器模式想要的）；
 *     返回列表的方法给空数组；事件订阅返回退订函数。
 *   · 用 Proxy 兜住全部方法名，而不是逐个枚举：boot 路径之外（托盘、
 *     快捷键、窗口控制……）偶发的调用也不至于崩，代价是这些能力在
 *     浏览器里不可用 —— 它们本来就不存在。
 *   · **Electron 里不生效**：preload 已注入真实的 `window.electron`，
 *     条件判断使桩永远不会被安装。
 *
 * 关键时序约束：本模块**在 import 时立即自安装**，而不是导出一个函数让
 * 调用方手动调用。因为 `src/index.tsx` 里 `import { App }` 会**先于**任何
 * 后续语句执行（ESM import 提升），App 及其静态导入的 store/zustand 模块
 * 在求值阶段就调用 `window.electron.getStore(...)`。若安装动作放在 App
 * 导入之后，求值时桥接尚未就位，persist 依旧抛错导致整页白屏。
 * 因此调用方只需 `import "./app/electron-browser-stub";` 且**必须把它放在
 * `import { App }` 之前**，靠模块副作用完成安装。
 */
const installBrowserElectronStub = () => {
  if (typeof window === "undefined" || window.electron) return;

  const asyncUndefined = () => Promise.resolve(undefined);
  const asyncEmptyList = () => Promise.resolve([]);

  /** 返回值会被调用方**直接消费**的方法，单独给形。其余一律解析为 undefined。 */
  const specific: Record<string, () => unknown> = {
    getMediaDownloadTaskList: asyncEmptyList,
    listLocalMusic: asyncEmptyList,
    scanLocalMusic: asyncEmptyList,
    getShortcuts: asyncEmptyList,
    syncMediaDownloadTaskList: () => () => undefined,
    onWindowFullScreenChange: () => () => undefined,
  };

  const stub = new Proxy(
    {},
    {
      get: (_target, property: string) => specific[property] ?? asyncUndefined,
    },
  );

  Object.defineProperty(window, "electron", {
    value: stub,
    writable: false,
    configurable: false,
  });
};

// 模块副作用：导入即安装，确保在任何 store 模块求值之前就位。
installBrowserElectronStub();

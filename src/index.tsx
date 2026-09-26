import { createRoot } from "react-dom/client";
import { HashRouter } from "react-router";

// 浏览器模式（保真度比对 / 浏览器 dev）没有 preload。这个副作用导入必须在
// `import { App }` **之前**：App 及其 store 模块在求值阶段就会调用
// `window.electron`，桥接桩靠模块副作用自安装，晚了会白屏。
// sort-imports 只看字母序不懂模块求值顺序 —— 这里的先后是运行时正确性，不是风格。
import "./app/electron-browser-stub";
// eslint-disable-next-line perfectionist/sort-imports
import { App } from "./app";

const root = createRoot(document.getElementById("root") as Element);
root.render(
  <HashRouter>
    <App />
  </HashRouter>,
);

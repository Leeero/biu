# 4188 设计基线

本目录保存以 `prototypes/biu-discover-option2` 源文件为真值的重构基线。

## 真值优先级

1. `prototypes/biu-discover-option2/src/App.jsx`
2. `prototypes/biu-discover-option2/src/Pages.jsx`
3. `prototypes/biu-discover-option2/src/styles.css`
4. `prototypes/biu-discover-option2/public/assets/`
5. 本目录中由上述源文件提取的哈希、测量、屏幕矩阵和截图索引
6. `http://127.0.0.1:4188/` 仅作为本轮检查入口，不是长期真值

仓库原 `docs/design/` 是上一版 C+ 方案的历史资料，不得用于 4188 重构的视觉验收。

## 阶段 0 产物

- [`phase0/source-lock.json`](./phase0/source-lock.json)：源文件和核心资源 SHA-256 锁。
- [`phase0/measurements.json`](./phase0/measurements.json)：四档视口与全局几何实测。
- [`phase0/screen-matrix.md`](./phase0/screen-matrix.md)：页面、状态、操作和源文件落点。
- [`phase0/function-map.md`](./phase0/function-map.md)：设计页面—现有功能—目标实现映射。
- [`phase0/evidence-index.md`](./phase0/evidence-index.md)：持久化视觉证据与本轮浏览器核验记录。
- [`phase0/deviation-log.md`](./phase0/deviation-log.md)：已知冲突、决定与后续偏差模板。
- [`phase0/verification-protocol.md`](./phase0/verification-protocol.md)：后续阶段统一验收协议。

## 阶段状态

- 阶段 0：已完成。若源文件哈希变化，必须先更新本目录、重新检查受影响页面，并在偏差登记中记录变更原因。
- 阶段 1：已完成。令牌真值见 [`phase1/tokens.json`](./phase1/tokens.json)，状态规则见 [`phase1/component-state-contract.md`](./phase1/component-state-contract.md)。
- 阶段 2：已完成。壳层实现、视觉证据与 QA 结果见 [`phase2/README.md`](./phase2/README.md) 和 [`phase2/design-qa.md`](./phase2/design-qa.md)。
- 阶段 3：已完成。通用组件、八态合同、测试与 QA 结果见 [`phase3/README.md`](./phase3/README.md) 和 [`phase3/design-qa.md`](./phase3/design-qa.md)。

# Biu 2.0 · C+ 视觉重构文档

本目录是 C+ 视觉重构的**唯一真值与施工依据**。按顺序读：

| 文件 | 作用 | 何时读 |
| --- | --- | --- |
| [`biu-cplus-refactor-plan.md`](./biu-cplus-refactor-plan.md) | 总方案：决策、目标、壳层、令牌、组件、分阶段、验收、风险 | 开工前通读一遍 |
| [`cplus-spec-lock.json`](./cplus-spec-lock.json) | **机器可读真值**：色板、排版、材质、几何、容差、12 屏锚点、顶栏分段、文案红线、原型基线 | 改任何视觉数值前必读 |
| [`cplus-screen-matrix.md`](./cplus-screen-matrix.md) | 12 屏逐屏施工契约：目标路由、复刻要点、能力对齐表、收工检查表 | 每屏开工前读该屏一节 |
| [`cplus-token-bridge.md`](./cplus-token-bridge.md) | 三层令牌映射表（原型 `--c-*` ↔ 语义 `--biu-*`） | 写样式前必读 |
| [`evidence/prototype-baseline.txt`](./evidence/prototype-baseline.txt) | 参考原型的保真度实测报告 | 需要知道每屏起点时 |

工具在 [`../../tools/design-fidelity/`](../../tools/design-fidelity/README.md)：

```bash
pnpm verify:literals                      # 令牌护栏（三层边界）
pnpm verify:literals -- --list            # 存量违规清单与清理阶段
pnpm verify:fidelity --all                # 12 屏保真度校验
pnpm verify:fidelity --screen 01-library  # 单屏
pnpm exec vitest run tests/design-tokens.test.ts   # 令牌与真值逐项对照
pnpm verify:phase-drift                   # 阶段边界：遗留令牌相对基线只增不改
```

---

## 四条硬规则

1. **数值变更顺序**：先改 `cplus-spec-lock.json` → 再改实现 → 再跑 `pnpm verify:fidelity`。实现与真值冲突时以真值为准；认为真值有误时，先在 `evidence/` 记录证据（设计稿页码 + 实测坐标）再改。
2. **令牌分层不可越界**：字面色值只允许出现在 `src/ui/tokens/palette.css`；`var(--c-*)` 只允许被 `semantic.css` 引用；业务代码只能引用 `var(--biu-*)`。由 `pnpm verify:literals` 与 `tests/design-tokens.test.ts` 两条独立通道强制，均已接入 CI。
3. **能力零损失**：任何可见操作必须映射到已有 store / service / IPC。新增后端能力不在本轮范围。
4. **阶段边界不可悄悄越界**：每个阶段都要能回答「本阶段动没动渲染」。遗留令牌的有效值变更必须先写进 [`tools/design-fidelity/phase-boundary.json`](../../tools/design-fidelity/phase-boundary.json) 再改代码；被业务代码消费的令牌若改变有效值，须显式标 `visualImpact: true`。由 `pnpm verify:phase-drift` 强制，已接入 CI。

---

## 阶段进度

| 阶段 | 范围 | 状态 |
| --- | --- | --- |
| **P0** 冻结与桥接 | 三层令牌落地、真值对照单测（97 项）、护栏接入 CI、夹具目录 | **已完成**（2026-09-25）。实测确认渲染未变，仅 `--biu-radius-lg` 16 → 20 一处可见变化（已显式声明）。P0 / P1 边界见总方案 §13.1 |
| P1 壳层重建 | `AppShell` / `TopBar` / 播放栏 88px / `/queue`、`/now-playing` 路由 / 删侧栏 / 主题收敛 | 待开始 |
| P2 通用组件层 | `src/ui/primitives`、`patterns`、`/design-system` 展位 | 待开始 |
| P3–P6 | 逐屏迁移 | 待开始 |
| P7 清理与发布 | 删除遗留 `--biu-color-*`，业务代码零字面色值 | 待开始 |

---

## 四个决策（不可单方面变更）

| #   | 决策                                                                      |
| --- | ------------------------------------------------------------------------- |
| 1   | 画布采用**令牌锚定 + 弹性容器**：实测值固定，仅标题列伸缩                 |
| 2   | **深色为唯一正式皮肤**，移除浅色主题与自定义主色 / 圆角 / 背景色入口      |
| 3   | **移除左侧栏**，顶栏承载品牌 / 分段导航 / 搜索 / 头像，次级入口进头像菜单 |
| 4   | 播放队列与正在播放**均改为路由页**（`/queue`、`/now-playing`）            |

理由与影响面见总方案 §0。

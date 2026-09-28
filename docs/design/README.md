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
pnpm verify:reference                     # 参考图体检（不捕获渲染；参考图错了后面只会误判实现）
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
| **P0** 冻结与桥接 | 三层令牌落地、真值对照单测、护栏接入 CI、夹具目录 | **已完成**。实测确认渲染未变，仅 `--biu-radius-lg` 16 → 20 一处可见变化（已显式声明）。P0 / P1 边界见总方案 §13.1 |
| **P1** 壳层重建 | `AppShell` / `TopBar` / 播放栏 88px / `/queue`、`/now-playing` 路由 / 删侧栏 / 主题收敛 | **已完成**。顶栏 71 / 播放栏 88 经 14 条路由真机走查实测确认；跨路由跳转播放栏 DOM 未重建 |
| **P2** 通用组件层 | `src/ui/primitives`、`patterns`、`/design-system` 展位 | **已完成**。每组件独立展位，展位上的字阶数字由单测与真值逐字对照 |
| **P3** 主流程 4 屏 | 屏 01 我的音乐库 / 02 收藏详情 / 06 搜索 / 07+08 发现音乐 | **已完成**（保真出口达成）。五屏 `--target app` 全部 PASS（L3 11.44 / 10.22 / 6.21 / 8.20 / 8.73）。**欠一项**：`/` 的**真实数据路径**迁移与顶栏分段组「音乐分区 / 单一模块」未随收口落地，见 [`cplus-screen-matrix.md`](./cplus-screen-matrix.md) 的 07/08 节 |
| **P4** 库内子页 3 屏 | 屏 03 稍后播放 / 04 本地音乐 / 05 下载管理 | **施工中（屏 03 进行到一半）**。开工前置已完成（1.3.25）：`micro`(12) 取得设计稿正向取证、`body`(15) 的内容区消费方仍需屏 03/04/05 的夹具先构造一段长纯 CJK 正文才可判；顺带订正了顶栏三处文字（新立 `--biu-type-chrome` 14），见 [`evidence/type-scale-audit.md`](./evidence/type-scale-audit.md)。屏 03 **夹具与呈现层已落地**（`features/later/{later-view,fixture}.ts`，spec-lock 1.3.26），**页面装配未做** —— `src/pages/later` 仍是旧实现，`LaterView` 尚无任何引用；屏 04 / 05 未开工 |
| **P5** 播放核心 + 迷你播放器 | 屏 09 播放队列 / 10 正在播放 · 沉浸 / 12 迷你播放器 | 待开始 |
| **P6** 设置 + 延展屏 | 屏 11 设置、`/history`、`/follow`、`/user/:id` | 待开始 |
| **P7** 清理与发布 | 删除旧组件与死代码、业务代码零字面色值、三平台回归与发布 | 待开始 |

---

## 四个决策（不可单方面变更）

| #   | 决策                                                                      |
| --- | ------------------------------------------------------------------------- |
| 1   | 画布采用**令牌锚定 + 弹性容器**：实测值固定，仅标题列伸缩                 |
| 2   | **深色为唯一正式皮肤**，移除浅色主题与自定义主色 / 圆角 / 背景色入口      |
| 3   | **移除左侧栏**，顶栏承载品牌 / 分段导航 / 搜索 / 头像，次级入口进头像菜单 |
| 4   | 播放队列与正在播放**均改为路由页**（`/queue`、`/now-playing`）            |

理由与影响面见总方案 §0。

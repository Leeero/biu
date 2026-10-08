# 阶段 3 Design QA

**Findings**

- 首轮发现 `selected` 与 `loading` 继承禁用透明度后过暗（P2，Button 状态矩阵）。已将 selected 调整为强调边框、强调柔和底和高对比文字，并为 loading 设置独立可读透明度；复截图后无剩余 P0/P1/P2。
- IconButton 首轮 selected 仅有 ARIA 语义、视觉反馈不足（P2）。已补强调边框、柔和底与强调色图标；组件 API 未改变。

**Open Questions**

- 无阻塞项。纯浏览器下的 Axios 与 Electron listener stub 控制台错误属于既有非 Electron 预览限制，未由阶段 3 引入。

**Implementation Checklist**

- [x] 八态矩阵覆盖 Button 与 IconButton。
- [x] SearchField 正常态与错误态可见。
- [x] 公共组件只消费 4188 语义令牌。
- [x] loading / empty / error 保留正确 ARIA live role。
- [x] 弹层几何与材质映射到 4188 源文件。
- [x] 1280×720 浏览器截图复核。

**Follow-up Polish**

- P3：业务页迁移时按实际内容补长文本、密集表格与触控尺寸回归；不在组件底层预先发明新尺寸档。

## 证据

- source visual truth path：`prototypes/biu-discover-option2/src/Pages.jsx`、`prototypes/biu-discover-option2/src/styles.css`
- source screenshot：`docs/design-4188/phase3-reference.png`
- implementation screenshot：`docs/design-4188/phase3-implementation.png`
- combined comparison：`docs/design-4188/phase3-comparison.png`
- viewport：1280×720 CSS px；source / implementation 均为 1280×720、deviceScaleFactor 1，无密度缩放。
- state：深色主题；source 为发现页与队列抽屉的真实按钮/图标/搜索/选中表面，implementation 为 `/design-system` 的八态组件矩阵。
- full-view comparison：组合图左侧源设计、右侧组件矩阵，用于核对字体层级、紫色操作色、深色表面、边框、圆角、图标与壳层密度。两者不是同一业务页面，因此不做页面坐标级误差结论。
- focused comparison：Button 八态与 IconButton 八态单独滚动到视口检查；首轮两项 P2 已修复并重新截图。
- fonts/typography：沿用 Inter / Noto Sans SC / PingFang SC；组件正文与标签使用阶段 1 的 14/12px 档，层级与源设计一致。
- spacing/layout rhythm：38px 药丸按钮、11/14/18px 圆角体系与 4188 源样式一致；状态矩阵只作验收排列，不进入业务 UI。
- colors/tokens：所有新增样式引用 `--biu-4188-*`；字面色与原始色板越层检查通过。
- image quality/assets：本阶段不新增图片资产；可见图标使用现有 SVG/Remix Icon，未使用 CSS 图形替代设计资产。
- copy/content：设计系统说明明确指向阶段 1 令牌与 4188 源文件；业务文案未改变。
- interactions checked：Tab 焦点、pressed/selected、disabled、loading、error、输入框标签与错误边框；组件测试同时验证 ARIA。
- console errors checked：存在纯浏览器 Electron 桥接桩与 API 请求的既有错误，未发现由阶段 3 组件产生的新错误。

## Comparison history

1. 首轮：发现 selected/loading 对比不足、IconButton selected 不明显；结果 blocked。
2. 修复：增加 selected 边框和高对比文字、loading 独立透明度、IconButton selected 视觉态。
3. 复核：八态区分清楚，未发现剩余 P0/P1/P2。

final result: passed

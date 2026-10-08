# 阶段 8 Design QA

- source visual truth: 4188 设置页“迷你播放器”预览及 `prototypes/biu-discover-option2/src/Pages.jsx`、`styles.css`
- implementation targets: 真实 Electron Mini、系统集成页、390 px 下载/设置、全局焦点与 reduced-motion
- viewports: 360 × 140、390 × 844、720 × 900、1440 × 1000
- actual Electron: `⌘M` 双向切换成功；Mini 实窗显示当前封面、曲目、作者、04:10/04:24 进度及五个控制，返回完整窗口后状态未丢失
- accessibility: Mini 控件均有可访问名称；键盘顺序正确；启用控件达到 44 × 44 px；焦点样式复用统一令牌
- responsive: 720 px 无根级横向溢出，操作胶囊换行，表格转卡片行；390 px 下载/设置无遮挡且设置分类不再逐字换行
- motion: 支持 `prefers-reduced-motion: reduce`，非必要动画与过渡降至 0.01 ms
- visual exception: 设计稿 Mini 为三键简版；实现保留现有五键、进度和返回能力，属于已记录的功能边界补全，不改变业务规则
- remaining finding: macOS 安装包最终产物未生成，阻塞于本机 Xcode `actool/CoreSimulatorService`；不影响已完成的真实 Electron 窗口验收

final result: passed

import ScrollContainer from "@/components/scroll-container";
import { PageHeader } from "@/ui/patterns/page-header";

import { PatternsExhibit } from "./patterns-exhibit";
import { PrimitivesExhibit } from "./primitives-exhibit";
import { TokensExhibit } from "./tokens-exhibit";

/**
 * 设计系统展示页。
 *
 * 这个页面不是「组件陈列」——它是 P2 出口标准的**检查工具**：
 *   1. 方案 §5 清单里的每个组件都要有独立展位；
 *   2. 每个展位标注对应的**原型类**与**设计页**，以便随时回到设计稿核对；
 *   3. 每个组件覆盖 §5.3 的状态矩阵。
 *
 * 三条组织原则：
 *   · **令牌在前**。组件是令牌的用法，先看令牌才看得懂组件为什么长这样。
 *   · **按 5.1 / 5.2 分段**（基础件 / 模式件），与方案的编号对齐 —— 这里的编号
 *     不是装饰，是「去文档里找哪一条」的索引。
 *   · **不复制数值**。色卡只给观感与令牌名，取值唯一来源是
 *     `docs/design/cplus-spec-lock.json`；抄一份到页面上，那份迟早与真值分叉。
 *
 * 页面本身只用 `--biu-*` 令牌，不放任何字面长度以外的设计值：
 * 它是组件的消费者，和别的页面受同一套约束。
 */
const DesignSystemPage = () => (
  <ScrollContainer className="h-full pb-16">
    <div className="w-full">
      <PageHeader
        title="设计系统"
        lead="仅开发环境可见。P2 组件层的活文档：令牌 → 基础件 → 模式件，每件标注原型类与设计页。"
        baseline="flat"
        aside={
          <aside className="rounded-[var(--biu-radius-lg)] border border-[var(--biu-glass-border)] bg-[var(--biu-surface-glass)] px-[22px] py-5 backdrop-blur-[var(--biu-blur-glass)]">
            <p className="m-0 mb-2 text-[length:var(--biu-type-small-size)] leading-6 text-[rgb(var(--biu-text-secondary))]">
              怎么用这一页
            </p>
            <ul className="m-0 list-none p-0 text-[length:var(--biu-type-label-size)] leading-[26px] text-[rgb(var(--biu-text-primary))]">
              <li>逐项对照 app.css 的原型类</li>
              <li>带 ↗ 的状态需真实交互才可见</li>
              <li>数值以 cplus-spec-lock.json 为准</li>
              <li>色卡不显示十六进制，避免抄第二遍</li>
            </ul>
          </aside>
        }
      />

      <TokensExhibit />
      <PrimitivesExhibit />
      <PatternsExhibit />
    </div>
  </ScrollContainer>
);

export default DesignSystemPage;

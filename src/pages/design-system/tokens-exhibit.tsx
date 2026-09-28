import type { CSSProperties } from "react";

import { Showcase, ExhibitSection } from "./showcase";

/**
 * 令牌展位（对应设计稿第 14 页「色板 / 排版 / 材质」）。
 *
 * **本页不显示任何色值原文**。原因是本项目对「真值」的定义：唯一来源是
 * `docs/design/cplus-spec-lock.json`，由 `tests/design-tokens.test.ts` 逐项钉住。
 * 把十六进制抄到这一页，就是抄了第二遍 —— 抄的那一份迟早与真值分叉，
 * 而页面上的错值比没有值更容易骗人（P0 落地时沉浸态渐变就这么错过一次）。
 * 因此色卡只呈现**观感**与**令牌名**，数值去真值文件里看。
 *
 * 色卡按分层呈现：
 *   · 三通道令牌（不透明色）→ 用 `rgb(var(--biu-x))`
 *   · 整值令牌（叠加层）    → 用 `var(--biu-veil-N)`
 * 两者的区别不是写法偏好：叠加层若再套一层 alpha，得到的是「二次调暗」，
 * 不是设计稿的取值。
 */

interface Swatch {
  token: string;
  use: string;
  /** `triple` 是三通道令牌，要再包一层颜色函数才能当颜色用；`solid` 本身就是可直接使用的颜色值。 */
  kind: "triple" | "solid";
}

const SURFACES: Swatch[] = [
  { token: "--biu-surface-canvas", use: "应用底板", kind: "triple" },
  { token: "--biu-surface-topbar", use: "顶栏底", kind: "triple" },
  { token: "--biu-surface-player", use: "播放栏底", kind: "triple" },
  { token: "--biu-surface-image", use: "影像底", kind: "triple" },
  { token: "--biu-surface-raised", use: "抬升面板（白 6%）", kind: "solid" },
  { token: "--biu-surface-hover", use: "悬停（白 10%）", kind: "solid" },
  { token: "--biu-surface-sunken", use: "凹槽 / 歌词（白 13%）", kind: "solid" },
  { token: "--biu-surface-field", use: "输入框（白 17%）", kind: "solid" },
  { token: "--biu-surface-current", use: "列表当前行（白 7%）", kind: "solid" },
  { token: "--biu-surface-glass", use: "玻璃圆片（白 16%）", kind: "solid" },
  { token: "--biu-surface-modal", use: "弹层底（深灰 86%）", kind: "solid" },
  { token: "--biu-surface-art-bed", use: "封面未就位底板", kind: "triple" },
];

const TEXTS: Swatch[] = [
  { token: "--biu-text-primary", use: "主文字", kind: "triple" },
  { token: "--biu-text-secondary", use: "次文字", kind: "triple" },
  { token: "--biu-text-tertiary", use: "三级文字", kind: "triple" },
  { token: "--biu-text-quaternary", use: "四级文字 / 注解带", kind: "triple" },
  { token: "--biu-text-disabled", use: "禁用（仅非正文）", kind: "triple" },
  { token: "--biu-text-chrome-label", use: "顶栏分段未激活项", kind: "triple" },
  { token: "--biu-text-placeholder", use: "输入框占位符", kind: "solid" },
  { token: "--biu-text-lyrics-dim", use: "歌词非当前行", kind: "solid" },
];

const CAPABILITY: Swatch[] = [
  { token: "--biu-accent", use: "强调", kind: "triple" },
  { token: "--biu-accent-ink", use: "强调药丸文字", kind: "triple" },
  { token: "--biu-quality", use: "音质徽标", kind: "triple" },
  { token: "--biu-dir", use: "本地目录徽标", kind: "triple" },
  { token: "--biu-film", use: "胶片灰", kind: "triple" },
  { token: "--biu-danger", use: "危险操作", kind: "triple" },
  { token: "--biu-inverse-surface", use: "反色底 / 主操作", kind: "triple" },
  { token: "--biu-inverse-ink", use: "反色底上的文字", kind: "triple" },
];

const FORMATS: Swatch[] = [
  { token: "--biu-fmt-flac", use: "FLAC", kind: "triple" },
  { token: "--biu-fmt-wav", use: "WAV", kind: "triple" },
  { token: "--biu-fmt-aiff", use: "AIFF", kind: "triple" },
  { token: "--biu-fmt-m4a", use: "M4A", kind: "triple" },
  { token: "--biu-fmt-mp3", use: "MP3", kind: "triple" },
  { token: "--biu-fmt-wma", use: "WMA", kind: "triple" },
];

const BORDERS: Swatch[] = [
  { token: "--biu-border", use: "标准描边（白 10%）", kind: "solid" },
  { token: "--biu-border-weak", use: "弱分隔（白 6%）", kind: "solid" },
  { token: "--biu-border-strong", use: "强调描边（白 16%）", kind: "solid" },
  { token: "--biu-glass-border", use: "玻璃描边（白 18%）", kind: "solid" },
  { token: "--biu-accent-soft", use: "已生效筛选条件底", kind: "solid" },
  { token: "--biu-danger-soft", use: "危险软底", kind: "solid" },
  { token: "--biu-danger-line", use: "危险描边", kind: "solid" },
];

/** 叠加层按**实际不透明度**命名，所以这里能把名字与档位直接对上眼。 */
const VEILS: Swatch[] = [
  { token: "--biu-veil-4", use: "列表行悬停", kind: "solid" },
  { token: "--biu-veil-5-5", use: "迷你窗底", kind: "solid" },
  { token: "--biu-veil-8", use: "分段项悬停", kind: "solid" },
  { token: "--biu-veil-9", use: "分段容器底", kind: "solid" },
  { token: "--biu-veil-12", use: "已关注底 / 药丸描边 / 顶栏键帽底", kind: "solid" },
  { token: "--biu-veil-14", use: "徽标底 / 行内操作带 / 弹层描边", kind: "solid" },
  { token: "--biu-veil-18", use: "进度槽", kind: "solid" },
  { token: "--biu-veil-20", use: "瓦片操作带描边", kind: "solid" },
  { token: "--biu-veil-22", use: "动作分隔线 / 关注描边", kind: "solid" },
  // 原型色板登记档：顶栏键帽原用本档，1.3.6 按设计稿实测改指 veil-12，取值保留对照。
  { token: "--biu-veil-28", use: "原型档（当前无消费者）", kind: "solid" },
];

const RADII: { token: string; role: string }[] = [
  { token: "--biu-radius-image", role: "满幅影像 0" },
  { token: "--biu-radius-tag", role: "属性标签 6" },
  { token: "--biu-radius-sm", role: "徽标 / 行高亮 8" },
  { token: "--biu-radius-md", role: "瓦片 / 缩略图 12" },
  { token: "--biu-radius-window", role: "迷你窗口 12" },
  { token: "--biu-radius-field-lg", role: "大搜索框 18" },
  { token: "--biu-radius-lg", role: "面板 / 歌词 / 弹层 20" },
  { token: "--biu-radius-pill", role: "药丸 / 搜索 / 播放键 999" },
];

/**
 * 字阶展位。**每个 role 里的数字要与 `typography.scale` 逐字一致** —— 这里写死过一次
 * 过期值（1.3.24 把导语由 22 订正为 20 时差点漏掉）。数字只作人读标签，真值是令牌本身。
 */
const TYPE_STEPS = [
  { token: "--biu-type-page-title", role: "满幅标题 56" },
  { token: "--biu-type-track-title", role: "曲名 40" },
  { token: "--biu-type-lead", role: "页面副标题 20" },
  { token: "--biu-type-small", role: "歌词与浮层小字 17" },
  { token: "--biu-type-list-title", role: "曲目表标题 17" },
  { token: "--biu-type-section-title", role: "分组标题 16" },
  { token: "--biu-type-body", role: "列表正文与元信息 15" },
  { token: "--biu-type-chrome", role: "顶栏 chrome 文字 14" },
  { token: "--biu-type-note", role: "注解带 14" },
  { token: "--biu-type-label", role: "标签与徽标 13" },
  { token: "--biu-type-micro", role: "表头与角标 12" },
] as const;

const ANCHORS = [
  { name: "顶栏高", value: "71（--biu-layout-topbar-h）" },
  { name: "播放栏高", value: "88（--biu-layout-player-h）" },
  { name: "内容留白", value: "64（--biu-layout-gutter）" },
  { name: "列表行高", value: "68（--biu-layout-row-h）" },
  { name: "缩略图", value: "100 × 56（--biu-layout-art-w / -h）" },
  { name: "右列 4 / 5", value: "220 / 152（--biu-layout-col-4 / -5）" },
  { name: "列表右缩进", value: "40（--biu-layout-list-pad-r）" },
  { name: "筛选条高", value: "48（--biu-layout-filterbar-h）" },
  { name: "药丸高", value: "36（--biu-layout-pill-h）" },
] as const;

/**
 * 取色交给**静态工具类 + 一个本地变量**，而不是在 JSX 里拼颜色字符串。
 *
 * 两条理由：
 *   1. 颜色组合本来就属于样式层；把令牌名经 `--ds-token` 传进去，本页只负责
 *      「显示哪个令牌」，不负责「令牌怎么变成颜色」。
 *   2. 拼出来的颜色函数会被字面色值护栏拦下 —— 护栏只认静态的
 *      「颜色函数(var(--令牌))」形态（那是它明确放行的合法写法）。
 *      绕开护栏去放行本页，比让本页不碰颜色更糟。
 */
const swatchVars = (item: Swatch) => ({ "--ds-token": `var(${item.token})` }) as CSSProperties;

const SWATCH_BG: Record<Swatch["kind"], string> = {
  triple: "bg-[rgb(var(--ds-token))]",
  solid: "bg-[var(--ds-token)]",
};

const SWATCH_INK: Record<Swatch["kind"], string> = {
  triple: "text-[color:rgb(var(--ds-token))]",
  solid: "text-[color:var(--ds-token)]",
};

/** 纯文本令牌清单（层级这类没有可预览形态的档位）。 */
const TokenChips = ({ items }: { items: readonly string[] }) => (
  <div className="flex flex-wrap gap-2">
    {items.map(item => (
      <code
        key={item}
        className="rounded-[var(--biu-radius-tag)] border border-[var(--biu-border-weak)] bg-[var(--biu-surface-sunken)] px-2 py-1 font-[family-name:var(--biu-font-numeric)] text-[length:var(--biu-type-micro-size)] text-[rgb(var(--biu-text-secondary))]"
      >
        {item}
      </code>
    ))}
  </div>
);

const SwatchGrid = ({ items }: { items: readonly Swatch[] }) => (
  <ul className="m-0 grid list-none grid-cols-1 gap-3 p-0 sm:grid-cols-2 lg:grid-cols-4">
    {items.map(item => (
      <li key={item.token} className="flex min-w-0 items-center gap-3">
        <span
          className={`size-8 flex-none rounded-[var(--biu-radius-sm)] border border-[var(--biu-border-weak)] ${SWATCH_BG[item.kind]}`}
          style={swatchVars(item)}
        />
        <span className="min-w-0">
          <code className="block truncate font-[family-name:var(--biu-font-numeric)] text-[length:var(--biu-type-micro-size)] text-[rgb(var(--biu-text-secondary))]">
            {item.token}
          </code>
          <span className="block truncate text-[length:var(--biu-type-micro-size)] text-[rgb(var(--biu-text-quaternary))]">
            {item.use}
          </span>
        </span>
      </li>
    ))}
  </ul>
);

export const TokensExhibit = () => (
  <ExhibitSection
    title="令牌"
    note="三层结构：palette.css（唯一允许字面色值）→ semantic.css（唯一可引用 --c-*）→ geometry.css（长度与排版，无颜色）。业务代码只允许引用 --biu-*。本页不复制任何数值，取值唯一来源是 cplus-spec-lock.json。"
  >
    <Showcase name="表面与底板" proto=".stage / .topbar / .playbar / .tile" page={14}>
      <SwatchGrid items={SURFACES} />
    </Showcase>

    <Showcase name="文字色阶" proto="--c-text-1…5" page={14}>
      <SwatchGrid items={TEXTS} />
      <div className="mt-5 flex flex-col gap-1">
        {TEXTS.slice(0, 5).map(item => (
          <span
            key={item.token}
            className={`font-[family-name:var(--biu-font-sans)] text-[length:var(--biu-type-body-size)] ${SWATCH_INK[item.kind]}`}
            style={swatchVars(item)}
          >
            夜色把整座城市折成一封信 —— {item.use}
          </span>
        ))}
      </div>
    </Showcase>

    <Showcase name="能力色与反色对" proto=".badge--dir / .tag--quality / .round--lead" page={14}>
      <SwatchGrid items={CAPABILITY} />
    </Showcase>

    <Showcase name="本地格式色" proto=".format-name" page={14}>
      <SwatchGrid items={FORMATS} />
    </Showcase>

    <Showcase name="描边与软底" proto="--line / --line-weak / --line-strong" page={14}>
      <SwatchGrid items={BORDERS} />
    </Showcase>

    <Showcase
      name="白色叠加梯度"
      proto=".tabgroup / .badge / .track-actions / .search kbd"
      page={14}
      note="按实际不透明度命名。原型里的这些值是一串手调值（4 / 5.5 / 8 / 9 / 12 / 14 / 18 / 20 / 22 / 28%），彼此没有可推导的关系 —— 所以不给它们编语义名：语义名会诱使人把 14% 用在需要 12% 的地方，P1 已经在分段导航上犯过一次（把 8% / 9% 收敛成 10%）。"
    >
      <SwatchGrid items={VEILS} />
      <ul className="m-0 mt-5 grid list-none grid-cols-1 gap-3 p-0 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { token: "--biu-scrim", use: "低层遮罩（仅可读性）" },
          { token: "--biu-blur-glass", use: "玻璃模糊 20" },
          { token: "--biu-blur-modal", use: "弹层模糊 28" },
          { token: "--biu-shadow-modal", use: "弹层投影" },
        ].map(item => (
          <li key={item.token}>
            <code className="block truncate font-[family-name:var(--biu-font-numeric)] text-[length:var(--biu-type-micro-size)] text-[rgb(var(--biu-text-secondary))]">
              {item.token}
            </code>
            <span className="block text-[length:var(--biu-type-micro-size)] text-[rgb(var(--biu-text-quaternary))]">
              {item.use}
            </span>
          </li>
        ))}
      </ul>
    </Showcase>

    <Showcase name="排版" proto="--fs-page-title / -track-title / -lead / -small / -body / -label / -micro" page={14}>
      <div className="flex flex-col gap-5">
        {TYPE_STEPS.map(step => (
          <div key={step.token} className="min-w-0">
            <code className="mb-1 block font-[family-name:var(--biu-font-numeric)] text-[length:var(--biu-type-micro-size)] text-[rgb(var(--biu-text-quaternary))]">
              {step.token} · {step.role}
            </code>
            <p
              className="m-0 truncate text-[rgb(var(--biu-text-primary))]"
              style={{
                fontSize: `var(${step.token}-size)`,
                fontWeight: `var(${step.token}-weight)`,
                lineHeight: `var(${step.token}-leading)`,
                letterSpacing: `var(${step.token}-tracking)`,
              }}
            >
              夜航 · Night Flight 0123
            </p>
          </div>
        ))}
      </div>
    </Showcase>

    <Showcase
      name="圆角"
      proto="--r-image / -tag / -chip / -tile / -window / -panel / -field / -pill"
      page={14}
      note="界面里没有直角卡片 —— 圆角是固定值，不由 HeroUI 的 --heroui-radius-medium 派生。tag（6）与 chip（8）是相邻但不同的两档：前者给 .tag，后者给 .badge 与筛选条内片。"
    >
      <ul className="m-0 grid list-none grid-cols-2 gap-4 p-0 md:grid-cols-4">
        {RADII.map(item => (
          <li key={item.token} className="min-w-0">
            <div
              className="mb-2 h-14 border border-[var(--biu-border)] bg-[var(--biu-surface-sunken)]"
              style={{ borderRadius: `var(${item.token})` }}
            />
            <code className="block truncate font-[family-name:var(--biu-font-numeric)] text-[length:var(--biu-type-micro-size)] text-[rgb(var(--biu-text-secondary))]">
              {item.token}
            </code>
            <span className="block truncate text-[length:var(--biu-type-micro-size)] text-[rgb(var(--biu-text-quaternary))]">
              {item.role}
            </span>
          </li>
        ))}
      </ul>
    </Showcase>

    <Showcase
      name="骨架硬锚点"
      proto="L1 验收锚点"
      page={14}
      note="这九项是「令牌锚定 + 弹性容器」策略里被锚定的那一半：它们不随窗口缩放变化，验收时按零偏差比对（tolerances.hardAnchorsPx = 1）。弹性只发生在列表的中间标题列（minmax(0, 1fr)）。"
    >
      <dl className="m-0 grid grid-cols-1 gap-x-8 gap-y-2 md:grid-cols-3">
        {ANCHORS.map(item => (
          <div
            key={item.name}
            className="flex items-baseline justify-between gap-4 border-b border-[var(--biu-border-weak)] py-1"
          >
            <dt className="text-[length:var(--biu-type-label-size)] text-[rgb(var(--biu-text-secondary))]">
              {item.name}
            </dt>
            <dd className="m-0 font-[family-name:var(--biu-font-numeric)] text-[length:var(--biu-type-label-size)] text-[rgb(var(--biu-text-quaternary))]">
              {item.value}
            </dd>
          </div>
        ))}
      </dl>
    </Showcase>

    <Showcase name="层级" proto="--z-content / -note / -playbar / -topbar" page={14}>
      <TokenChips items={["--biu-z-content 1", "--biu-z-note 20", "--biu-z-player 40", "--biu-z-topbar 50"]} />
    </Showcase>

    <Showcase
      name="动效"
      proto="--ease-fast / -base / -overlay"
      page={14}
      note="两个缓动名字取值相同是**忠实还原**：原型 tokens.css 的 --ease-fast / -base / -overlay 三档共用同一条曲线，只在时长上区分（120 / 180 / 240ms）。P1 曾把「两者同值」记为待办，复核原型后确认那是误判。"
    >
      <div className="flex flex-wrap gap-6">
        {["--biu-duration-fast", "--biu-duration-normal", "--biu-duration-slow"].map(token => (
          <div key={token} className="min-w-[180px]">
            <div
              className="h-1 rounded-[2px] bg-[rgb(var(--biu-accent))]"
              style={{ transition: `width var(${token}) var(--biu-ease-standard)` }}
            />
            <code className="mt-2 block font-[family-name:var(--biu-font-numeric)] text-[length:var(--biu-type-micro-size)] text-[rgb(var(--biu-text-quaternary))]">
              {token}
            </code>
          </div>
        ))}
      </div>
      <p className="m-0 mt-3 text-[length:var(--biu-type-micro-size)] text-[rgb(var(--biu-text-quaternary))]">
        三条共用 --biu-ease-standard；减少动效时三档时长归零（见 index.css 的 prefers-reduced-motion）。
      </p>
    </Showcase>
  </ExhibitSection>
);

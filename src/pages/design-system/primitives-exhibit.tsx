import { useState } from "react";

import { Artwork } from "@/ui/primitives/artwork";
import { Avatar } from "@/ui/primitives/avatar";
import { Badge } from "@/ui/primitives/badge";
import { Button } from "@/ui/primitives/button";
import { GlassButton } from "@/ui/primitives/glass-button";
import { Icon, ICONS, type IconName } from "@/ui/primitives/icon";
import { IconButton } from "@/ui/primitives/icon-button";
import { KbdRow } from "@/ui/primitives/kbd-row";
import { Pill, type PillVariant } from "@/ui/primitives/pill";
import { ProgressBar } from "@/ui/primitives/progress-bar";
import { SearchField } from "@/ui/primitives/search-field";
import { SegmentedControl } from "@/ui/primitives/segmented-control";
import { Tag, type TagVariant } from "@/ui/primitives/tag";
import { TopBarSearch } from "@/ui/primitives/topbar-search";

import { ExhibitSection, ExhibitRow, Showcase, StateMatrix } from "./showcase";

const PILL_VARIANTS: readonly PillVariant[] = [
  "default",
  "primary",
  "secondary",
  "neutral",
  "outline",
  "accent",
  "danger",
  "ghost",
];

const TAG_VARIANTS: readonly TagVariant[] = ["quality", "accent", "plain", "danger"];

/** 图标词汇表的全部键。列出来是为了让「有哪些图标可用」一眼可见。 */
const ICON_NAMES = Object.keys(ICONS) as IconName[];

export const PrimitivesExhibit = () => {
  const [topbarQuery, setTopbarQuery] = useState("");
  const [fieldQuery, setFieldQuery] = useState("");
  const [tab, setTab] = useState("discover");

  return (
    <ExhibitSection
      title="基础件"
      note="原型的原子件与它们的交互态。除特别注明外，几何与配色都逐项对照 app.css；原型未定义的状态在组件文件里显式标注为「新增」，不在这里重复。"
    >
      <Showcase
        name="图标"
        proto="svg.i"
        page={13}
        note="三条几何约定来自原型：width/height 1em、fill currentColor、flex none。第三条最容易漏 —— 列表行与药丸都是 flex 容器，图标缺了 flex:none 会被压扁，而这个变形在 15px 上下几乎看不出来。图标恒为 aria-hidden：C+ 里图标的含义由旁边文字承担。"
      >
        <ul className="m-0 grid list-none grid-cols-2 gap-3 p-0 sm:grid-cols-4 lg:grid-cols-6">
          {ICON_NAMES.map(name => (
            <li key={name} className="flex items-center gap-2 text-[rgb(var(--biu-text-secondary))]">
              <Icon name={name} size={20} />
              <code className="truncate font-[family-name:var(--biu-font-numeric)] text-[length:var(--biu-type-micro-size)]">
                {name}
              </code>
            </li>
          ))}
        </ul>
      </Showcase>

      <Showcase
        name="药丸"
        proto=".pill 各变体"
        page={7}
        note="几何：高 36（--biu-layout-pill-h）、圆角 999、左右内边距 18、图标 15、间隔 7。原型只写了这些几何与 transition，没有定义任何交互态 —— 交互态由 Button 承接，见下。"
      >
        <ExhibitRow>
          {PILL_VARIANTS.map(variant => (
            <Pill key={variant} variant={variant}>
              {variant}
            </Pill>
          ))}
        </ExhibitRow>
      </Showcase>

      <Showcase
        name="按钮"
        proto=".pill + 交互态"
        page={7}
        note="原型未定义交互态，故 hover / pressed / disabled / loading 均为新增并在组件里声明：hover 用白 8% 叠层（primary 例外，改用反色悬停档），pressed 白 14%，disabled 40% 不透明度，loading 内联转圈 + aria-busy。焦点环交给 app.css 的全局 :focus-visible，不自画 —— 每个组件各画一套迟早会五颜六色。"
      >
        <StateMatrix
          states={["default", "disabled", "loading"]}
          render={state => (
            <Button variant="primary" disabled={state === "disabled"} loading={state === "loading"}>
              立即播放
            </Button>
          )}
        />
        <div className="mt-5">
          <StateMatrix
            states={["default", "disabled", "loading"]}
            render={state => (
              <Button variant="outline" disabled={state === "disabled"} loading={state === "loading"} icon="download">
                下载音频
              </Button>
            )}
          />
        </div>
        <div className="mt-5">
          <StateMatrix
            render={state => (
              <Button variant="outline" disabled={state === "disabled"} loading={state === "loading"}>
                {state === "loading" ? "处理中" : "加入队列"}
              </Button>
            )}
          />
        </div>
      </Showcase>

      <Showcase
        name="图标按钮"
        proto=".pb-icon / 顶栏图标位"
        page={11}
        note="保留 HeroUI Button 作底座（方案 §5.4）：pressed 态、键盘触发与 Tooltip 联动自己重写收益很低。P2 只把上一轮的 HeroUI 主题色换成 C+ 令牌 —— 那套写法既绕过色板，又会在主题收敛后失去对比度依据。"
      >
        <StateMatrix
          render={state => (
            <IconButton label="收藏" isDisabled={state === "disabled"} isLoading={state === "loading"}>
              <Icon name="heart" size={18} />
            </IconButton>
          )}
        />
      </Showcase>

      <Showcase
        name="玻璃圆片按钮"
        proto=".round / .round--lead / .actionband .round"
        page={9}
        note="三种色调对应原型的三处用法：glass 是独立出现的玻璃圆片，plain 是瓦片操作带内部（材质由带子提供、悬停铺白 18%），bare 是列表行内操作带内部（原型没有 .track-actions .round:hover，故**无悬停反馈**，如实保留），inverse 是主操作。图标字号约为直径 × 0.45，30px 那档是例外（15px）。"
      >
        <ExhibitRow className="gap-6">
          <div className="flex flex-col items-center gap-2">
            <GlassButton tone="glass" size={34} label="播放" icon="play" />
            <span className="text-[length:var(--biu-type-micro-size)] text-[rgb(var(--biu-text-quaternary))]">
              glass 34
            </span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <GlassButton tone="plain" size={34} label="下一首" icon="next" />
            <span className="text-[length:var(--biu-type-micro-size)] text-[rgb(var(--biu-text-quaternary))]">
              plain 34
            </span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <GlassButton tone="bare" size={30} label="加入队列" icon="queue-add" iconSize={15} />
            <span className="text-[length:var(--biu-type-micro-size)] text-[rgb(var(--biu-text-quaternary))]">
              bare 30
            </span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <GlassButton tone="inverse" size={48} label="播放" icon="play" />
            <span className="text-[length:var(--biu-type-micro-size)] text-[rgb(var(--biu-text-quaternary))]">
              inverse 48
            </span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <GlassButton tone="inverse" size={62} label="播放" icon="play" iconSize={26} />
            <span className="text-[length:var(--biu-type-micro-size)] text-[rgb(var(--biu-text-quaternary))]">
              inverse 62
            </span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <GlassButton tone="glass" size={34} label="不可用" icon="play" disabled />
            <span className="text-[length:var(--biu-type-micro-size)] text-[rgb(var(--biu-text-quaternary))]">
              disabled
            </span>
          </div>
        </ExhibitRow>
      </Showcase>

      <Showcase
        name="来源徽标"
        proto=".badge / .badge--dir"
        page={9}
        note="高 24、左右内边距 9、圆角 8（chip 档）、白 14% 底 + 12% 描边、12px。**组件本身不含定位**：原型在瓦片是左上 12、格式卡是右上 16、专辑封面是左上 10 —— 三处不同，把其中一处写进组件，另外两处就得靠 !important 覆盖。"
      >
        <ExhibitRow>
          <Badge>收藏夹</Badge>
          <Badge>合集</Badge>
          <Badge variant="dir" icon="folder">
            本地目录
          </Badge>
        </ExhibitRow>
      </Showcase>

      <Showcase
        name="属性标签"
        proto=".tag 各变体"
        page={14}
        note="高 22、圆角 **6**（--biu-radius-tag）—— 与徽标的 8 是相邻但不同的两档，不要互换。有意未实现 .tag--ok：原型定义了它但 12 屏无一使用，且 C+ 色板没有 success 语义色（其取值的身份是「WAV 格式色」，借来当成功色会让改格式色顺带改掉成功提示）。"
      >
        <ExhibitRow>
          {TAG_VARIANTS.map(variant => (
            <Tag key={variant} variant={variant}>
              {variant === "quality"
                ? "无损 30251"
                : variant === "accent"
                  ? "独家首发"
                  : variant === "danger"
                    ? "下载出错"
                    : "本地 · M4A"}
            </Tag>
          ))}
        </ExhibitRow>
      </Showcase>

      <Showcase
        name="头像"
        proto=".avatar / .creator-face"
        page={2}
        note="原型尺寸：顶栏 40、创作者行与搜索创作者行 56、碟片缩略图 56。直径由组件给出、不吃父级尺寸 —— 头像被拉成椭圆是这类组件最常见的返工项。"
      >
        <ExhibitRow className="gap-6">
          {[40, 56].map(size => (
            <div key={size} className="flex items-center gap-3">
              <Avatar alt="" size={size} />
              <Avatar alt="" size={size} artKey="creator-1" />
              <code className="font-[family-name:var(--biu-font-numeric)] text-[length:var(--biu-type-micro-size)] text-[rgb(var(--biu-text-quaternary))]">
                {size}
              </code>
            </div>
          ))}
        </ExhibitRow>
      </Showcase>

      <Showcase
        name="封面位"
        proto=".tile-art / .track-art / .track-art--disc"
        page={2}
        note="三种形态：列表行 100×56 圆角 6、瓦片按 16:9、碟片圆形。占位是**确定性**的（按领域 ID 哈希选渐变），不用随机数 —— 随机占位会让列表每次重排都换色，也让截图比对失去意义。加载失败会隐藏 img 让占位露出来，而不是留一个破图图标。"
      >
        <ExhibitRow className="gap-6">
          <Artwork radius="art" alt="" artKey="a" className="h-[56px] w-[100px]" />
          <Artwork radius="md" alt="" artKey="b" className="aspect-video w-[206px]" />
          <Artwork radius="round" gradient="disc" alt="" className="size-[56px]" />
          <Artwork radius="md" gradient="heroList" alt="" className="aspect-video w-[206px]" />
          <Artwork radius="md" alt="" className="aspect-video w-[206px]" />
        </ExhibitRow>
      </Showcase>

      <Showcase
        name="快捷键行"
        proto="设置页 .kbd-row"
        page={12}
        note="用 <dl>/<dt>/<dd>：读屏会念成「播放 / 暂停：Space」，比两个并排 span 清楚。冲突时**整行**转危险色，不只染键位 —— 只染键位的话一行行扫过去很难发现哪行有问题。几何取原型尾部覆盖值（高 22、键位左间距 12）。"
      >
        <div className="flex max-w-[420px] flex-col gap-2">
          <KbdRow label="播放 / 暂停" keys="Space" />
          <KbdRow label="上一首 / 下一首" keys="⌘ ← / ⌘ →" />
          <KbdRow label="打开搜索" keys="Ctrl K" />
          <KbdRow label="切换迷你播放器" keys="⌘ ⇧ M" conflict />
        </div>
      </Showcase>

      <Showcase
        name="进度条"
        proto=".progress-inline .bar / .mini-bar"
        page={6}
        note="这里**只实现 18% 这一档轨道**：原型播放栏用 22%、沉浸态用 24%，那是那两块屏各自的取值，等 P5 重建它们时按实测补录。现在就塞三档进同一个 API，等于凭猜测发明两档没有依据的默认值。"
      >
        <div className="flex flex-col gap-4">
          <ProgressBar value={0} label="下载进度 0%" />
          <ProgressBar value={0.62} label="下载进度 62%" />
          <ProgressBar value={1} label="下载进度 100%" />
          <ProgressBar value={0.4} label="沉浸态进度" width={392} tone="inverse" />
          <ProgressBar value={0.35} label="迷你进度" width={180} height={3} />
        </div>
      </Showcase>

      <Showcase
        name="分段控件"
        proto=".tabgroup / .tab / .np-mode-seg"
        page={2}
        note="同一个视觉在设计稿里承担两件事，故用「有没有 href / panelId」区分语义而不是拆组件：带 href 是导航（<nav> + aria-current），带 panelId 是标签页（role=tablist/tab + aria-controls），都不带则退化为按钮组（aria-pressed）。**不给兑现不了的语义承诺** —— role=tab 承诺「选中项控制某个面板」，页面上没有那个面板时读屏用户会找不到内容。"
      >
        <div className="flex flex-col gap-5">
          <SegmentedControl
            label="显示模式"
            size="compact"
            activeKey={tab}
            onSelect={setTab}
            items={[
              { key: "cover", label: "封面" },
              { key: "lyrics", label: "歌词" },
              { key: "video", label: "视频" },
            ]}
          />
          <SegmentedControl
            label="顶栏分段导航"
            activeKey="discover"
            items={[
              { key: "library", label: "我的音乐库" },
              { key: "discover", label: "发现音乐" },
              { key: "local", label: "本地音乐" },
            ]}
          />
          <SegmentedControl
            label="带计数的导航"
            activeKey="favorite"
            items={[
              { key: "favorite", label: "收藏", count: 214 },
              { key: "later", label: "稍后再看", count: 27 },
              { key: "download", label: "下载", count: 12, disabled: true },
            ]}
          />
        </div>
      </Showcase>

      <Showcase
        name="顶栏搜索"
        proto=".search"
        page={2}
        note="高 40、圆角 999、底白 17%、图标 20、字号 15。宽度是**弹性**的（min(32vw, 400px)，下限 240）：写死 400 时窗口一收窄，右侧头像与窗口按钮就会被挤出去。快捷键提示默认 Ctrl K，关掉前请确认没有注册该快捷键 —— 显示一个按不动的提示比不显示更糟。"
      >
        <ExhibitRow>
          <TopBarSearch value={topbarQuery} onValueChange={setTopbarQuery} />
          <TopBarSearch value={topbarQuery} onValueChange={setTopbarQuery} shortcutHint={null} />
        </ExhibitRow>
      </Showcase>

      <Showcase
        name="大搜索框"
        proto=".searchfield"
        page={7}
        note="高 70、圆角 **18**（--biu-radius-field-lg）、输入字号 30/600、图标 30。与顶栏搜索是两个不同的控件，只是名字都叫「搜索」：设计稿在搜索结果页把搜索框放大，是为了让「当前在搜什么」成为这一屏的视觉主体。用原生 input 而非 HeroUI Input —— 70px 高度下的 30px 字号行内对齐需要精确控制，而 HeroUI 内部有一层固定尺寸 wrapper，覆写成本高于自写。"
      >
        <SearchField
          value={fieldQuery}
          onValueChange={setFieldQuery}
          placeholder="搜索音乐视频或创作者"
          trailing={<Button variant="outline">在本地库中搜索</Button>}
        />
      </Showcase>
    </ExhibitSection>
  );
};

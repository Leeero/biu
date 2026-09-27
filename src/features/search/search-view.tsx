import { twMerge } from "tailwind-merge";

import ScrollContainer from "@/components/scroll-container";
import { CreatorRow } from "@/ui/patterns/creator-row";
import { PageLead } from "@/ui/patterns/page-header";
import { Section } from "@/ui/patterns/section";
import {
  TrackArt,
  TrackCell,
  TrackMain,
  TrackTable,
  TrackTableActions,
  TrackTableRow,
  TrackText,
  type TrackActionSpec,
} from "@/ui/patterns/track-table";
import { Icon } from "@/ui/primitives/icon";
import { SearchField } from "@/ui/primitives/search-field";

/** 视频结果行：夹具与真实路径汇成的同一视图模型。 */
export interface SearchVideoRow {
  id: string;
  title: string;
  subtitle: string;
  /** 时长列（右对齐）。search 变体没有其它右列。 */
  duration: string;
  /** 真实封面地址（真实路径）。夹具不用它，走 placeholder。 */
  art?: string;
  /** 稳定占位键（真实路径用领域 ID）。 */
  artKey?: string;
  /** 显式占位渐变（夹具：artIndex 指向 placeholder-art 的 gradients）。 */
  placeholder?: string;
}

/** 创作者结果行：夹具与真实路径汇成的同一视图模型。 */
export interface SearchCreatorRow {
  id: string;
  name: string;
  meta: string;
  followed: boolean;
}

interface SearchViewProps {
  /** 查询词（大搜索框里回显）。 */
  query: string;
  /** local-link 文案（「在本地音乐中搜索「<查询词>」」）。 */
  localLink: string;
  lead: string;
  videoSectionTitle: string;
  videos: SearchVideoRow[];
  creatorSectionTitle: string;
  creators: SearchCreatorRow[];
  /** 行内操作带的动作（播放 / 下一首 / 入队 / 收藏 / 下载）。 */
  rowActions: readonly TrackActionSpec[];
  /** 常驻露出操作带的行 id（夹具演示位：设计稿第 01 行）。 */
  demoActionRowIds: string[];
  onQueryChange: (value: string) => void;
  onLocalLinkPress: () => void;
  onRowAction: (row: SearchVideoRow, actionKey: string) => void;
}

/**
 * 「搜索结果」的呈现层（C+ 第 06 屏）。
 *
 * 数据装配在 `pages/search` —— 真实路径（getWebInterfaceWbiSearchType 等 service）
 * 与 `?fixture=06-search` 夹具路径在这里汇成同一组 props，渲染代码只有一份。
 * 结构对齐设计稿第 7 页（**没有 h1** —— 大搜索框本身就是标题带）：
 *
 *   大搜索框（含 local-link 药丸）→ 导语 → 「音乐视频」分组（曲目表 3 行）
 *   → 「创作者」分组（创作者行 2 行）。
 *
 * 页面节奏（spec-lock `screens[5].verticalRhythm`，1.3.13 补录，均为**盒**坐标）：
 *   · 内容顶 24 + 搜索框 margin-top 15 ⇒ 盒 109.5–181.5；
 *   · 盒 → 导语 margin 20（导语盒 201.5–229.5，字阶 22/28）；
 *   · 导语 → 首段 margin 23（`gap=push`，非矩阵 §06 写的 tight 12）；
 *   · 行距 68；段间（第二段标题盒顶 503.5）同为 23 —— 两段之间不用 Section
 *     缺省的 27，需按屏覆盖 `[&+&]:mt-[23px]`。
 *
 * 注解带**不在本组件里**：它 `position: absolute; top 598`（`anchor="high"`），
 * 定位上下文是壳层 `<main>`，必须是滚动容器的兄弟节点（见屏 01 同款说明）。
 */
export const SearchView = ({
  query,
  localLink,
  lead,
  videoSectionTitle,
  videos,
  creatorSectionTitle,
  creators,
  rowActions,
  demoActionRowIds,
  onQueryChange,
  onLocalLinkPress,
  onRowAction,
}: SearchViewProps) => (
  <ScrollContainer enableBackToTop className="h-full w-full">
    {/* 内容顶 24：main 的 pt 是 33，屏 06 收 9px（spec-lock 1.3.13「内容顶 24」）。 */}
    <div className="-mt-[9px] w-full">
      {/* 搜索框 margin-top 15（相对内容顶 24 ⇒ 盒上缘 110）。 */}
      <div className="mt-[15px]">
        <SearchField
          value={query}
          onValueChange={onQueryChange}
          label="搜索音乐视频或创作者"
          trailing={<LocalLink label={localLink} onPress={onLocalLinkPress} />}
        />
      </div>

      {/* 盒 → 导语 margin 20（覆盖 PageLead 缺省的 mt-2）。 */}
      <PageLead className="mt-5">{lead}</PageLead>

      {/* 导语 → 首段 margin 23（gap=push）。分组标题下是无表头行，
          head margin 用无表头变体 4px（spec-lock geometry.sectionHead.noHeaderVariant，1.3.14）。
          [&+&] 是成对约束：两个 Section 必须都带该类，兄弟选择器才会匹配。 */}
      <Section title={videoSectionTitle} gap="push" className="[&+&]:mt-[23px] [&>header]:mb-[4px]">
        <TrackTable variant="search">
          {videos.map(row => (
            <TrackTableRow key={row.id} trackId={row.id}>
              <TrackMain>
                <TrackArt src={row.art} artKey={row.artKey} placeholder={row.placeholder} />
                <TrackText title={row.title} subtitle={row.subtitle} />
              </TrackMain>
              <TrackCell />
              <TrackCell align="end">{row.duration}</TrackCell>
              {demoActionRowIds.includes(row.id) && (
                <TrackTableActions
                  className="right-[224px]"
                  actions={rowActions.map(action => ({
                    ...action,
                    onPress: () => onRowAction(row, action.key),
                  }))}
                />
              )}
            </TrackTableRow>
          ))}
        </TrackTable>
      </Section>

      {/* 段间 margin 23（覆盖 Section 缺省的 27，见 spec-lock 1.3.13 / 1.3.14）。 */}
      <Section title={creatorSectionTitle} className="[&+&]:mt-[23px] [&>header]:mb-[4px]">
        {creators.map(row => (
          <CreatorRow key={row.id} name={row.name} meta={row.meta} followed={row.followed} />
        ))}
      </Section>
    </div>
  </ScrollContainer>
);

/**
 * local-link 药丸（搜索框右端的「在本地音乐中搜索…」入口）。
 *
 * 材质取设计稿第 7 页实测（spec-lock `geometry.searchField.localLink`，1.3.13）：
 * 高 32、内距 15、间隙 8、白 10% 底（`--biu-surface-hover`）、**无描边**、强调蓝文字 +
 * `arrow-right` 图标。**不贴盒右缘**，右侧留 158px 空白（`rightInset`）—— 与原型
 * 「贴右 16px」分歧，实现按设计稿。这不是 `Button` / `Pill` 的既有变体
 * （`outline` 是 14% 底 + 12% 描边，`ghost` 文字是灰不是强调蓝），故单独成件。
 */
const LocalLink = ({ label, onPress }: { label: string; onPress: () => void }) => (
  <button
    type="button"
    onClick={onPress}
    className={twMerge(
      "mr-[var(--biu-layout-searchfield-link-right-inset)] inline-flex h-[var(--biu-layout-searchfield-link-h)]",
      "flex-none cursor-pointer items-center gap-[var(--biu-layout-searchfield-link-gap)]",
      "rounded-[var(--biu-radius-pill)] border-0 bg-[var(--biu-surface-hover)]",
      "px-[var(--biu-layout-searchfield-link-pad)] text-[length:var(--biu-type-label-size)]",
      "whitespace-nowrap text-[rgb(var(--biu-accent-ink))] transition-colors",
      "hover:bg-[var(--biu-surface-sunken)]",
    )}
  >
    {label}
    <Icon name="arrow-right" size="1em" />
  </button>
);

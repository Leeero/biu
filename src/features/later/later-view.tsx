import type { ReactNode, RefObject } from "react";

import ScrollContainer, { type ScrollRefObject } from "@/components/scroll-container";
import { FilterBar } from "@/ui/patterns/filter-bar";
import { InfoPanel } from "@/ui/patterns/info-panel";
import { InlineProgress } from "@/ui/patterns/inline-progress";
import { PageHeader } from "@/ui/patterns/page-header";
import { Section } from "@/ui/patterns/section";
import {
  TrackArt,
  TrackCell,
  TrackIndex,
  TrackMain,
  TrackTable,
  TrackTableActions,
  TrackTableRow,
  TrackText,
  type TrackActionSpec,
  type TrackTableColumn,
} from "@/ui/patterns/track-table";
import { Button } from "@/ui/primitives/button";
import { Pill } from "@/ui/primitives/pill";

/** 药丸种类：夹具与真实路径共用的展示形状（比屏 02 多一档 danger）。 */
export type LaterViewPillKind = "primary" | "secondary" | "neutral" | "accent" | "danger";

export interface LaterViewPill {
  kind: LaterViewPillKind;
  label: string;
}

/** 曲目行：夹具与真实路径汇成的同一视图模型。 */
export interface LaterTrackRow {
  id: string;
  index: number;
  title: string;
  subtitle: string;
  /** 第三列「@UP 主 · 加入时间」。 */
  cell: string;
  /** 第四列「进度」：62% / 未看 / 时长。 */
  progress: string;
  /** 仍在观看中的量化进度；未看不画条，已看完为 100。 */
  progressPercent?: number;
  /** 真实封面地址（真实路径）。夹具不用它，走 placeholder。 */
  art?: string;
  /** 稳定占位键（真实路径用领域 ID）。 */
  artKey?: string;
  /** 显式占位渐变（夹具：artIndex 指向 placeholder-art 的 gradients）。 */
  placeholder?: string;
}

export interface LaterViewProps {
  title: string;
  lead: ReactNode;
  /** 右栏同步状态面板。 */
  panelEyebrow: ReactNode;
  panelItems: ReactNode[];
  pills: LaterViewPill[];
  sectionTitle: string;
  columns: TrackTableColumn[];
  tracks: LaterTrackRow[];
  /** 行内操作带的动作（播放 / 下一首 / 入队 / 收藏 / 下载）。五枚并列，无主操作档。 */
  rowActions: readonly TrackActionSpec[];
  /** 常驻露出操作带的行 id（夹具演示位：设计稿第 04 行）。 */
  demoActionRowIds: string[];
  onPillPress: (pill: LaterViewPill) => void;
  onRowAction: (row: LaterTrackRow, actionKey: string) => void;
  scrollRef?: RefObject<ScrollRefObject | null>;
  onReachEnd?: () => void;
}

/**
 * 表头列定义（屏 03）。**四个标签由夹具给出（那是数据），列位与内缩在这里
 * （那是几何）** —— 与屏 08 的 `discoverListColumns` 同一分工。
 *
 * 只有第二列带 `inset`：行内「缩略图 + 标题/副标题」那一列的表头标签，设计稿
 * 把它对齐到文字列（第 4 页实测 x240，与其余各页一致）而不是列起点（x120）。
 * 四个 `key` 与 `TrackTable` 的 `base` 变体模板逐列对应。
 */
export const laterColumns = (labels: readonly string[]): TrackTableColumn[] => [
  { key: "index", label: labels[0] },
  { key: "content", label: labels[1], inset: "var(--biu-layout-head-title-inset)" },
  { key: "owner", label: labels[2] },
  { key: "progress", label: labels[3], align: "end" },
];

/**
 * 「稍后播放」的呈现层（C+ 第 03 屏）。
 *
 * 数据装配在 `pages/later` —— 真实路径（getHistoryToViewList 的分页 /
 * 日期范围 / 关键字）与 `?fixture=03-watch-later` 夹具路径在这里汇成同一组
 * props，渲染代码只有一份。结构对齐设计稿第 4 页：
 *
 *   两栏页头（标题 + 导语 + 筛选条 5 药丸 ‖ 右栏同步状态 320px）
 *   → 分组（标题 + 曲目表 4 行）。
 *
 * 与屏 02 不同：右栏**有** InfoPanel（同步状态，`.page-head--narrow`）；
 * 第四列是「进度」而非时长；药丸多一档 `danger`（清除已看完，真实路径有此能力，
 * 属可交互按钮而非静态药丸）。
 *
 * 注解带不在本组件里：`position: absolute; top 653` 的定位上下文是壳层
 * `<main>`，必须是滚动容器的兄弟节点（与屏 01/02 同款说明），由页面渲染。
 */
export const LaterView = ({
  title,
  lead,
  panelEyebrow,
  panelItems,
  pills,
  sectionTitle,
  columns,
  tracks,
  rowActions,
  demoActionRowIds,
  onPillPress,
  onRowAction,
  scrollRef,
  onReachEnd,
}: LaterViewProps) => (
  <ScrollContainer enableBackToTop ref={scrollRef} onReachEnd={onReachEnd} className="h-full w-full">
    <div className="w-full">
      <PageHeader
        title={title}
        lead={lead}
        asideWidth={320}
        aside={<InfoPanel eyebrow={panelEyebrow} items={panelItems} />}
      >
        <FilterBar label="稍后播放操作" gap="base">
          {pills.map(pill =>
            pill.kind === "primary" || pill.kind === "secondary" || pill.kind === "danger" ? (
              <Button key={pill.label} variant={pill.kind} onClick={() => onPillPress(pill)}>
                {pill.label}
              </Button>
            ) : (
              <Pill key={pill.label} variant={pill.kind}>
                {pill.label}
              </Pill>
            ),
          )}
        </FilterBar>
      </PageHeader>

      <Section title={sectionTitle}>
        <TrackTable columns={columns}>
          {tracks.map(row => (
            <TrackTableRow key={row.id} trackId={row.id}>
              <TrackIndex value={row.index} />
              <TrackMain>
                <TrackArt src={row.art} artKey={row.artKey} placeholder={row.placeholder} />
                <TrackText title={row.title} subtitle={row.subtitle} />
              </TrackMain>
              <TrackCell>{row.cell}</TrackCell>
              <TrackCell align="end">
                {row.progressPercent === undefined ? (
                  row.progress
                ) : (
                  <InlineProgress
                    label={row.progress}
                    percent={row.progressPercent}
                    orientation="inline"
                    barWidth="96px"
                    className="justify-end"
                  />
                )}
              </TrackCell>
              {demoActionRowIds.includes(row.id) && (
                <TrackTableActions
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
    </div>
  </ScrollContainer>
);

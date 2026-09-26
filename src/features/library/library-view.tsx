import type { ReactNode } from "react";

import ScrollContainer from "@/components/scroll-container";
import { FilterBar } from "@/ui/patterns/filter-bar";
import { InfoPanel } from "@/ui/patterns/info-panel";
import { MediaGrid } from "@/ui/patterns/media-grid";
import { MediaTile } from "@/ui/patterns/media-tile";
import { PageHeader } from "@/ui/patterns/page-header";
import { Section } from "@/ui/patterns/section";
import { Button } from "@/ui/primitives/button";
import { Pill } from "@/ui/primitives/pill";

import type { LibraryTile } from "./model";

import { LIBRARY_TILE_ACTIONS } from "./fixture";

export interface LibraryViewProps {
  lead: ReactNode;
  overviewLines: string[];
  qualityPillText: string;
  createdTiles: LibraryTile[];
  collectedTiles: LibraryTile[];
  /** 操作带常驻露出的瓦片 key（夹具演示位；真实模式为空 —— 露出交给悬停）。 */
  demoActionKeys: string[];
  onTilePress: (tile: LibraryTile) => void;
  /** 瓦片操作带的动作。actionKey 为 LIBRARY_TILE_ACTIONS 的 key。 */
  onTileAction: (tile: LibraryTile, actionKey: string) => void;
  onPlayAll: () => void;
  onShuffleAll: () => void;
  /** 批量动作执行中（按钮 loading）。 */
  bulkPending?: boolean;
}

const renderTile = (
  tile: LibraryTile,
  demo: boolean,
  onTilePress: LibraryViewProps["onTilePress"],
  onTileAction: LibraryViewProps["onTileAction"],
) => (
  <MediaTile
    key={tile.key}
    title={tile.title}
    meta={tile.meta}
    art={tile.cover}
    artGradient={tile.coverGradient}
    artKey={tile.artKey}
    badge={tile.badge}
    badgeVariant={tile.badgeVariant}
    actions={LIBRARY_TILE_ACTIONS.map(action => ({
      key: action.key,
      label: action.label,
      icon: action.icon,
      onPress: () => onTileAction(tile, action.key),
    }))}
    forceActionsVisible={demo}
    onPress={() => onTilePress(tile)}
  />
);

/**
 * 「我的音乐库」的呈现层（C+ 第 01 屏）。
 *
 * 数据装配在 `pages/library` —— 真实路径与 `?fixture=01-library` 夹具路径
 * 在这里汇成同一组 props，渲染代码只有一份。结构对齐设计稿第 2 页：
 * 两栏页头（左标题列 + 右库概览面板）→ 两个瓦片分组。
 *
 * 注解带**不在本组件里**：它 `position: absolute; top 693`，定位上下文是
 * 壳层的 `<main>`（相对内容区顶部 71 的权威值见 spec-lock noteTop），
 * 必须是滚动容器的兄弟节点 —— 放进滚动内容里它会随内容滚走，
 * 而设计稿里它是叠在内容之上的固定层（滚动时行从它下面经过）。
 */
export const LibraryView = ({
  lead,
  overviewLines,
  qualityPillText,
  createdTiles,
  collectedTiles,
  demoActionKeys,
  onTilePress,
  onTileAction,
  onPlayAll,
  onShuffleAll,
  bulkPending = false,
}: LibraryViewProps) => (
  // 壳层的 <main> 已是地标，这里用 div，不再嵌套第二个 main。
  <ScrollContainer enableBackToTop className="h-full w-full">
    <div className="w-full">
      <PageHeader
        title="我的音乐库"
        lead={lead}
        leadOffset="low"
        aside={<InfoPanel eyebrow="库概览" items={overviewLines} />}
      >
        <FilterBar label="音乐库操作" gap="tight">
          <Button variant="primary" loading={bulkPending} onClick={onPlayAll}>
            全部播放
          </Button>
          <Button variant="secondary" disabled={bulkPending} onClick={onShuffleAll}>
            随机播放
          </Button>
          <Pill variant="neutral">{qualityPillText}</Pill>
        </FilterBar>
      </PageHeader>

      {createdTiles.length > 0 && (
        <Section title={`我创建的 · ${createdTiles.length} 个播放列表`}>
          <MediaGrid columns={4}>
            {createdTiles.map(tile => renderTile(tile, demoActionKeys.includes(tile.key), onTilePress, onTileAction))}
          </MediaGrid>
        </Section>
      )}

      {collectedTiles.length > 0 && (
        <Section title={`我收藏的 · ${collectedTiles.length} 个播放列表`}>
          <MediaGrid columns={4}>
            {collectedTiles.map(tile => renderTile(tile, demoActionKeys.includes(tile.key), onTilePress, onTileAction))}
          </MediaGrid>
        </Section>
      )}
    </div>
  </ScrollContainer>
);

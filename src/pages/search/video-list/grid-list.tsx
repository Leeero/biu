import React, { useCallback } from "react";

import type { Track } from "@/domain/track";

import { toPlayItem } from "@/adapters/track/actions";
import MusicCard from "@/components/music-card";
import VirtualGridPageList from "@/components/virtual-grid-page-list";
import { usePlayList } from "@/store/play-list";

import { getContextMenus } from "./menu";

interface GridListProps {
  items: Track[];
  getScrollElement: () => HTMLElement | null;
  onMenuAction: (key: string, item: Track) => void;
  loading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
}

const GridList: React.FC<GridListProps> = ({ items, getScrollElement, onMenuAction, loading, hasMore, onLoadMore }) => {
  const renderGridItem = useCallback(
    (item: Track) => {
      return (
        <MusicCard
          key={item.id}
          title={item.title}
          cover={item.cover || ""}
          playCount={item.playCount}
          duration={item.duration}
          ownerName={item.creator?.name}
          ownerMid={item.creator?.id ? Number(item.creator.id) || undefined : undefined}
          time={item.publishedAt ? Date.parse(item.publishedAt) / 1000 : undefined}
          menus={getContextMenus()}
          onMenuAction={key => {
            onMenuAction(key, item);
          }}
          onPress={() => {
            usePlayList.getState().play(toPlayItem(item));
          }}
        />
      );
    },
    [onMenuAction],
  );

  return (
    <VirtualGridPageList
      items={items}
      itemKey="id"
      renderItem={renderGridItem}
      getScrollElement={getScrollElement}
      loading={loading}
      hasMore={hasMore}
      onLoadMore={onLoadMore}
    />
  );
};

export default GridList;

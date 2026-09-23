import React, { useCallback } from "react";

import type { Track } from "@/domain/track";

import { toPlayItem } from "@/adapters/track/actions";
import MusicListHeader from "@/components/music-list-item/header";
import VirtualPageList from "@/components/virtual-page-list";
import { usePlayList } from "@/store/play-list";
import { useSettings } from "@/store/settings";
import { TrackRow } from "@/ui/patterns/track-row";

import { getContextMenus } from "./menu";

interface ListProps {
  items: Track[];
  getScrollElement: () => HTMLElement | null;
  onMenuAction: (key: string, item: Track) => void;
  loading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
}

const List: React.FC<ListProps> = ({ items, getScrollElement, onMenuAction, loading, hasMore, onLoadMore }) => {
  const displayMode = useSettings(state => state.displayMode);
  const isCompact = displayMode === "compact";

  const handlePress = useCallback((item: Track) => {
    usePlayList.getState().play(toPlayItem(item));
  }, []);

  return (
    <div className="w-full">
      <MusicListHeader />
      <VirtualPageList
        items={items}
        hasMore={hasMore}
        loading={loading}
        onLoadMore={onLoadMore}
        getScrollElement={getScrollElement}
        rowHeight={isCompact ? 36 : 64}
        renderItem={(item, index) => {
          return (
            <TrackRow
              key={item.id}
              index={index + 1}
              track={item}
              onPlay={() => handlePress(item)}
              actions={getContextMenus()}
              onAction={key => onMenuAction(key, item)}
            />
          );
        }}
      />
    </div>
  );
};

export default List;

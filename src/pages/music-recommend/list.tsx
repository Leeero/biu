import React, { useCallback } from "react";

import type { Track } from "@/domain/track";

import { toPlayItem } from "@/adapters/track/actions";
import MusicListHeader from "@/components/music-list-item/header";
import VirtualPageList from "@/components/virtual-page-list";
import { usePlayList } from "@/store/play-list";
import { useSettings } from "@/store/settings";
import { useUser } from "@/store/user";
import { TrackRow } from "@/ui/patterns/track-row";

import { getContextMenus } from "./menu";

interface MusicRecommendListProps {
  items: Track[];
  hasMore: boolean;
  loading: boolean;
  onLoadMore: () => void;
  getScrollElement: () => HTMLElement | null;
  onMenuAction: (key: string, item: Track) => void;
}

const MusicRecommendList: React.FC<MusicRecommendListProps> = ({
  items,
  hasMore,
  loading,
  onLoadMore,
  getScrollElement,
  onMenuAction,
}) => {
  const user = useUser(state => state.user);
  const displayMode = useSettings(state => state.displayMode);
  const isCompact = displayMode === "compact";

  const handlePress = useCallback((item: Track) => {
    if (!item.sourceRef.bvid) return;
    usePlayList.getState().play(toPlayItem(item));
  }, []);

  return (
    <div className="w-full">
      <MusicListHeader hidePubTime />
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
              hidePublishedAt
              key={item.id}
              track={item}
              index={index + 1}
              onPlay={() => handlePress(item)}
              actions={getContextMenus({
                isLogin: user?.isLogin,
              })}
              onAction={key => onMenuAction(key, item)}
            />
          );
        }}
      />
    </div>
  );
};

export default MusicRecommendList;

import React, { useCallback } from "react";

import type { Track } from "@/domain/track";

import { toPlayItem } from "@/adapters/track/actions";
import MusicCard from "@/components/music-card";
import VirtualGridPageList from "@/components/virtual-grid-page-list";
import { usePlayList } from "@/store/play-list";
import { useUser } from "@/store/user";

import { getContextMenus } from "./menu";

interface MusicRecommendGridListProps {
  items: Track[];
  hasMore: boolean;
  loading: boolean;
  onLoadMore: () => void;
  getScrollElement: () => HTMLElement | null;
  onMenuAction: (key: string, item: Track) => void;
}

const MusicRecommendGridList: React.FC<MusicRecommendGridListProps> = ({
  items,
  hasMore,
  loading,
  onLoadMore,
  getScrollElement,
  onMenuAction,
}) => {
  const user = useUser(state => state.user);

  const renderGridItem = useCallback(
    (item: Track) => {
      return (
        <MusicCard
          key={item.id}
          title={item.title}
          cover={item.cover}
          playCount={item.playCount}
          duration={item.duration}
          ownerName={item.creator?.name}
          ownerMid={item.creator?.id ? Number(item.creator.id) || undefined : undefined}
          menus={getContextMenus({
            isLogin: user?.isLogin,
          })}
          onMenuAction={key => {
            onMenuAction(key, item);
          }}
          onPress={() => {
            if (!item.sourceRef.bvid) return;
            usePlayList.getState().play(toPlayItem(item));
          }}
        />
      );
    },
    [onMenuAction, user?.isLogin],
  );

  return (
    <VirtualGridPageList
      items={items}
      hasMore={hasMore}
      loading={loading}
      itemKey="id"
      renderItem={renderGridItem}
      getScrollElement={getScrollElement}
      onLoadMore={onLoadMore}
    />
  );
};

export default MusicRecommendGridList;

import React, { useCallback } from "react";

import type { SpaceArcVListItem } from "@/service/space-wbi-arc-search";

import { adaptCreatorPostToTrack } from "@/adapters/track/creator";
import MusicCard from "@/components/music-card";
import VirtualGridPageList from "@/components/virtual-grid-page-list";
import { executeTrackAction } from "@/features/track/actions";

import { getContextMenus } from "./menu";

interface PostGridListProps {
  items: SpaceArcVListItem[];
  hasMore: boolean;
  loading: boolean;
  onLoadMore: () => void;
  getScrollElement: () => HTMLElement | null;
  onMenuAction: (key: string, item: SpaceArcVListItem) => void;
}

const PostGridList: React.FC<PostGridListProps> = ({
  items,
  hasMore,
  loading,
  onLoadMore,
  getScrollElement,
  onMenuAction,
}) => {
  const renderGridItem = useCallback(
    (item: SpaceArcVListItem) => {
      return (
        <MusicCard
          key={item.bvid}
          title={item.title}
          cover={item.pic}
          playCount={item.play}
          duration={item.length}
          ownerName={item.author}
          ownerMid={item.mid}
          time={item.created}
          menus={getContextMenus()}
          onMenuAction={key => {
            onMenuAction(key, item);
          }}
          onPress={() => {
            void executeTrackAction("play", adaptCreatorPostToTrack(item));
          }}
        />
      );
    },
    [onMenuAction],
  );

  return (
    <VirtualGridPageList
      items={items}
      hasMore={hasMore}
      loading={loading}
      itemKey="bvid"
      renderItem={renderGridItem}
      getScrollElement={getScrollElement}
      onLoadMore={onLoadMore}
    />
  );
};

export default PostGridList;

import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";

import { addToast } from "@heroui/react";

import { adaptCreatedFavoriteToPlaylist } from "@/adapters/playlist/favorite";
import { CollectionType } from "@/common/constants/collection";
import VirtualGridPageList from "@/components/virtual-grid-page-list";
import { getFavFolderCreatedList, type FavFolderCreatedList } from "@/service/fav-folder-created-list";
import { PlaylistCard } from "@/ui/patterns/playlist-card";
import { PageState } from "@/ui/states/page-state";

interface Props {
  getScrollElement: () => HTMLElement | null;
}

/** 收藏夹 */
const Favorites = ({ getScrollElement }: Props) => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [list, setList] = useState<FavFolderCreatedList[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [initialLoading, setInitialLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadError, setLoadError] = useState(false);

  const fetchPage = useCallback(
    async (pn: number) => {
      if (!id) return { items: [], total: 0 };
      const res = await getFavFolderCreatedList({
        up_mid: Number(id),
        ps: 20,
        pn,
      });
      const items = res?.data?.list ?? [];
      const total = res?.data?.count ?? 0;
      return { items, total };
    },
    [id],
  );

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    try {
      setLoadingMore(true);
      const nextPage = page + 1;
      const { items, total } = await fetchPage(nextPage);
      setList(prev => {
        const newList = [...prev, ...items];
        setHasMore(newList.length < total);
        return newList;
      });
      setPage(nextPage);
    } catch {
      addToast({ title: "加载更多失败", color: "danger" });
    } finally {
      setLoadingMore(false);
    }
  }, [page, loadingMore, hasMore, fetchPage]);

  const retryInitial = useCallback(async () => {
    if (!id) return;
    try {
      setInitialLoading(true);
      setLoadError(false);
      setPage(1);
      const { items, total } = await fetchPage(1);
      setList(items);
      setHasMore(items.length < total);
    } catch {
      setLoadError(true);
      addToast({ title: "加载失败", color: "danger" });
    } finally {
      setInitialLoading(false);
    }
  }, [fetchPage, id]);

  useEffect(() => {
    retryInitial();
  }, [retryInitial]);

  if (initialLoading) {
    return <PageState kind="loading" className="min-h-[280px]" />;
  }

  if (loadError) {
    return <PageState kind="error" actionLabel="重新加载" onAction={() => void retryInitial()} />;
  }

  if (!list.length) {
    return <PageState kind="empty" title="暂无公开收藏夹" description="该用户还没有公开的音乐收藏夹" />;
  }

  return (
    <VirtualGridPageList
      items={list}
      loading={loadingMore}
      hasMore={hasMore}
      onLoadMore={loadMore}
      getScrollElement={getScrollElement}
      itemKey="id"
      renderItem={item => {
        const playlist = adaptCreatedFavoriteToPlaylist(item);
        return (
          <PlaylistCard
            playlist={playlist}
            onPress={() => navigate(`/collection/${item.id}?type=${CollectionType.Favorite}`)}
          />
        );
      }}
    />
  );
};

export default Favorites;

import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router";

import { Button } from "@heroui/react";
import { RiHistoryLine } from "@remixicon/react";

import ScrollContainer from "@/components/scroll-container";
import { adaptFavoriteItemToPlaylist, getFavoriteItemHref } from "@/features/library/model";
import { useFavoritesStore } from "@/store/favorite";
import { useUser } from "@/store/user";
import { PageHeader } from "@/ui/patterns/page-header";
import { PlaylistCard } from "@/ui/patterns/playlist-card";
import { PageState } from "@/ui/states/page-state";

const Library = () => {
  const navigate = useNavigate();
  const user = useUser(state => state.user);
  const createdFavorites = useFavoritesStore(state => state.createdFavorites);
  const collectedFavorites = useFavoritesStore(state => state.collectedFavorites);
  const updateCreatedFavorites = useFavoritesStore(state => state.updateCreatedFavorites);
  const updateCollectedFavorites = useFavoritesStore(state => state.updateCollectedFavorites);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);

  const refresh = useCallback(async () => {
    if (!user?.mid) return;
    setLoading(true);
    setLoadError(false);
    try {
      await Promise.all([updateCreatedFavorites(user.mid), updateCollectedFavorites(user.mid)]);
    } catch {
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, [updateCollectedFavorites, updateCreatedFavorites, user?.mid]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  if (!user?.isLogin) {
    return <PageState kind="empty" title="登录后查看我的收藏" description="收藏内容同步自当前 B 站账号" />;
  }

  return (
    <ScrollContainer enableBackToTop className="h-full w-full">
      <main className="w-full py-5">
        <PageHeader
          title="我的收藏"
          description="集中查看你创建和收藏的播放列表，内容同步自 B 站收藏夹与合集。"
          actions={
            <Button
              variant="flat"
              size="sm"
              startContent={<RiHistoryLine size={17} />}
              onPress={() => navigate("/history")}
            >
              B站历史
            </Button>
          }
        />

        {loading && !createdFavorites.length && !collectedFavorites.length ? (
          <PageState kind="loading" className="min-h-[320px]" />
        ) : loadError ? (
          <PageState kind="error" actionLabel="重新加载" onAction={() => void refresh()} />
        ) : !createdFavorites.length && !collectedFavorites.length ? (
          <PageState kind="empty" title="暂无收藏内容" description="在 B 站创建或收藏的播放列表会显示在这里" />
        ) : (
          <div className="space-y-9 pb-8">
            {createdFavorites.length > 0 && (
              <section aria-labelledby="created-playlists-title">
                <div className="mb-4 flex items-baseline gap-2">
                  <h2 id="created-playlists-title" className="text-lg font-semibold">
                    我创建的
                  </h2>
                  <span className="text-xs text-[rgb(var(--biu-color-text-tertiary))]">
                    {createdFavorites.length} 个播放列表
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-x-5 gap-y-7 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
                  {createdFavorites.map(item => (
                    <PlaylistCard
                      key={item.id}
                      playlist={adaptFavoriteItemToPlaylist(item, true)}
                      onPress={() => navigate(getFavoriteItemHref(item))}
                    />
                  ))}
                </div>
              </section>
            )}

            {collectedFavorites.length > 0 && (
              <section aria-labelledby="collected-playlists-title">
                <div className="mb-4 flex items-baseline gap-2">
                  <h2 id="collected-playlists-title" className="text-lg font-semibold">
                    我收藏的
                  </h2>
                  <span className="text-xs text-[rgb(var(--biu-color-text-tertiary))]">
                    {collectedFavorites.length} 个播放列表
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-x-5 gap-y-7 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
                  {collectedFavorites.map(item => (
                    <PlaylistCard
                      key={`${item.type ?? "favorite"}-${item.id}`}
                      playlist={adaptFavoriteItemToPlaylist(item, false)}
                      onPress={() => navigate(getFavoriteItemHref(item))}
                    />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </main>
    </ScrollContainer>
  );
};

export default Library;

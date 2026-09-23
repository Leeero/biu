import { RiPlayFill, RiPlayListAddLine } from "@remixicon/react";

import type { PlaylistSource } from "@/domain/playlist";

import { CollectionType } from "@/common/constants/collection";
import { isDefaultFav } from "@/common/utils/fav";
import AsyncButton from "@/components/async-button";
import IconButton from "@/components/icon-button";
import SearchWithSort, { type SearchProps } from "@/components/search-with-sort";
import { getPlaylistCapabilities } from "@/features/playlist/capabilities";
import { useUser } from "@/store/user";

import FavToggle, { type FavToggleProps } from "./fav-toggle";
import Menu, { type MenuProps } from "./menu";

interface Props extends FavToggleProps, SearchProps, MenuProps {
  loading?: boolean;
  onPlayAll: () => void;
  onAddToPlayList: () => void;
}

const Operations = ({
  loading,
  type,
  mediaCount,
  attr,
  isFavorite,
  isCreatedBySelf,
  onKeywordSearch,
  orderOptions,
  order,
  onOrderChange,
  onToggleFavorite,
  onPlayAll,
  onAddToPlayList,
  onClearInvalid,
}: Props) => {
  const isLoggedIn = useUser(state => Boolean(state.user?.isLogin));
  const source: PlaylistSource =
    type === CollectionType.Favorite
      ? "favorite-folder"
      : type === CollectionType.VideoCollections
        ? "season"
        : "series";
  const capabilities = getPlaylistCapabilities({
    source,
    isLoggedIn,
    isOwnedByCurrentUser: isCreatedBySelf === true,
    hasTracks: Boolean(mediaCount),
    isDefaultPlaylist: type === CollectionType.Favorite && isDefaultFav(attr),
  });

  return (
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-[rgb(var(--biu-color-border)/0.08)] pb-4">
      <div className="flex items-center space-x-2">
        <AsyncButton
          color="primary"
          startContent={<RiPlayFill size={22} />}
          onPress={onPlayAll}
          isDisabled={!capabilities.canPlay}
          className="dark:text-black"
        >
          播放全部
        </AsyncButton>
        <IconButton
          size="md"
          variant="flat"
          tooltip="添加到播放列表"
          isDisabled={!capabilities.canAddToQueue}
          onPress={onAddToPlayList}
        >
          <RiPlayListAddLine size={18} />
        </IconButton>
        {!loading && capabilities.canFavorite && (
          <FavToggle isFavorite={isFavorite} onToggleFavorite={onToggleFavorite} />
        )}
        <Menu
          type={type}
          isCreatedBySelf={isCreatedBySelf}
          mediaCount={mediaCount}
          attr={attr}
          onClearInvalid={onClearInvalid}
        />
      </div>
      <SearchWithSort
        onKeywordSearch={onKeywordSearch}
        orderOptions={orderOptions}
        order={order}
        onOrderChange={onOrderChange}
      />
    </div>
  );
};

export default Operations;

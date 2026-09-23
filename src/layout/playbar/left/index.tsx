import React, { useMemo } from "react";
import { useNavigate } from "react-router";

import { Chip } from "@heroui/react";
import { RiArrowUpSLine, RiMusic2Line } from "@remixicon/react";
import clsx from "classnames";

import Image from "@/components/image";
import MusicFavButton from "@/components/music-fav-button";
import MusicMoreMenu from "@/components/music-more-menu";
import { usePlayerActions } from "@/features/player/use-player-actions";
import { usePlayList } from "@/store/play-list";
import { useUser } from "@/store/user";

import PageListDrawer from "./page-list";

const LeftControl = () => {
  const navigate = useNavigate();
  const user = useUser(s => s.user);
  const { openNowPlaying } = usePlayerActions();
  const list = usePlayList(s => s.list);
  const playId = usePlayList(s => s.playId);

  const playItem = useMemo(() => list.find(item => item.id === playId), [list, playId]);
  return (
    <div className="flex h-full w-full min-w-0 items-center justify-start gap-3 pr-4">
      <button
        type="button"
        aria-label="打开全屏播放器"
        data-id="full-screen-player-open"
        className="group relative flex-none cursor-pointer rounded-[var(--biu-radius-md)]"
        onClick={openNowPlaying}
      >
        <Image
          radius="md"
          src={playItem?.pageCover || playItem?.cover}
          width={52}
          height={52}
          classNames={{
            wrapper: "flex-none",
          }}
          params="672w_378h_1c.avif"
          emptyPlaceholder={<RiMusic2Line />}
        />
        <div className="absolute top-0 left-0 z-10 flex h-full w-full items-center justify-center overflow-hidden rounded-md bg-black/55 text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
          <RiArrowUpSLine size={32} />
        </div>
      </button>
      <div className="flex min-w-0 flex-1 flex-col items-start gap-1">
        <span className="flex w-full items-center">
          <span title={playItem?.pageTitle || playItem?.title} className="min-w-0 flex-1 truncate text-sm font-medium">
            {playItem?.pageTitle || playItem?.title}
          </span>
          {Boolean(playItem?.isLossless) && (
            <Chip size="sm" className="h-auto px-0 py-0.5 text-[10px]">
              无损
            </Chip>
          )}
          {Boolean(playItem?.isDolby) && (
            <Chip size="sm" className="h-auto px-0 py-0.5 text-[10px]">
              杜比
            </Chip>
          )}
        </span>
        <span
          className={clsx("max-w-full truncate text-xs whitespace-nowrap text-[rgb(var(--biu-color-text-secondary))]", {
            "cursor-pointer hover:underline": Boolean(playItem?.ownerMid),
          })}
          onClick={e => {
            if (playItem?.source === "local" || !playItem?.ownerMid) return;
            e.stopPropagation();
            navigate(`/user/${playItem?.ownerMid}`);
          }}
        >
          {playItem?.source === "local" ? "本地音乐" : playItem?.ownerName || "未知"}
        </span>
      </div>
      <div className="flex flex-none items-center gap-0.5">
        {Boolean(playItem?.hasMultiPart) && <PageListDrawer />}
        {Boolean(user?.isLogin) && Boolean(playItem) && playItem?.source !== "local" && <MusicFavButton />}
        {Boolean(playItem) && playItem?.source !== "local" && <MusicMoreMenu />}
      </div>
    </div>
  );
};

export default LeftControl;

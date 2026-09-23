import React, { useCallback, useMemo, useRef } from "react";

import { addToast, Drawer, DrawerBody, DrawerContent, DrawerHeader } from "@heroui/react";
import { RiDeleteBinLine, RiFocus3Line } from "@remixicon/react";

import { openBiliVideoLink } from "@/common/utils/url";
import { type ScrollRefObject } from "@/components/scroll-container";
import { VirtualList } from "@/components/virtual-list";
import { getUniqueQueueItems } from "@/features/player/queue";
import { usePlayerActions } from "@/features/player/use-player-actions";
import { useModalStore } from "@/store/modal";
import { isSame, usePlayList, type PlayData } from "@/store/play-list";
import { useUser } from "@/store/user";

import Empty from "../empty";
import IconButton from "../icon-button";
import ListItem from "./list-item";

const RowHeight = 68;

const PlayListDrawer = () => {
  const scrollRef = useRef<ScrollRefObject | null>(null);
  const isOpen = useModalStore(s => s.isPlayListDrawerOpen);
  const setOpen = useModalStore(s => s.setPlayListDrawerOpen);
  const list = usePlayList(s => s.list);
  const playId = usePlayList(s => s.playId);
  const user = useUser(s => s.user);
  const { clearQueue, playQueueItem } = usePlayerActions();

  const playItem = useMemo(() => list.find(item => item.id === playId), [list, playId]);
  const pureList = useMemo(() => getUniqueQueueItems(list), [list]);

  const handleAction = useCallback(async (key: string, item: PlayData) => {
    switch (key) {
      case "favorite":
        useModalStore.getState().onOpenFavSelectModal({
          rid: item.id,
          type: item.type === "mv" ? 2 : 12,
          title: item.title,
        });
        break;
      case "download-audio":
        await window.electron.addMediaDownloadTask({
          outputFileType: "audio",
          title: item.title,
          cover: item.cover,
          bvid: item.bvid,
          sid: item.type === "audio" ? item.id : undefined,
        });
        addToast({
          title: "已添加下载任务",
          color: "success",
        });
        break;
      case "download-video":
        await window.electron.addMediaDownloadTask({
          outputFileType: "video",
          title: item.title,
          cover: item.cover,
          bvid: item.bvid,
        });
        addToast({
          title: "已添加下载任务",
          color: "success",
        });
        break;
      case "bililink":
        openBiliVideoLink(item);
        break;
      case "del":
        usePlayList.getState().del(item.id);
        break;
      default:
        break;
    }
  }, []);

  const scrollToPlayItem = useCallback(() => {
    if (!playItem) {
      addToast({ title: "当前没有正在播放的歌曲", color: "warning" });
      return;
    }

    const targetIndex =
      playItem?.source === "local"
        ? pureList.findIndex(item => item.id === playItem.id)
        : pureList.findIndex(item => isSame(playItem, item));
    if (targetIndex < 0) {
      addToast({ title: "未在列表中找到当前播放的歌曲", color: "warning" });
      return;
    }

    const viewport = scrollRef.current?.osInstance()?.elements().viewport as HTMLElement | null;
    if (!viewport) {
      return;
    }

    const targetTop = targetIndex * RowHeight;
    const maxTop = Math.max(0, viewport.scrollHeight - viewport.clientHeight);
    const nextTop = Math.min(targetTop, maxTop);

    if (typeof viewport.scrollTo === "function") {
      viewport.scrollTo({ top: nextTop, behavior: "smooth" });
    } else {
      viewport.scrollTop = nextTop;
    }
  }, [playItem, pureList]);

  return (
    <Drawer
      radius="none"
      shadow="lg"
      backdrop="transparent"
      size="sm"
      hideCloseButton
      disableAnimation
      isOpen={isOpen}
      onOpenChange={setOpen}
      classNames={{
        backdrop: "z-200 window-no-drag",
        wrapper: "z-200 window-no-drag",
        base: "border-l border-[rgb(var(--biu-color-border)/0.08)] bg-[rgb(var(--biu-color-surface-raised))] data-[placement=right]:mb-[var(--biu-player-height)]",
      }}
    >
      <DrawerContent className="outline-none focus-visible:outline-none">
        <DrawerHeader className="flex flex-row items-center justify-between gap-3 border-b border-[rgb(var(--biu-color-border)/0.08)] px-5 py-4">
          <div className="min-w-0">
            <h2 className="text-lg font-semibold tracking-[-0.01em]">播放列表</h2>
            <p className="mt-0.5 text-xs font-normal text-[rgb(var(--biu-color-text-tertiary))]">
              {pureList?.length || 0} 首歌曲
            </p>
          </div>
          <div className="flex items-center">
            {Boolean(pureList?.length) && (
              <>
                <IconButton aria-label="定位当前播放" tooltip="定位当前播放" onPress={scrollToPlayItem}>
                  <RiFocus3Line size={16} />
                </IconButton>
                <IconButton
                  aria-label="清空播放列表"
                  tooltip="清空播放列表"
                  onPress={clearQueue}
                  className="hover:text-danger"
                >
                  <RiDeleteBinLine size={16} />
                </IconButton>
              </>
            )}
          </div>
        </DrawerHeader>
        {list.length ? (
          <DrawerBody className="overflow-hidden px-0 py-2">
            <VirtualList
              className="h-full w-full px-3"
              scrollRef={scrollRef}
              data={pureList}
              itemHeight={RowHeight}
              renderItem={item => (
                <ListItem
                  data={item}
                  isLogin={Boolean(user?.isLogin)}
                  isPlaying={playItem?.source === "local" ? playItem?.id === item.id : isSame(playItem, item)}
                  onClose={() => setOpen(false)}
                  onPress={() => playQueueItem(item.id)}
                  onAction={key => handleAction(key, item)}
                />
              )}
            />
          </DrawerBody>
        ) : (
          <Empty />
        )}
      </DrawerContent>
    </Drawer>
  );
};

export default PlayListDrawer;

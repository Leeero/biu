import React, { useEffect, useMemo, useRef, useState } from "react";

import { Card, Spinner, addToast } from "@heroui/react";
import { RiArrowLeftSLine, RiArrowRightSLine, RiMusic2Line, RiPlayFill } from "@remixicon/react";
import log from "electron-log/renderer";

import type { Track } from "@/domain/track";

import { toPlayItem } from "@/adapters/track/actions";
import { adaptNewMusicBannerToTrack, adaptNewMusicToTrack, dedupeTracks } from "@/adapters/track/recommendation";
import { formatNumber } from "@/common/utils/number";
import IconButton from "@/components/icon-button";
import Image from "@/components/image";
import { getNewMusic } from "@/service/web-interface-new-music";
import { getNewMusicBanner } from "@/service/web-interface-new-music-banner";
import { usePlayList } from "@/store/play-list";

type NewMusicTopProps = {
  onLayoutChange?: () => void;
};

const NewMusicTop = ({ onLayoutChange }: NewMusicTopProps) => {
  const [items, setItems] = useState<Track[]>([]);
  const [newLoading, setNewLoading] = useState(true);
  const [newPage, setNewPage] = useState(1);
  const gridRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [colCount, setColCount] = useState(2);

  const handlePlay = React.useCallback((item: Track) => {
    usePlayList
      .getState()
      .play(toPlayItem(item))
      .catch(error => {
        log.error("[new-music-top] play error", error);
        addToast({ title: "播放失败", color: "danger" });
      });
  }, []);

  const fetchNewMusic = async () => {
    try {
      setNewLoading(true);
      const [bannerRes, listRes] = await Promise.all([getNewMusicBanner(), getNewMusic()]);
      const bannerList = bannerRes?.data?.list ?? [];
      const musicList = listRes?.data?.list ?? [];

      const normalizedBanner = bannerList.map((item, index) => adaptNewMusicBannerToTrack(item, `banner-${index}`));
      const normalizedMusic = musicList.map((item, index) => adaptNewMusicToTrack(item, `music-${index}`));

      setItems(dedupeTracks([...normalizedBanner, ...normalizedMusic]));
      setNewPage(1);
    } catch (error) {
      log.error("[new-music-top] fetchNewMusic error", error);
    } finally {
      setNewLoading(false);
    }
  };

  useEffect(() => {
    fetchNewMusic();
  }, []);

  useEffect(() => {
    if (!onLayoutChange) return;
    const target = containerRef.current;
    if (!target) return;
    let frameId: number | null = null;
    const observer = new ResizeObserver(() => {
      if (frameId !== null) {
        cancelAnimationFrame(frameId);
      }
      frameId = requestAnimationFrame(() => {
        onLayoutChange();
      });
    });
    observer.observe(target);
    return () => {
      observer.disconnect();
      if (frameId !== null) {
        cancelAnimationFrame(frameId);
      }
    };
  }, [onLayoutChange]);

  useEffect(() => {
    const computeColsByBreakpoint = () => {
      const w = window.innerWidth;
      if (w >= 1280) return 6;
      if (w >= 1024) return 5;
      if (w >= 768) return 4;
      if (w >= 640) return 3;
      return 2;
    };
    const update = () => {
      try {
        setColCount(computeColsByBreakpoint());
      } catch (err) {
        log.error("[new-music-top] compute cols error", err);
        setColCount(2);
      }
    };
    update();
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("resize", update);
    };
  }, []);

  const pageSize = useMemo(() => Math.max(1, colCount) * 2, [colCount]);
  const totalPages = useMemo(() => (items.length > 0 ? Math.ceil(items.length / pageSize) : 0), [items, pageSize]);

  useEffect(() => {
    if (totalPages > 0 && newPage > totalPages) {
      setNewPage(totalPages);
    }
    // eslint-disable-next-line
  }, [totalPages]);

  const pageItems = useMemo(() => {
    const start = (newPage - 1) * pageSize;
    const end = start + pageSize;
    return items.slice(start, end);
  }, [items, newPage, pageSize]);

  return (
    <section ref={containerRef} aria-labelledby="new-music-heading" className="mb-8 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-start gap-3">
          <div className="bg-primary/10 text-primary mt-0.5 flex h-9 w-9 items-center justify-center rounded-full">
            <RiMusic2Line size={20} />
          </div>
          <div>
            <h2 id="new-music-heading" className="text-xl font-semibold tracking-[-0.01em]">
              新歌速递
            </h2>
            <p className="mt-0.5 text-xs text-[rgb(var(--biu-color-text-tertiary))]">当前可获取的新歌与音乐内容</p>
          </div>
        </div>
        {newLoading ? null : (
          <div className="flex items-center gap-2">
            <IconButton
              isDisabled={newPage <= 1 || totalPages === 0}
              aria-label="上一页新歌"
              tooltip="上一页"
              onPress={() => setNewPage(p => Math.max(1, p - 1))}
              variant="flat"
              className="bg-foreground/10 hover:bg-foreground/20 shadow-none"
            >
              <RiArrowLeftSLine size={16} />
            </IconButton>
            <span className="min-w-10 text-center text-xs text-[rgb(var(--biu-color-text-secondary))] tabular-nums">{`${newPage} / ${totalPages}`}</span>
            <IconButton
              isDisabled={newPage >= totalPages || totalPages === 0}
              aria-label="下一页新歌"
              tooltip="下一页"
              onPress={() => setNewPage(p => Math.min(totalPages, p + 1))}
              variant="flat"
              className="bg-foreground/10 hover:bg-foreground/20 shadow-none"
            >
              <RiArrowRightSLine size={16} />
            </IconButton>
          </div>
        )}
      </div>
      {newLoading ? (
        <div className="flex h-[200px] items-center justify-center">
          <Spinner size="lg" label="Loading..." />
        </div>
      ) : (
        <div
          ref={gridRef}
          className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"
        >
          {pageItems.length === 0 ? (
            <Card className="col-span-full flex h-[200px] items-center justify-center rounded-[var(--biu-radius-lg)] bg-[rgb(var(--biu-color-surface))]">
              <span className="text-foreground-500">暂无数据</span>
            </Card>
          ) : (
            pageItems.map(item => {
              return (
                <div
                  key={item.id}
                  role="button"
                  tabIndex={0}
                  aria-label={`播放 ${item.title}`}
                  onClick={() => handlePlay(item)}
                  onKeyDown={event => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      handlePlay(item);
                    }
                  }}
                  className="group w-full cursor-pointer rounded-[var(--biu-radius-lg)] p-1.5 transition-colors select-none hover:bg-[rgb(var(--biu-color-surface-hover))]"
                >
                  <div className="relative aspect-square w-full">
                    <Image
                      radius="md"
                      src={item.cover || ""}
                      width="100%"
                      height="100%"
                      params="672w_378h_1c.avif"
                      emptyPlaceholder={<RiMusic2Line />}
                      removeWrapper
                      className="rounded-[var(--biu-radius-lg)] shadow-[var(--biu-shadow-card)]"
                    />
                    {typeof item.playCount === "number" && (
                      <div className="absolute inset-x-0 bottom-0 z-10 bg-linear-to-t from-black/80 via-black/40 to-transparent p-2 text-white">
                        <div className="line-clamp-1 text-xs">{`${formatNumber(item.playCount ?? 0)}播放`}</div>
                      </div>
                    )}
                    <div className="pointer-events-none absolute right-2 bottom-2 z-40 opacity-0 transition-opacity duration-200 ease-out group-hover:opacity-100 group-focus-visible:opacity-100">
                      <div className="bg-primary rounded-full shadow-[var(--biu-shadow-floating)]">
                        <div className="flex h-10 w-10 items-center justify-center">
                          <RiPlayFill className="text-black" size={26} />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 px-0.5 text-left">
                    <div className="group-hover:text-primary line-clamp-1 text-sm font-medium transition-colors">
                      {item.title}
                    </div>
                    {(item.creator?.name || item.publishedAt) && (
                      <div className="mt-1 truncate text-xs text-[rgb(var(--biu-color-text-secondary))] transition-colors">
                        {`${item.creator?.name ?? ""}${item.creator?.name && item.publishedAt ? " · " : ""}${item.publishedAt?.slice(0, 10) ?? ""}`}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </section>
  );
};

export default NewMusicTop;

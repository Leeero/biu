import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";

import { addToast } from "@heroui/react";

import type { Track } from "@/domain/track";

import { toFavoriteSelection, toMediaDownloadInfo, toPlayItem } from "@/adapters/track/actions";
import {
  adaptNewMusicBannerToTrack,
  adaptNewMusicToTrack,
  adaptRegionArchiveToTrack,
  dedupeTracks,
} from "@/adapters/track/recommendation";
import { formatNumber } from "@/common/utils/number";
import { formatDuration } from "@/common/utils/time";
import ScrollContainer from "@/components/scroll-container";
import {
  DiscoverListView,
  discoverListColumns,
  type DiscoverListTrackRow,
} from "@/features/discover/discover-list-view";
import { DiscoverView, type DiscoverAlbum, type DiscoverFilter } from "@/features/discover/discover-view";
import {
  useDiscoverFixtureData,
  useDiscoverFixtureName,
  useDiscoverListFixtureData,
} from "@/features/discover/fixture";
import { DISCOVER_LIST_TRACK_ACTIONS } from "@/features/discover/track-actions";
import { getNewMusic } from "@/service/web-interface-new-music";
import { getNewMusicBanner } from "@/service/web-interface-new-music-banner";
import { getRegionFeedRcmd } from "@/service/web-interface-region-feed-rcmd";
import { useModalStore } from "@/store/modal";
import { usePlayList } from "@/store/play-list";
import { useSettings } from "@/store/settings";
import { DISCOVER_CARD_FIXTURE_NAME } from "@/ui/fixtures/screen-07-discover-card";
import { DISCOVER_LIST_FIXTURE_NAME } from "@/ui/fixtures/screen-08-discover-list";
import { AnnotationBand } from "@/ui/patterns/annotation-band";
import { PageState } from "@/ui/states/page-state";

const toListRow = (track: Track, index: number): DiscoverListTrackRow => ({
  id: track.id,
  index: index + 1,
  title: track.title,
  subtitle: track.creator?.name ?? "未知创作者",
  stats: `${formatNumber(track.playCount) ?? "—"} 播放`,
  duration: typeof track.duration === "number" ? formatDuration(track.duration) : "—",
  art: track.cover,
  artKey: track.id,
});
const toAlbum = (track: Track, source: "region" | "module"): DiscoverAlbum => ({
  key: track.id,
  badge: "B站音乐",
  title: track.title,
  meta: track.creator?.name ?? "未知创作者",
  art: track.cover,
  artKey: track.id,
  tags: [{ key: "source", label: source === "region" ? "音乐分区" : "新歌", variant: "plain" }],
});

const MusicRecommendLive = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const source = searchParams.get("source") === "module" ? "module" : "region";
  const displayMode = useSettings(state => state.displayMode);
  const updateSettings = useSettings(state => state.update);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [featuredTrack, setFeaturedTrack] = useState<Track | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState("请稍后重试");

  const load = useCallback(async () => {
    setStatus("loading");
    setErrorMessage("请稍后重试");
    try {
      if (source === "module") {
        const [banner, music] = await Promise.all([getNewMusicBanner(), getNewMusic()]);
        const banners = (banner.data?.list ?? []).map((item, i) => adaptNewMusicBannerToTrack(item, `banner-${i}`));
        setFeaturedTrack(banners[0] ?? null);
        setTracks(
          dedupeTracks([
            ...banners.slice(1),
            ...(music.data?.list ?? []).map((item, i) => adaptNewMusicToTrack(item, `music-${i}`)),
          ]),
        );
      } else {
        const res = await getRegionFeedRcmd({
          display_id: 1,
          request_cnt: 15,
          from_region: 1003,
          device: "web",
          plat: 30,
          web_location: "333.40138",
        });
        if (res.code !== 0) throw new Error(res.message || `B站接口返回 ${res.code}`);
        setFeaturedTrack(null);
        setTracks((res.data?.archives ?? []).map((item, i) => adaptRegionArchiveToTrack(item, String(i))));
      }
      setStatus("ready");
    } catch (error) {
      setTracks([]);
      setErrorMessage(error instanceof Error ? error.message : "无法加载 B 站音乐分区");
      setStatus("error");
    }
  }, [source]);
  useEffect(() => void load(), [load]);

  const act = useCallback(async (track: Track, key: string) => {
    if (key === "play") return usePlayList.getState().play(toPlayItem(track));
    if (key === "play-next") return usePlayList.getState().addToNext(toPlayItem(track));
    if (key === "queue-add") return usePlayList.getState().addList([toPlayItem(track)]);
    if (key === "favorite") {
      const selection = toFavoriteSelection(track);
      if (selection) useModalStore.getState().onOpenFavSelectModal(selection);
      return;
    }
    if (key === "download-audio") {
      const task = toMediaDownloadInfo(track, "audio");
      if (task) await window.electron.addMediaDownloadTask(task);
      addToast({ title: "已添加下载任务", color: "success" });
    }
  }, []);

  const filters = useMemo<DiscoverFilter[]>(
    () => [
      {
        key: "region",
        label: "音乐分区",
        variant: source === "region" ? "primary" : "neutral",
        onPress: () => navigate("/?source=region"),
      },
      {
        key: "module",
        label: "新碟与新歌",
        variant: source === "module" ? "primary" : "neutral",
        onPress: () => navigate("/?source=module"),
      },
      {
        key: "mode",
        label: displayMode === "card" ? "列表视图" : "卡片视图",
        variant: "neutral",
        onPress: () => updateSettings({ displayMode: displayMode === "card" ? "list" : "card" }),
      },
    ],
    [displayMode, navigate, source, updateSettings],
  );

  if (status === "loading") return <PageState kind="loading" />;
  if (status === "error")
    return <PageState kind="error" description={errorMessage} actionLabel="重新加载" onAction={() => void load()} />;
  if (!tracks.length && !featuredTrack) return <PageState kind="empty" />;
  if (displayMode === "list") {
    const rows = (featuredTrack ? [featuredTrack, ...tracks] : tracks).map(toListRow);
    return (
      <DiscoverListView
        title="发现音乐"
        lead={source === "region" ? "浏览音乐分区最新内容。" : "浏览新碟与新歌推荐。"}
        filters={filters}
        sectionTitle={source === "region" ? "音乐分区推荐" : "新歌推荐"}
        columns={discoverListColumns(["#", "标题", "播放", "时长"])}
        tracks={rows}
        rowActions={DISCOVER_LIST_TRACK_ACTIONS}
        // 行内操作带只在夹具里常驻展示，用真实数据强制露出会遮住首行标题。
        demoActionRowIds={[]}
        onPillPress={filter => filter.onPress?.()}
        onRowAction={(row, key) => {
          const track = tracks.find(item => item.id === row.id);
          if (track) void act(track, key);
        }}
      />
    );
  }

  return (
    <ScrollContainer enableBackToTop className="h-full w-full">
      <DiscoverView
        title="发现音乐"
        lead={source === "region" ? "浏览音乐分区最新内容。" : "浏览新碟与新歌推荐。"}
        filters={filters}
        heroSectionTitle="新碟速递"
        hero={
          featuredTrack
            ? {
                badge: "B站音乐",
                ratioNote: "16:9",
                tag: "新碟推荐",
                title: featuredTrack.title,
                meta: featuredTrack.creator?.name ?? "未知创作者",
                tags: [],
                art: featuredTrack.cover,
                artKey: featuredTrack.id,
                onPlay: () => void act(featuredTrack, "play"),
              }
            : null
        }
        albumSectionTitle={source === "region" ? "音乐分区推荐" : "新歌推荐"}
        albums={tracks.slice(0, 9).map(track => toAlbum(track, source))}
        note={undefined}
      />
    </ScrollContainer>
  );
};

const FixtureDiscover = () => {
  const fixture = useDiscoverFixtureData();
  return fixture ? (
    <ScrollContainer enableBackToTop className="h-full w-full">
      <DiscoverView {...fixture} />
    </ScrollContainer>
  ) : null;
};
const FixtureDiscoverList = () => {
  const fixture = useDiscoverListFixtureData();
  return fixture ? (
    <>
      <DiscoverListView
        title={fixture.title}
        lead={fixture.lead}
        filters={fixture.filters}
        sectionTitle={fixture.sectionTitle}
        columns={discoverListColumns(fixture.head)}
        tracks={fixture.tracks}
        rowActions={DISCOVER_LIST_TRACK_ACTIONS}
        demoActionRowIds={fixture.demoActionRowIds}
        onPillPress={() => {}}
        onRowAction={() => {}}
      />
      <AnnotationBand>{fixture.note}</AnnotationBand>
    </>
  ) : null;
};

const MusicRecommend = () => {
  const fixture = useDiscoverFixtureName();
  if (fixture === DISCOVER_CARD_FIXTURE_NAME) return <FixtureDiscover />;
  if (fixture === DISCOVER_LIST_FIXTURE_NAME) return <FixtureDiscoverList />;
  return <MusicRecommendLive />;
};
export default MusicRecommend;

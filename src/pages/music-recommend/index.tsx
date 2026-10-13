import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router";

import { addToast } from "@heroui/react";

import type { Track } from "@/domain/track";

import { toFavoriteSelection, toMediaDownloadInfo, toPlayItem } from "@/adapters/track/actions";
import { adaptRegionArchiveToTrack } from "@/adapters/track/recommendation";
import { formatDuration } from "@/common/utils/time";
import ScrollContainer from "@/components/scroll-container";
import { DiscoverListView, discoverListColumns } from "@/features/discover/discover-list-view";
import { DiscoverView, type DiscoverAlbum } from "@/features/discover/discover-view";
import {
  useDiscoverFixtureData,
  useDiscoverFixtureName,
  useDiscoverListFixtureData,
} from "@/features/discover/fixture";
import { DISCOVER_LIST_TRACK_ACTIONS } from "@/features/discover/track-actions";
import { getRegionFeedRcmd } from "@/service/web-interface-region-feed-rcmd";
import { useModalStore } from "@/store/modal";
import { usePlayList } from "@/store/play-list";
import { DISCOVER_CARD_FIXTURE_NAME } from "@/ui/fixtures/screen-07-discover-card";
import { DISCOVER_LIST_FIXTURE_NAME } from "@/ui/fixtures/screen-08-discover-list";
import { AnnotationBand } from "@/ui/patterns/annotation-band";
import { PageState } from "@/ui/states/page-state";

const toAlbum = (track: Track, currentId?: string, onPlay?: () => void): DiscoverAlbum => ({
  key: track.id,
  badge: "B站音乐",
  title: track.title,
  meta: track.creator?.name ?? "未知创作者",
  art: track.cover,
  artKey: track.id,
  duration: typeof track.duration === "number" ? formatDuration(track.duration) : undefined,
  current: track.id === currentId,
  onPlay,
  tags: [{ key: "source", label: "音乐分区", variant: "plain" }],
});

/**
 * 发现音乐（真实数据路径）。
 *
 * 数据源**只有一档**：B 站音乐分区推荐流（`/x/web-interface/region/feed/rcmd`，
 * `from_region: 1003`）。此前的「新碟与新歌」档位（`centralization/interface/new/music`
 * + banner，依赖登录态且为运营位性质）与「卡片 / 列表」视图切换已按产品决策移除
 * （2026-10-12）：本页永久渲染**卡片模式**，页面定位收敛为「持续刷到新的可播放内容」。
 * 旧的 `/?source=module` 链接会自然落到分区数据，不做额外跳转。
 *
 * 顺带说明 hero 为何恒为 null：新碟速递 hero 是为「新碟与新歌」的 banner 设计的，
 * 分区推荐流没有 banner 概念，`DiscoverView` 收到 null hero 就跳过整段渲染。
 */
const MusicRecommendLive = () => {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState("请稍后重试");
  const playId = usePlayList(state => state.playId);

  const load = useCallback(async () => {
    setStatus("loading");
    setErrorMessage("请稍后重试");
    try {
      const res = await getRegionFeedRcmd({
        display_id: 1,
        request_cnt: 15,
        from_region: 1003,
        device: "web",
        plat: 30,
        web_location: "333.40138",
      });
      if (res.code !== 0) throw new Error(res.message || `B站接口返回 ${res.code}`);
      setTracks((res.data?.archives ?? []).map((item, i) => adaptRegionArchiveToTrack(item, String(i))));
      setStatus("ready");
    } catch (error) {
      setTracks([]);
      setErrorMessage(error instanceof Error ? error.message : "无法加载 B 站音乐分区");
      setStatus("error");
    }
  }, []);
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

  /**
   * 内容区状态。**页头不参与切换** —— 见 `DiscoverViewProps.content`。
   *
   * 非 `ready` 态从这里传给视图的 `content` 槽位，页头（H1 / 导语）始终挂载，
   * 点"重新加载"时只有下面这块换内容，页面不闪。
   */
  const content = useMemo(() => {
    if (status === "loading") return <PageState kind="loading" className="min-h-[420px]" />;
    if (status === "error")
      return <PageState kind="error" description={errorMessage} actionLabel="重新加载" onAction={() => void load()} />;
    if (!tracks.length) return <PageState kind="empty" />;
    return undefined;
  }, [errorMessage, load, status, tracks.length]);

  return (
    <ScrollContainer enableBackToTop className="h-full w-full">
      {/*
        发现音乐**不传 title / lead / albumSectionTitle**：页头（H1「发现音乐」+
        导语）与「音乐分区推荐」段落标题已于 2026-10-12 按产品要求移除，页面只展示
        卡片网格 —— 所在页面由侧栏高亮表达，页头只是把导航信息又说了一遍，还占掉
        首屏一整块高度。`hero` 恒为 null 同理（新碟速递 hero 是「新碟与新歌」banner
        专用，分区推荐流没有这个概念）。
      */}
      <DiscoverView
        hero={null}
        content={content}
        albums={tracks.slice(0, 12).map(track => toAlbum(track, playId, () => void act(track, "play")))}
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
  const [searchParams] = useSearchParams();
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
      {searchParams.get("preview") !== "4188" && <AnnotationBand>{fixture.note}</AnnotationBand>}
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

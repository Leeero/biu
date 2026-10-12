import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";

import { addToast } from "@heroui/react";
import { RiGridLine, RiListUnordered } from "@remixicon/react";

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
import { DiscoverView, type DiscoverAlbum } from "@/features/discover/discover-view";
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
import { SegmentedControl } from "@/ui/primitives/segmented-control";
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
const toAlbum = (
  track: Track,
  source: "region" | "module",
  currentId?: string,
  onPlay?: () => void,
): DiscoverAlbum => ({
  key: track.id,
  badge: "B站音乐",
  title: track.title,
  meta: track.creator?.name ?? "未知创作者",
  art: track.cover,
  artKey: track.id,
  duration: typeof track.duration === "number" ? formatDuration(track.duration) : undefined,
  current: track.id === currentId,
  onPlay,
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
  const playId = usePlayList(state => state.playId);

  /**
   * 请求序号。**用来丢弃过期响应**，不是用来做 UI 判断。
   *
   * 快速连点"音乐分区 / 新碟与新歌"时，两个请求会并发在途；网络抖动下先发的
   * 那一个可能**后到**，把后发那次的结果盖掉 —— 界面于是停在"上一个数据源"
   * 的内容上，而分段控件显示的是刚点的这一档。用递增序号在写状态前比对，
   * 过期响应直接丢弃，不写任何 state。
   */
  const requestSeq = useRef(0);

  const load = useCallback(async () => {
    const seq = ++requestSeq.current;
    setStatus("loading");
    setErrorMessage("请稍后重试");
    try {
      if (source === "module") {
        const [banner, music] = await Promise.all([getNewMusicBanner(), getNewMusic()]);
        if (seq !== requestSeq.current) return;
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
        if (seq !== requestSeq.current) return;
        if (res.code !== 0) throw new Error(res.message || `B站接口返回 ${res.code}`);
        setFeaturedTrack(null);
        setTracks((res.data?.archives ?? []).map((item, i) => adaptRegionArchiveToTrack(item, String(i))));
      }
      if (seq !== requestSeq.current) return;
      setStatus("ready");
    } catch (error) {
      if (seq !== requestSeq.current) return;
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

  /**
   * 语义筛选控件（"音乐分区 / 新碟与新歌"）。
   *
   * 用 `SegmentedControl` 而不是一排并列药丸，因为这两者是**互斥二选一的数据源**：
   *   · 分段控件的激活项反色，用户一眼看得出当前在哪一边 —— 并列药丸只能靠
   *     描边/底色的细微差别猜；
   *   · 方向键（←/→）可在两档间循环，Home / End 跳首尾 —— 互斥选项该有这个
   *     键盘约定，而并列按钮只能逐个 Tab；
   *   · 读屏听到的是 `aria-pressed` 的「已按下」，语义落在"单选"上。
   *
   * 传给 `filterControl` 槽位后，视图**不再渲染** `filters` 那排药丸，故下面
   * `filters` 传空数组 —— 真实路径的数据源切换只有这两档，没有第三枚药丸可放。
   * 夹具路径不受影响：它不传 `filterControl`，仍走 `filters` 的静态药丸渲染
   * （那一屏的 5 枚是「全部播放 / 随机播放 / 数据源 · … / 去重后合并 27 条 /
   * 显示模式 · 卡片」，本来就不是互斥选项，不该被强行改成分段）。
   *
   * 走 `navigate` 改 query 而不是本地 state：`source` 是**路由契约**
   * （`/?source=region|module`），改 query 才能被前进/后退与分享链接携带。
   * `SegmentedControl` 有 `href` 形态（渲染 `<Link>`），但那样会丢掉
   * `aria-pressed` 语义 —— 数据源切换是"面板里的内容整体换掉"，
   * 用按钮 + navigate 更贴合，也保持与既有实现一致。
   */
  const filterControl = useMemo(
    () => (
      <SegmentedControl
        size="default"
        label="数据源"
        items={[
          { key: "region", label: "音乐分区" },
          { key: "module", label: "新碟与新歌" },
        ]}
        activeKey={source}
        onSelect={key => navigate(`/?source=${key === "module" ? "module" : "region"}`)}
      />
    ),
    [navigate, source],
  );

  // 视图切换控件。`displayMode === "compact"` 暂未在本页提供对应渲染分支，
  // 仍然把它放进可选项，避免与全局设置里"列表/网格/紧凑"三档不一致。
  // 用户在系统设置页选了"紧凑"后，会落到列表分支的紧凑实现 —— 见 spec-lock
  // `screens[07].rowStateRule` 与 `docs/design/cplus-screen-matrix.md` 的"displayMode
  // 实为三档"条目。
  const viewSwitcher = useMemo(
    () => (
      <SegmentedControl
        size="compact"
        label="显示模式"
        items={[
          { key: "card", label: <RiGridLine size={15} aria-hidden="true" /> },
          { key: "list", label: <RiListUnordered size={15} aria-hidden="true" /> },
        ]}
        activeKey={displayMode === "card" ? "card" : "list"}
        onSelect={key => updateSettings({ displayMode: key === "card" ? "card" : "list" })}
      />
    ),
    [displayMode, updateSettings],
  );

  /**
   * 内容区状态。**页头不参与切换** —— 见 `DiscoverViewProps.content`。
   *
   * 三个非 `ready` 态从这里传给视图的 `content` 槽位，页头（H1 / 导语 / 两个分段
   * 控件）始终挂载在 `DiscoverView` / `DiscoverListView` 里，因此切换数据源或点
   * "重新加载"时**只有下面这块换内容**，页面不闪，刚点下的那一档也不会在视觉上
   * 消失半秒。
   *
   * `min-h-[420px]` 是给加载态的：**别让内容区塌到 256px**（`PageState` 自己的
   * `min-h-64`）。卡片分支满屏约 12 张卡，切源时若内容区从近千像素缩到 256，
   * 滚动位置会猛跳一截 —— 那跟"闪一下"一样难受，只是换了个形式。420 让塌陷
   * 幅度落在可感但不刺眼的区间，且首次加载（页面本来就空）也不会撑出多余留白。
   */
  const content = useMemo(() => {
    if (status === "loading") return <PageState kind="loading" className="min-h-[420px]" />;
    if (status === "error")
      return <PageState kind="error" description={errorMessage} actionLabel="重新加载" onAction={() => void load()} />;
    if (!tracks.length && !featuredTrack) return <PageState kind="empty" />;
    return undefined;
  }, [errorMessage, featuredTrack, load, status, tracks.length]);

  if (displayMode === "list") {
    const rows = (featuredTrack ? [featuredTrack, ...tracks] : tracks).map(toListRow);
    return (
      <DiscoverListView
        title="发现音乐"
        lead={source === "region" ? "浏览音乐分区最新内容。" : "浏览新碟与新歌推荐。"}
        // 空数组：数据源切换改走 `filterControl` 的分段控件，这里没有药丸要渲染。
        filters={[]}
        filterControl={filterControl}
        viewSwitcher={viewSwitcher}
        content={content}
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
        lead="来自 Bilibili 的音乐视频，与本地音乐，一起播放"
        // 空数组：数据源切换改走 `filterControl` 的分段控件，这里没有药丸要渲染。
        filters={[]}
        filterControl={filterControl}
        viewSwitcher={viewSwitcher}
        content={content}
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
        albums={tracks.slice(0, 12).map(track => toAlbum(track, source, playId, () => void act(track, "play")))}
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

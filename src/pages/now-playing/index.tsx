import { useMemo, useRef, useState, type MouseEvent } from "react";
import { useNavigate, useSearchParams } from "react-router";

import {
  RiArrowLeftLine,
  RiListCheck2,
  RiPauseLargeFill,
  RiPlayLargeFill,
  RiRepeat2Line,
  RiShuffleLine,
  RiSkipBackFill,
  RiSkipForwardFill,
  RiVolumeMuteLine,
  RiVolumeUpLine,
} from "@remixicon/react";

import { PlayMode } from "@/common/constants/audio";
import { formatDuration } from "@/common/utils/time";
import { buildQueueViewModel } from "@/features/player/queue";
import { usePlayList } from "@/store/play-list";
import { usePlayProgress } from "@/store/play-progress";
import { NOW_PLAYING_PAGE_FIXTURE_NAME, SCREEN_10_NOW_PLAYING_FIXTURE } from "@/ui/fixtures/screen-10-now-playing";
import { Artwork } from "@/ui/primitives/artwork";

type MainView = "cover" | "video";
type SideView = "lyrics" | "queue";
const MODE_LABEL: Record<PlayMode, string> = {
  [PlayMode.Sequence]: "顺序",
  [PlayMode.Loop]: "列表循环",
  [PlayMode.Random]: "随机",
  [PlayMode.Single]: "单曲循环",
};

const NowPlayingPage = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const isFixture = params.get("fixture") === NOW_PLAYING_PAGE_FIXTURE_NAME;
  const [mainView, setMainView] = useState<MainView>("cover");
  const [sideView, setSideView] = useState<SideView>("lyrics");
  const videoRef = useRef<HTMLVideoElement>(null);
  const list = usePlayList(s => s.list),
    playId = usePlayList(s => s.playId),
    nextId = usePlayList(s => s.nextId),
    isPlaying = usePlayList(s => s.isPlaying),
    duration = usePlayList(s => s.duration) ?? 0,
    playMode = usePlayList(s => s.playMode),
    volume = usePlayList(s => s.volume),
    isMuted = usePlayList(s => s.isMuted);
  const togglePlay = usePlayList(s => s.togglePlay),
    previous = usePlayList(s => s.prev),
    next = usePlayList(s => s.next),
    seek = usePlayList(s => s.seek),
    togglePlayMode = usePlayList(s => s.togglePlayMode),
    setVolume = usePlayList(s => s.setVolume),
    toggleMute = usePlayList(s => s.toggleMute);
  const currentTime = usePlayProgress(s => s.currentTime);
  const item = useMemo(() => list.find(row => row.id === playId), [list, playId]);
  const queue = useMemo(() => buildQueueViewModel(list, playId, nextId), [list, nextId, playId]);
  const title = isFixture ? SCREEN_10_NOW_PLAYING_FIXTURE.title : item?.pageTitle || item?.title || "尚未播放";
  const artist = isFixture ? SCREEN_10_NOW_PLAYING_FIXTURE.meta.join(" · ") : item?.ownerName || "未知来源";
  const lyrics = isFixture ? SCREEN_10_NOW_PLAYING_FIXTURE.lyrics : [];
  const resolvedDuration = isFixture ? 242 : duration,
    resolvedTime = isFixture ? 108 : currentTime,
    progress = resolvedDuration > 0 ? Math.min(100, (resolvedTime / resolvedDuration) * 100) : 0,
    disabled = !isFixture && !item;
  const handleSeek = (event: MouseEvent<HTMLButtonElement>) => {
    if (disabled || resolvedDuration <= 0) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    seek(((event.clientX - bounds.left) / bounds.width) * resolvedDuration);
  };
  return (
    <div className="np4188-page">
      <button type="button" className="np4188-back" onClick={() => navigate(-1)}>
        <RiArrowLeftLine />
        返回应用
      </button>
      <main className="np4188-main">
        <section className="np4188-art-column">
          <div className="np4188-art">
            {mainView === "video" && item?.videoUrl && !isFixture ? (
              <video
                ref={videoRef}
                src={item.videoUrl}
                aria-label="当前播放视频画面"
                muted
                playsInline
                autoPlay={isPlaying}
              />
            ) : (
              <Artwork
                src={isFixture ? undefined : item?.pageCover || item?.cover}
                alt="当前播放封面"
                radius="none"
                gradient="immersive"
                className="size-full"
              />
            )}
          </div>
          <div className="np4188-badges">
            <span>正在播放</span>
            <span>{item?.isLossless ? "无损音质" : "标准音质"}</span>
            <span>{item?.source === "local" ? "本地音乐" : "来自 Bilibili"}</span>
          </div>
          <div className="np4188-title">
            <div>
              <h1>{title}</h1>
              <p>{artist}</p>
            </div>
            {item?.videoUrl && !isFixture && (
              <button type="button" onClick={() => setMainView(v => (v === "cover" ? "video" : "cover"))}>
                {mainView === "cover" ? "视频" : "封面"}
              </button>
            )}
          </div>
        </section>
        <aside className="np4188-side">
          <div className="np4188-tabs">
            <button
              type="button"
              className={sideView === "lyrics" ? "is-active" : ""}
              onClick={() => setSideView("lyrics")}
            >
              歌词
            </button>
            <button
              type="button"
              className={sideView === "queue" ? "is-active" : ""}
              onClick={() => setSideView("queue")}
            >
              播放队列 · {queue.length}
            </button>
          </div>
          {sideView === "lyrics" ? (
            <div className="np4188-lyrics">
              <span>歌词同步 · 自动滚动</span>
              {lyrics.length ? (
                lyrics.map((line, index) => (
                  <p
                    key={`${line}-${index}`}
                    className={index === SCREEN_10_NOW_PLAYING_FIXTURE.currentLine ? "is-active" : ""}
                  >
                    {line}
                  </p>
                ))
              ) : (
                <div className="np4188-side-empty">
                  <strong>暂未匹配到歌词</strong>
                  <span>可以继续播放，或查看当前队列</span>
                </div>
              )}
            </div>
          ) : (
            <div className="np4188-queue">
              <span>接下来播放</span>
              {queue
                .filter(row => !row.isCurrent)
                .map(row => (
                  <button key={row.id} type="button" onClick={() => void usePlayList.getState().playListItem(row.id)}>
                    <b>{String(row.index).padStart(2, "0")}</b>
                    {row.cover ? <img src={row.cover} alt="" /> : <i />}
                    <span>
                      <strong>{row.title}</strong>
                      <small>{row.artist}</small>
                    </span>
                    <time>{row.duration}</time>
                  </button>
                ))}
            </div>
          )}
        </aside>
      </main>
      <footer className="np4188-controls">
        <div className="np4188-progress">
          <time>{formatDuration(resolvedTime)}</time>
          <button type="button" aria-label="调整播放进度" disabled={disabled} onClick={handleSeek}>
            <i style={{ width: `${progress}%` }} />
          </button>
          <time>{formatDuration(resolvedDuration)}</time>
        </div>
        <div className="np4188-control-row">
          <button type="button" className="np4188-mode" onClick={togglePlayMode}>
            {playMode === PlayMode.Random ? <RiShuffleLine /> : <RiRepeat2Line />}
            {MODE_LABEL[playMode]}
          </button>
          <div className="np4188-transport">
            <button type="button" aria-label="上一首" disabled={disabled} onClick={() => void previous()}>
              <RiSkipBackFill />
            </button>
            <button
              type="button"
              className="np4188-play"
              aria-label={isPlaying ? "暂停" : "播放"}
              disabled={disabled}
              onClick={togglePlay}
            >
              {isPlaying ? <RiPauseLargeFill /> : <RiPlayLargeFill />}
            </button>
            <button type="button" aria-label="下一首" disabled={disabled} onClick={() => void next()}>
              <RiSkipForwardFill />
            </button>
          </div>
          <div className="np4188-volume">
            <button type="button" aria-label={isMuted ? "取消静音" : "静音"} onClick={toggleMute}>
              {isMuted ? <RiVolumeMuteLine /> : <RiVolumeUpLine />}
            </button>
            <input
              aria-label="音量"
              type="range"
              min="0"
              max="100"
              value={Math.round(volume * 100)}
              onChange={event => setVolume(Number(event.target.value) / 100)}
            />
            <button type="button" aria-label="查看播放队列" onClick={() => setSideView("queue")}>
              <RiListCheck2 />
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};
export default NowPlayingPage;

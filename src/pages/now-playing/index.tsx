import { useEffect, useMemo, useRef, useState, type MouseEvent } from "react";
import { useNavigate, useSearchParams } from "react-router";

import clsx from "classnames";

import { PlayMode } from "@/common/constants/audio";
import { formatDuration } from "@/common/utils/time";
import { usePlayList } from "@/store/play-list";
import { usePlayProgress } from "@/store/play-progress";
import { PLACEHOLDER_RADIALS } from "@/ui/fixtures/placeholder-art";
import { NOW_PLAYING_PAGE_FIXTURE_NAME, SCREEN_10_NOW_PLAYING_FIXTURE } from "@/ui/fixtures/screen-10-now-playing";
import { Artwork } from "@/ui/primitives/artwork";
import { Icon, type IconName } from "@/ui/primitives/icon";

type PlayerView = "cover" | "lyrics" | "video";

const VIEW_OPTIONS: Array<{ value: PlayerView; label: string }> = [
  { value: "cover", label: "封面" },
  { value: "lyrics", label: "歌词" },
  { value: "video", label: "视频" },
];

const MODE_LABEL: Record<PlayMode, string> = {
  [PlayMode.Sequence]: "顺序",
  [PlayMode.Loop]: "列表循环",
  [PlayMode.Random]: "随机",
  [PlayMode.Single]: "单曲",
};

const MODE_ICON: Record<PlayMode, IconName> = {
  [PlayMode.Sequence]: "list",
  [PlayMode.Loop]: "repeat",
  [PlayMode.Random]: "shuffle",
  [PlayMode.Single]: "repeat-one",
};

const NowPlayingPage = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const isFixture = params.get("fixture") === NOW_PLAYING_PAGE_FIXTURE_NAME;
  const [view, setView] = useState<PlayerView>("lyrics");
  const videoRef = useRef<HTMLVideoElement>(null);

  const list = usePlayList(state => state.list);
  const playId = usePlayList(state => state.playId);
  const isPlaying = usePlayList(state => state.isPlaying);
  const duration = usePlayList(state => state.duration) ?? 0;
  const playMode = usePlayList(state => state.playMode);
  const togglePlay = usePlayList(state => state.togglePlay);
  const previous = usePlayList(state => state.prev);
  const next = usePlayList(state => state.next);
  const seek = usePlayList(state => state.seek);
  const togglePlayMode = usePlayList(state => state.togglePlayMode);
  const currentTime = usePlayProgress(state => state.currentTime);
  const playItem = useMemo(() => list.find(item => item.id === playId), [list, playId]);

  const title = isFixture ? SCREEN_10_NOW_PLAYING_FIXTURE.title : playItem?.pageTitle || playItem?.title || "尚未播放";
  const meta = isFixture
    ? SCREEN_10_NOW_PLAYING_FIXTURE.meta
    : [playItem?.ownerName || "未知来源", playItem?.source === "local" ? "本地音乐" : "B站音乐分区"];
  const qualityMeta = isFixture
    ? SCREEN_10_NOW_PLAYING_FIXTURE.qualityMeta
    : [
        playItem?.isLossless ? "无损 30251" : playItem?.isDolby ? "杜比 30250" : "标准音质",
        `时长 ${formatDuration(duration)}`,
      ];
  const tags = isFixture
    ? SCREEN_10_NOW_PLAYING_FIXTURE.tags
    : [
        playItem?.isLossless ? "音质 · 无损 30251" : "音质 · 标准",
        playItem?.isDolby ? "杜比全景声 · 30250" : "立体声",
        "歌词 · 自动匹配",
      ];
  const lyrics = isFixture ? SCREEN_10_NOW_PLAYING_FIXTURE.lyrics : [];
  const resolvedDuration = isFixture ? 242 : duration;
  const resolvedTime = isFixture ? 108 : currentTime;
  const progress = isFixture
    ? SCREEN_10_NOW_PLAYING_FIXTURE.progress
    : resolvedDuration > 0
      ? Math.min(100, (resolvedTime / resolvedDuration) * 100)
      : 0;
  const queueCount = isFixture ? SCREEN_10_NOW_PLAYING_FIXTURE.queueCount : list.length;
  const disabled = !isFixture && list.length === 0;

  useEffect(() => {
    const video = videoRef.current;
    if (!video || view !== "video" || isFixture) return;

    if (Number.isFinite(currentTime) && Math.abs(video.currentTime - currentTime) > 0.75) {
      video.currentTime = currentTime;
    }

    if (isPlaying) {
      void video.play().catch(() => {
        // 视频只是静音画面层；自动播放被系统拦截时仍由底栏维持音频播放。
      });
    } else {
      video.pause();
    }
  }, [currentTime, isFixture, isPlaying, playItem?.videoUrl, view]);

  const handleSeek = (event: MouseEvent<HTMLButtonElement>) => {
    if (disabled || resolvedDuration <= 0) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    seek(((event.clientX - bounds.left) / bounds.width) * resolvedDuration);
  };

  return (
    <div className="absolute inset-0 overflow-hidden">
      <header className="flex h-[var(--biu-layout-topbar-h)] items-center justify-between px-[34px]">
        <button
          type="button"
          className="inline-flex h-11 items-center gap-2 rounded-full px-3 text-[15px] font-semibold text-[rgb(var(--biu-text-primary))] transition-colors hover:bg-white/8"
          onClick={() => navigate(-1)}
        >
          <Icon name="arrow-right" size={18} className="rotate-180" />
          返回
        </button>
        <div className="flex items-center">
          <nav
            aria-label="播放视图"
            className="flex h-11 items-center gap-1 rounded-full border border-white/8 bg-white/10 p-1"
          >
            {VIEW_OPTIONS.map(option => (
              <button
                key={option.value}
                type="button"
                aria-pressed={view === option.value}
                className={clsx(
                  "h-9 min-w-[72px] rounded-full px-[18px] text-[14px] transition-colors",
                  view === option.value ? "bg-white/12 text-white" : "text-white/55 hover:text-white",
                )}
                onClick={() => setView(option.value)}
              >
                {option.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="absolute top-[var(--biu-layout-topbar-h)] right-0 bottom-[176px] left-0 overflow-hidden px-[var(--biu-layout-gutter)] py-5">
        {view === "lyrics" ? (
          <div className="mx-auto grid h-full max-w-[1480px] grid-cols-[minmax(280px,420px)_minmax(0,720px)] items-center justify-center gap-[clamp(40px,6vw,96px)]">
            <section className="min-w-0">
              <ArtworkStage src={isFixture ? undefined : playItem?.pageCover || playItem?.cover} compact />
              <TrackDetails title={title} meta={meta} qualityMeta={qualityMeta} tags={tags} compact />
            </section>
            <section aria-live="polite" className="flex h-full min-h-0 flex-col justify-center overflow-hidden py-6">
              {lyrics.length ? (
                <div className="max-h-full overflow-y-auto [mask-image:linear-gradient(to_bottom,transparent,black_10%,black_90%,transparent)] pr-6">
                  <div className="mb-7 text-[13px] text-white/40">{SCREEN_10_NOW_PLAYING_FIXTURE.lyricsHead}</div>
                  <div className="space-y-4 py-10">
                    {lyrics.map((line, index) => (
                      <div
                        key={`${line}-${index}`}
                        className={clsx(
                          "text-[clamp(20px,2vw,30px)] leading-[1.45] transition-colors",
                          index === SCREEN_10_NOW_PLAYING_FIXTURE.currentLine
                            ? "font-semibold text-white"
                            : "text-white/38",
                        )}
                      >
                        {line}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex min-h-[320px] flex-col items-center justify-center text-center">
                  <Icon name="mic" size={36} className="mb-5 text-white/25" />
                  <h2 className="text-[22px] font-semibold text-white/85">暂未匹配到歌词</h2>
                  <p className="mt-2 text-[14px] text-white/42">可以继续播放，或切换到封面和视频视图</p>
                  <button
                    type="button"
                    className="mt-6 h-10 rounded-full border border-white/10 bg-white/10 px-5 text-[14px] text-white/75 hover:bg-white/15"
                    onClick={() => setView("cover")}
                  >
                    查看封面
                  </button>
                </div>
              )}
            </section>
          </div>
        ) : view === "video" ? (
          <section className="mx-auto flex h-full max-w-[1280px] items-center justify-center">
            <div className="relative aspect-video max-h-full w-full overflow-hidden rounded-[var(--biu-radius-panel)] border border-white/8 bg-black/35 shadow-2xl">
              {playItem?.videoUrl && !isFixture ? (
                <video
                  ref={videoRef}
                  src={playItem.videoUrl}
                  aria-label="当前播放视频画面"
                  className="pointer-events-none size-full object-contain"
                  muted
                  playsInline
                  preload="auto"
                  onLoadedMetadata={event => {
                    if (Number.isFinite(currentTime)) event.currentTarget.currentTime = currentTime;
                  }}
                />
              ) : (
                <div className="flex size-full flex-col items-center justify-center text-center">
                  <Icon name="video" size={40} className="mb-5 text-white/25" />
                  <h2 className="text-[22px] font-semibold text-white/85">当前内容没有可播放的视频</h2>
                  <button
                    type="button"
                    className="mt-6 h-10 rounded-full border border-white/10 bg-white/10 px-5 text-[14px] text-white/75 hover:bg-white/15"
                    onClick={() => setView("cover")}
                  >
                    返回封面
                  </button>
                </div>
              )}
            </div>
          </section>
        ) : (
          <section className="mx-auto grid h-full max-w-[1480px] grid-cols-[minmax(0,900px)_minmax(300px,420px)] items-center justify-center gap-[clamp(40px,6vw,96px)]">
            <ArtworkStage src={isFixture ? undefined : playItem?.pageCover || playItem?.cover} />
            <TrackDetails title={title} meta={meta} qualityMeta={qualityMeta} tags={tags} />
          </section>
        )}
      </main>

      <div className="absolute right-[var(--biu-layout-gutter)] bottom-6 left-[var(--biu-layout-gutter)]">
        <button
          aria-label="调整播放进度"
          type="button"
          disabled={disabled}
          onClick={handleSeek}
          className="block h-1 w-full overflow-hidden bg-white/24 text-left disabled:opacity-40"
        >
          <span className="block h-full bg-[rgb(var(--biu-color-accent))]" style={{ width: `${progress}%` }} />
        </button>
        <div className="mt-3 flex justify-between text-[13px] text-white/55 tabular-nums">
          <span>{isFixture ? SCREEN_10_NOW_PLAYING_FIXTURE.elapsed : formatDuration(resolvedTime)}</span>
          <span>{isFixture ? SCREEN_10_NOW_PLAYING_FIXTURE.duration : formatDuration(resolvedDuration)}</span>
        </div>
        <div className="mt-4 grid grid-cols-[minmax(180px,1fr)_auto_minmax(180px,1fr)] items-center gap-6">
          <div className="justify-self-start rounded-full border border-white/10 bg-white/10 px-[18px] py-2 text-[13px] text-white/60">
            <span className="inline-flex items-center gap-2">
              <Icon name="music" size={16} />
              播放来源 · {playItem?.source === "local" ? "本地音乐" : "B站音乐分区"}
            </span>
          </div>
          <div className="flex items-center gap-[30px]">
            <TransportButton label="上一首" icon="prev" disabled={disabled} onClick={() => void previous()} />
            <button
              type="button"
              aria-label={isPlaying ? "暂停" : "播放"}
              disabled={disabled}
              onClick={togglePlay}
              className="flex size-14 items-center justify-center rounded-full bg-white text-black transition-transform hover:scale-[1.03] disabled:opacity-40"
            >
              <Icon name={isPlaying ? "pause" : "play"} size={26} />
            </button>
            <TransportButton label="下一首" icon="next" disabled={disabled} onClick={() => void next()} />
          </div>
          <div className="flex gap-3 justify-self-end">
            <button
              type="button"
              onClick={togglePlayMode}
              className="inline-flex h-9 items-center gap-2 rounded-full border border-white/10 bg-white/12 px-[18px] text-[13px] text-white/65"
            >
              <Icon name={MODE_ICON[playMode]} size={16} />
              循环 · {isFixture ? "单曲" : MODE_LABEL[playMode]}
            </button>
            <button
              type="button"
              onClick={() => navigate("/queue")}
              className="inline-flex h-9 items-center gap-2 rounded-full border border-white/10 bg-white/12 px-[18px] text-[13px] text-white/65"
            >
              <Icon name="list" size={16} />
              队列 · {queueCount}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const ArtworkStage = ({ src, compact = false }: { src?: string; compact?: boolean }) => (
  <div
    className={clsx(
      "relative aspect-video w-full overflow-hidden rounded-[var(--biu-radius-panel)] border border-white/8 bg-black/20 shadow-2xl",
      compact && "shadow-xl",
    )}
  >
    <Artwork
      src={src}
      alt="当前播放封面"
      radius="none"
      gradient="immersive"
      placeholder={PLACEHOLDER_RADIALS.immersive}
      className="size-full"
    />
  </div>
);

const TrackDetails = ({
  title,
  meta,
  qualityMeta,
  tags,
  compact = false,
}: {
  title: string;
  meta: readonly string[];
  qualityMeta: readonly string[];
  tags: readonly string[];
  compact?: boolean;
}) => (
  <div className={clsx("min-w-0", compact ? "mt-6" : "self-center")}>
    <div className="mb-3 text-[13px] font-medium tracking-[0.08em] text-white/38">正在播放</div>
    <h1
      className={clsx(
        "m-0 font-semibold tracking-[-0.7px] text-balance",
        compact ? "line-clamp-2 text-[26px] leading-[1.25]" : "text-[clamp(32px,3.2vw,52px)] leading-[1.12]",
      )}
    >
      {title}
    </h1>
    <MetaRow values={meta} />
    <MetaRow values={qualityMeta} />
    <div className="mt-5 flex flex-wrap gap-2">
      {tags.map(tag => (
        <span
          key={tag}
          className="inline-flex h-9 items-center rounded-full border border-white/10 bg-white/10 px-4 text-[13px] text-white/58"
        >
          {tag}
        </span>
      ))}
    </div>
  </div>
);

const MetaRow = ({ values }: { values: readonly string[] }) => (
  <div className="mt-2.5 flex text-[14px] leading-6 text-white/55">
    {values.map((value, index) => (
      <span key={value} className={clsx(index > 0 && "before:mx-2 before:text-white/25 before:content-['·']")}>
        {value}
      </span>
    ))}
  </div>
);

const TransportButton = ({
  label,
  icon,
  disabled,
  onClick,
}: {
  label: string;
  icon: IconName;
  disabled: boolean;
  onClick: () => void;
}) => (
  <button
    type="button"
    aria-label={label}
    disabled={disabled}
    onClick={onClick}
    className="flex size-9 items-center justify-center text-white/75 hover:text-white disabled:opacity-40"
  >
    <Icon name={icon} size={24} />
  </button>
);

export default NowPlayingPage;

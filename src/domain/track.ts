import type { CapabilityContext, TrackCapabilities } from "./capabilities";
import type { CreatorSummary } from "./creator";

export type TrackSource = "bilibili-video" | "bilibili-audio" | "local";

export interface TrackSourceRef {
  aid?: string;
  bvid?: string;
  cid?: string;
  sid?: number;
  localPath?: string;
  audioUrl?: string;
}

export interface Track {
  /** 跨页面稳定的领域 ID，不等同于播放队列实例 ID。 */
  id: string;
  source: TrackSource;
  title: string;
  cover?: string;
  creator?: CreatorSummary;
  duration?: number;
  playCount?: number;
  publishedAt?: string;
  sourceRef: TrackSourceRef;
}

export const getTrackCapabilities = (track: Track, context: CapabilityContext): TrackCapabilities => {
  const isVideo = track.source === "bilibili-video";
  const isAudio = track.source === "bilibili-audio";
  const isLocal = track.source === "local";
  const hasPlayableSource = isLocal
    ? Boolean(track.sourceRef.audioUrl || track.sourceRef.localPath)
    : isVideo
      ? Boolean(track.sourceRef.bvid)
      : Boolean(track.sourceRef.sid);

  return {
    canPlay: hasPlayableSource,
    canPlayNext: hasPlayableSource,
    canAddToQueue: hasPlayableSource,
    canFavorite:
      context.isLoggedIn &&
      ((isVideo && Boolean(track.sourceRef.aid)) || (isAudio && track.sourceRef.sid !== undefined)),
    canDownloadAudio: !isLocal && hasPlayableSource,
    canDownloadVideo: isVideo && Boolean(track.sourceRef.bvid),
    canOpenSource: !isLocal && (Boolean(track.sourceRef.bvid) || track.sourceRef.sid !== undefined),
    canOpenCreator: Boolean(track.creator?.id),
  };
};

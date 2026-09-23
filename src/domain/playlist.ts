import type { CreatorSummary } from "./creator";
import type { Track } from "./track";

export type PlaylistSource = "favorite-folder" | "season" | "series" | "local-library";

export interface PlaylistSummary {
  id: string;
  source: PlaylistSource;
  title: string;
  cover?: string;
  creator?: CreatorSummary;
  trackCount?: number;
  isOwnedByCurrentUser?: boolean;
}

export interface Playlist extends PlaylistSummary {
  description?: string;
  tracks: Track[];
}

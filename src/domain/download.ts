export type DownloadTaskStatus = "waiting" | "downloading" | "paused" | "processing" | "completed" | "failed";

export interface DownloadTask {
  id: string;
  title: string;
  cover?: string;
  output: "audio" | "video";
  status: DownloadTaskStatus;
  progress: number;
  savePath?: string;
  error?: string;
}

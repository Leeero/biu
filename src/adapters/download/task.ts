import type { DownloadTask, DownloadTaskStatus } from "@/domain/download";

const statusMap: Record<MediaDownloadStatus, DownloadTaskStatus> = {
  waiting: "waiting",
  downloading: "downloading",
  downloadPaused: "paused",
  merging: "processing",
  mergePaused: "paused",
  converting: "processing",
  convertPaused: "paused",
  completed: "completed",
  failed: "failed",
};

export const adaptMediaDownloadTask = (task: MediaDownloadTask): DownloadTask => ({
  id: task.id,
  title: task.title,
  cover: task.cover,
  output: task.outputFileType,
  status: statusMap[task.status],
  progress:
    task.status === "merging" || task.status === "mergePaused"
      ? (task.mergeProgress ?? 0)
      : task.status === "converting" || task.status === "convertPaused"
        ? (task.convertProgress ?? 0)
        : (task.downloadProgress ?? 0),
  savePath: task.savePath,
  error: task.error,
});

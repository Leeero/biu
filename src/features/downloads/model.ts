import type { DownloadTask, DownloadTaskStatus } from "@/domain/download";

import { adaptMediaDownloadTask } from "@/adapters/download/task";

export type DownloadFilter = "all" | "audio" | "video";

export interface DownloadTaskView {
  task: DownloadTask;
  source: MediaDownloadTask;
}

export interface DownloadTaskCapabilities {
  canOpen: boolean;
  canPause: boolean;
  canResume: boolean;
  canRetry: boolean;
  canDelete: boolean;
  confirmBeforeDelete: boolean;
}

const activeStatuses = new Set<MediaDownloadStatus>([
  "downloading",
  "downloadPaused",
  "merging",
  "mergePaused",
  "converting",
  "convertPaused",
]);

export const getDownloadTaskCapabilities = (task: MediaDownloadTask): DownloadTaskCapabilities => ({
  canOpen: task.status === "completed" && Boolean(task.savePath),
  canPause: task.status === "downloading",
  canResume: ["downloadPaused", "mergePaused", "convertPaused"].includes(task.status),
  canRetry: task.status === "failed",
  canDelete: true,
  confirmBeforeDelete: activeStatuses.has(task.status),
});

export const createDownloadTaskViews = (items: MediaDownloadTask[], filter: DownloadFilter): DownloadTaskView[] =>
  items
    .filter(item => filter === "all" || item.outputFileType === filter)
    .map(source => ({ task: adaptMediaDownloadTask(source), source }));

export const countDownloadStatuses = (items: MediaDownloadTask[]): Record<DownloadTaskStatus, number> => {
  const counts: Record<DownloadTaskStatus, number> = {
    waiting: 0,
    downloading: 0,
    paused: 0,
    processing: 0,
    completed: 0,
    failed: 0,
  };
  items.forEach(item => {
    counts[adaptMediaDownloadTask(item).status] += 1;
  });
  return counts;
};

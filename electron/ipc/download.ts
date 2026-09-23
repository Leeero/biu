import type { IpcHandlerProps } from "./types";

import { handleTrustedIpc } from "../security/ipc";
import { parseDownloadId, parseDownloadMedia, parseDownloadMediaList } from "../security/validation";
import { channel } from "./channel";
import { DownloadQueue } from "./download/download-queue";

let downloadQueue: DownloadQueue;

export function registerDownloadHandlers({ getMainWindow }: IpcHandlerProps) {
  downloadQueue = new DownloadQueue(getMainWindow);

  handleTrustedIpc(channel.download.getList, async () => {
    return downloadQueue.getTaskList();
  });

  handleTrustedIpc(channel.download.add, async (_, task: MediaDownloadInfo) => {
    return downloadQueue.addTask(parseDownloadMedia(task));
  });

  handleTrustedIpc(channel.download.addList, async (_, tasks: MediaDownloadInfo[]) => {
    return downloadQueue.addTasks(parseDownloadMediaList(tasks));
  });

  handleTrustedIpc(channel.download.pause, async (_, id: string) => {
    downloadQueue.pauseTask(parseDownloadId(id));
  });

  handleTrustedIpc(channel.download.resume, async (_, id: string) => {
    downloadQueue.resumeTask(parseDownloadId(id));
  });

  handleTrustedIpc(channel.download.cancel, async (_, id: string) => {
    await downloadQueue.cancelTask(parseDownloadId(id));
  });

  handleTrustedIpc(channel.download.retry, async (_, id: string) => {
    downloadQueue.retryTask(parseDownloadId(id));
  });

  handleTrustedIpc(channel.download.clear, async () => {
    await downloadQueue.clearTasks();
  });
}

export function quitAndSaveTasks() {
  downloadQueue.quitAndSave();
}

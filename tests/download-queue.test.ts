import { beforeEach, describe, expect, test, vi } from "vitest";

const { mockMediaDownloadsStore, MockDownloadCore } = vi.hoisted(() => {
  const store = {
    store: {} as Record<string, any>,
    clear: vi.fn(),
  };

  class DownloadCoreMock {
    listeners = new Map<string, Array<(data: any) => void>>();
    id: string;
    outputFileType: MediaDownloadOutputFileType;
    title?: string;
    cover?: string;
    bvid?: string;
    cid?: string | number;
    sid?: string | number;
    createdTime?: number;
    status: MediaDownloadStatus;
    abortSignal?: AbortSignal;
    error?: string;
    downloadProgress = 0;
    mergeProgress = 0;
    convertProgress = 0;
    chunkQueue = { clear: vi.fn() };
    pause = vi.fn(() => {
      this.status = "downloadPaused";
    });
    resume = vi.fn(async () => {
      this.status = "downloading";
    });
    start = vi.fn(async () => undefined);
    cancel = vi.fn(async () => undefined);

    constructor(task: any) {
      Object.assign(this, task);
      this.id = task.id;
      this.outputFileType = task.outputFileType;
      this.status = task.status;
    }

    on(event: string, listener: (data: any) => void) {
      this.listeners.set(event, [...(this.listeners.get(event) ?? []), listener]);
      return this;
    }

    removeAllListeners(event?: string) {
      if (event) {
        this.listeners.delete(event);
      } else {
        this.listeners.clear();
      }
      return this;
    }
  }

  return { mockMediaDownloadsStore: store, MockDownloadCore: DownloadCoreMock };
});

vi.mock("../electron/store", () => ({
  mediaDownloadsStore: mockMediaDownloadsStore,
}));

vi.mock("../electron/ipc/download/download-core", () => ({
  DownloadCore: MockDownloadCore,
}));

vi.mock("../electron/ipc/download/utils", () => ({
  getVideoPages: vi.fn(async () => []),
}));

vi.mock("p-queue", () => ({
  default: class MockQueue {
    add(task: () => Promise<unknown>) {
      const result = Promise.resolve().then(task);
      void result.catch(() => undefined);
      return result;
    }

    clear() {}
  },
}));

import { channel } from "../electron/ipc/channel";
import { DownloadQueue } from "../electron/ipc/download/download-queue";

const createQueue = () => {
  const send = vi.fn();
  const queue = new DownloadQueue(() => ({ webContents: { send } }) as any);
  return { queue, send };
};

describe("DownloadQueue", () => {
  beforeEach(() => {
    mockMediaDownloadsStore.store = {};
    mockMediaDownloadsStore.clear.mockClear();
    vi.clearAllMocks();
  });

  test("adds a waiting task and broadcasts the full list", () => {
    const { queue, send } = createQueue();
    queue.addTask({ outputFileType: "audio", title: "track", sid: 10 });

    expect(queue.getTaskList()).toEqual([
      expect.objectContaining({
        outputFileType: "audio",
        title: "track",
        sid: 10,
        status: "waiting",
      }),
    ]);
    expect(send).toHaveBeenLastCalledWith(
      channel.download.sync,
      expect.objectContaining({ type: "full", data: expect.any(Array) }),
    );
  });

  test("pauses and resumes an existing task", async () => {
    const { queue } = createQueue();
    queue.addTask({ outputFileType: "audio", title: "track", sid: 10 });
    const id = queue.getTaskList()[0].id;

    queue.pauseTask(id);
    expect(queue.getTaskList()[0].status).toBe("downloadPaused");

    queue.resumeTask(id);
    await vi.waitFor(() => expect(queue.getTaskList()[0].status).toBe("downloading"));
  });

  test("retry resets failure details and progress", () => {
    const { queue } = createQueue();
    queue.addTask({ outputFileType: "audio", title: "track", sid: 10 });
    const id = queue.getTaskList()[0].id;
    const core = (queue as any).taskMap.get(id);
    core.status = "failed";
    core.error = "network";
    core.downloadProgress = 73;
    core.mergeProgress = 20;
    core.convertProgress = 10;

    queue.retryTask(id);
    expect(queue.getTaskList()[0]).toMatchObject({
      status: "waiting",
      error: undefined,
      downloadProgress: 0,
      mergeProgress: 0,
      convertProgress: 0,
    });
  });

  test.each([
    ["waiting", "downloadPaused"],
    ["downloading", "downloadPaused"],
    ["merging", "mergePaused"],
    ["converting", "convertPaused"],
    ["completed", "completed"],
    ["failed", "failed"],
  ] as const)("persists %s as %s when the app exits", (runtimeStatus, persistedStatus) => {
    const { queue } = createQueue();
    queue.addTask({ outputFileType: "audio", title: "track", sid: 10 });
    const id = queue.getTaskList()[0].id;
    (queue as any).taskMap.get(id).status = runtimeStatus;

    queue.saveAllTasksToStore();
    expect(mockMediaDownloadsStore.store[`downloads.${id}`].status).toBe(persistedStatus);
  });

  test("cancel removes one task and clear removes all persisted tasks", async () => {
    const { queue } = createQueue();
    queue.addTasks([
      { outputFileType: "audio", title: "one", sid: 1 },
      { outputFileType: "audio", title: "two", sid: 2 },
    ]);
    const firstId = queue.getTaskList()[0].id;

    await queue.cancelTask(firstId);
    expect(queue.getTaskList()).toHaveLength(1);

    await queue.clearTasks();
    expect(queue.getTaskList()).toEqual([]);
    expect(mockMediaDownloadsStore.clear).toHaveBeenCalledOnce();
  });
});

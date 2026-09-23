import { describe, expect, it } from "vitest";

import {
  countDownloadStatuses,
  createDownloadTaskViews,
  getDownloadTaskCapabilities,
} from "@/features/downloads/model";

const task = (status: MediaDownloadStatus, outputFileType: MediaDownloadOutputFileType = "audio") =>
  ({ id: `${status}-${outputFileType}`, title: "Track", status, outputFileType }) as MediaDownloadTask;

describe("download task view model", () => {
  it("filters task types while adapting domain status", () => {
    const views = createDownloadTaskViews([task("downloading"), task("completed", "video")], "video");
    expect(views).toHaveLength(1);
    expect(views[0].task).toMatchObject({ output: "video", status: "completed" });
  });

  it("groups raw processing phases into domain status counts", () => {
    expect(countDownloadStatuses([task("merging"), task("converting"), task("failed")])).toMatchObject({
      processing: 2,
      failed: 1,
    });
  });

  it("exposes only actions supported by the current task state", () => {
    expect(getDownloadTaskCapabilities(task("downloading"))).toMatchObject({
      canPause: true,
      canResume: false,
      confirmBeforeDelete: true,
    });
    expect(getDownloadTaskCapabilities({ ...task("completed"), savePath: "/tmp/a.mp3" })).toMatchObject({
      canOpen: true,
      canPause: false,
      confirmBeforeDelete: false,
    });
  });
});

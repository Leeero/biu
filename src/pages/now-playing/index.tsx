import { useNavigate } from "react-router";

import { Button } from "@heroui/react";
import { RiArrowLeftLine } from "@remixicon/react";

import { usePlayList } from "@/store/play-list";

/**
 * 10 · 正在播放（沉浸态，`chrome="immersive"`）。
 *
 * **P1 只落路由、壳层状态与返回出口，内容为占位。** 完整形态（16:9 封面、
 * 多来源歌词、视频视图、底部内嵌进度与控制带 752–808）在第 10 屏（P5）落地，
 * 届时它取代 `components/full-screen-player` 全屏弹层。
 *
 * 两处与壳层相关的约定，写在这里以免后来者重踩：
 *   1. 沉浸态下壳层的顶栏与播放栏**都不渲染**（重构方案 §3.2）。因此页面必须自带
 *      返回出口，否则用户进得来出不去。
 *   2. 设计稿里那条「正在播放 · 封面/歌词/视频」的顶条属于**本页自己的控件**，
 *      不是壳层顶栏——所以它不在 `topbarSegments` 的路由声明里（壳层那组永远不渲染）。
 *      等 P5 做出真实的视图切换再把它加上，避免现在放一个点了没反应的开关。
 */
const NowPlayingPage = () => {
  const navigate = useNavigate();
  const playId = usePlayList(s => s.playId);
  const getPlayItem = usePlayList(s => s.getPlayItem);
  const playItem = playId ? getPlayItem() : undefined;

  return (
    <div className="flex h-full w-full flex-col">
      <div className="flex h-[var(--biu-layout-topbar-h)] flex-none items-center gap-3 px-[34px]">
        <Button
          isIconOnly
          variant="light"
          radius="full"
          aria-label="返回"
          onPress={() => navigate(-1)}
          className="h-9 w-9 min-w-9 text-[rgb(var(--biu-text-secondary))]"
        >
          <RiArrowLeftLine size={22} />
        </Button>
        <span className="text-[length:var(--biu-type-body-size)] text-[rgb(var(--biu-text-secondary))]">正在播放</span>
      </div>

      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 text-center">
        <p className="text-[length:var(--biu-type-lead-size)] text-[rgb(var(--biu-text-secondary))]">
          {playItem?.pageTitle || playItem?.title || "当前没有播放中的内容"}
        </p>
        <p className="max-w-[520px] text-[length:var(--biu-type-label-size)] text-[rgb(var(--biu-text-quaternary))]">
          沉浸态的封面、歌词与底部控制带随第 10 屏（P5）落地。本页此刻的作用是让路由、壳层状态与返回出口就位。
        </p>
      </div>
    </div>
  );
};

export default NowPlayingPage;

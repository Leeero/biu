import ScrollContainer from "@/components/scroll-container";
import { usePlayerActions } from "@/features/player/use-player-actions";
import { usePlayList } from "@/store/play-list";
import { PageHeader } from "@/ui/patterns/page-header";
import { PageState } from "@/ui/states/page-state";

/**
 * 09 · 播放队列。
 *
 * **P1 只落路由与壳层接入，内容是占位。** 按重构方案，这一屏的完整形态
 * （逐曲管理、去重规则、拖拽排序、清空确认）在第 09 屏（P5）落地，
 * 届时把 `components/music-playlist-drawer` 的列表提升为本页正文，抽屉随之删除。
 *
 * 为什么现在就要有这个路由：决策 3 之后播放队列必须有一个**可寻址**的落点——
 * 播放栏的「队列 · N」指向它。占位期间保留抽屉入口，避免队列在页面做出来之前失去可达性。
 */
const QueuePage = () => {
  const { openQueue } = usePlayerActions();
  const count = usePlayList(s => s.list.length);

  return (
    <ScrollContainer enableBackToTop className="h-full w-full">
      <div className="w-full py-5">
        <PageHeader title="播放队列" description={`当前 ${count} 首 · 逐曲管理、去重与拖拽排序在第 09 屏（P5）落地`} />
        <PageState
          kind="empty"
          title="队列页正在施工"
          description="本页的路由、壳层与入口已经就位，列表正文随第 09 屏一并实现。过渡期请先用播放列表抽屉。"
          actionLabel="打开播放列表"
          onAction={openQueue}
        />
      </div>
    </ScrollContainer>
  );
};

export default QueuePage;

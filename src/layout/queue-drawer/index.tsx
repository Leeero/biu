import { useMemo } from "react";
import { useNavigate } from "react-router";

import { RiCloseLine, RiDragMove2Fill, RiEqualizerLine, RiListCheck2 } from "@remixicon/react";

import { buildQueueViewModel } from "@/features/player/queue";
import { useModalStore } from "@/store/modal";
import { usePlayList } from "@/store/play-list";
import { useQueueDrawer } from "@/store/queue-drawer";

const QueueDrawer = () => {
  const navigate = useNavigate();
  const list = usePlayList(state => state.list);
  const playId = usePlayList(state => state.playId);
  const nextId = usePlayList(state => state.nextId);
  const setOpen = useQueueDrawer(state => state.setOpen);
  const queue = useMemo(() => buildQueueViewModel(list, playId, nextId), [list, nextId, playId]);
  const current = queue.find(item => item.isCurrent);
  const next = queue.filter(item => !item.isCurrent);

  const clearQueue = () =>
    useModalStore.getState().onOpenConfirmModal({
      title: "确认清空播放队列？",
      description: "正在播放的内容也会停止，该操作无法撤销",
      confirmText: "清空",
      type: "danger",
      onConfirm: async () => {
        usePlayList.getState().clear();
        return true;
      },
    });

  const renderRow = (row: (typeof queue)[number], index: number, currentRow = false) => {
    const item = row.item;
    return (
      <article key={item.id} className={currentRow ? "shell4188-queue-row is-current" : "shell4188-queue-row"}>
        {currentRow ? (
          <span className="shell4188-playing" aria-label="正在播放">
            <RiEqualizerLine size={18} />
          </span>
        ) : (
          <button
            type="button"
            className="shell4188-queue-icon"
            aria-label={`将 ${item.pageTitle || item.title} 下移一位`}
            onClick={() =>
              usePlayList.getState().reorder(list.indexOf(item), Math.min(list.indexOf(item) + 1, list.length - 1))
            }
          >
            <RiDragMove2Fill size={17} />
          </button>
        )}
        {!currentRow && <span className="shell4188-queue-index">{index + 1}</span>}
        {row.cover ? <img src={row.cover} alt="" /> : <span className="shell4188-cover-fallback" />}
        <span className="shell4188-queue-copy">
          <strong>{row.title}</strong>
          <small>{row.artist}</small>
          {currentRow && <em>{item.isLossless ? "无损音质" : "正在播放"}</em>}
        </span>
        <time>{row.duration}</time>
        {!currentRow && (
          <button
            type="button"
            className="shell4188-queue-icon"
            aria-label={`从队列移除 ${item.pageTitle || item.title}`}
            onClick={() => usePlayList.getState().delPage(item.id)}
          >
            <RiCloseLine size={18} />
          </button>
        )}
      </article>
    );
  };

  return (
    <aside className="shell4188-queue" aria-label="播放队列">
      <header className="shell4188-queue-head">
        <button
          type="button"
          className="shell4188-queue-title"
          onClick={() => {
            setOpen(false);
            navigate("/queue");
          }}
        >
          播放队列 <small>{queue.length} 首</small>
        </button>
        <button type="button" className="shell4188-queue-icon" aria-label="关闭播放队列" onClick={() => setOpen(false)}>
          <RiCloseLine size={22} />
        </button>
      </header>
      {current && (
        <section className="shell4188-queue-section">
          <h2>正在播放</h2>
          {renderRow(current, 0, true)}
        </section>
      )}
      <section className="shell4188-queue-section">
        <div className="shell4188-queue-section-head">
          <h2>接下来播放</h2>
          {queue.length > 0 && (
            <button type="button" onClick={clearQueue}>
              清空
            </button>
          )}
        </div>
        {next.length ? (
          next.map((item, index) => renderRow(item, index))
        ) : (
          <div className="shell4188-queue-empty">
            <RiListCheck2 size={30} />
            <strong>队列已清空</strong>
            <span>从音乐内容中添加歌曲</span>
          </div>
        )}
      </section>
    </aside>
  );
};

export default QueueDrawer;

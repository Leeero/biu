import React from "react";

import { useNowPlaying } from "@/features/player/now-playing";
import { usePlayerActions } from "@/features/player/use-player-actions";
import { Icon } from "@/ui/primitives/icon";

/**
 * 传输控件：上一首 / 播放键 / 下一首。
 *
 * 几何取自 spec-lock `geometry.playbar.mid`：三枚等距 `22px`（原型
 * `.pb-transport { gap: 22px }`，且 `.pb-icon { font-size: 22px }` ⇒ 盒子也是 22），
 * 播放键是 **48px 纯白实心圆片 + 墨色字形**（原型 `.pb-play`）。
 *
 * **原实现的播放键是错的**：`RiPlayCircleFill size={40}` 配 `text-primary`
 * —— 一个**蓝色**的 40px 图标。设计稿实测白圆 y832–879 恰为 48 高、纯白
 * （色板里 `--c-text-rgb` 登记的用途就是「主文字与播放键」），击键字形 22。
 * 这也正是新增探针 `playbarPlay`（阈值 200）要抓的缺口：白色 ≈ 250 能过，
 * 蓝色 ≈ 149 过不了。
 *
 * 字形改用 `Icon` 词汇表的 `play` / `pause`（`RiPlayFill` / `RiPauseFill`，
 * 实心），而不是 `RiPlayCircleFill` —— 设计稿的圆来自按钮底色，不是图标自带的圆。
 *
 * 圆片用 `--biu-text-primary` 而不是新开一个「播放键色」：真值登记的就是这个令牌，
 * 再开一个同值令牌只会让「改文字色」与「改播放键色」变成两件事。
 *
 * 这里不用 `IconButton`：它的 HeroUI 底座会把盒子撑到 32px 并加悬停底色，
 * 而原型的三枚图标是**无底色、仅换成白色文字色**（原型 `.pb-icon:hover`）。
 * 逐项覆写一个 primitive 的默认几何，比直接写这 22px 的盒子更难读。
 */
const MusicPlayControl = () => {
  const { ready, single, isPlaying } = useNowPlaying();
  const { previous, next, togglePlay } = usePlayerActions();

  return (
    <div className="flex items-center justify-center gap-[var(--biu-playbar-transport-gap)]">
      <button
        type="button"
        aria-label="上一首"
        title="上一首"
        disabled={!ready || single}
        onClick={() => void previous()}
        className="grid size-[var(--biu-playbar-transport-icon)] flex-none cursor-pointer place-items-center text-[length:var(--biu-playbar-transport-icon)] text-[rgb(var(--biu-film))] transition-colors duration-[var(--biu-duration-fast)] hover:text-[rgb(var(--biu-text-primary))] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:text-[rgb(var(--biu-film))]"
      >
        <Icon name="prev" />
      </button>

      <button
        type="button"
        aria-label={isPlaying ? "暂停" : "播放"}
        title={isPlaying ? "暂停" : "播放"}
        disabled={!ready}
        onClick={() => void togglePlay()}
        className="grid size-[var(--biu-playbar-play-size)] flex-none cursor-pointer place-items-center rounded-[var(--biu-radius-pill)] bg-[rgb(var(--biu-text-primary))] text-[length:var(--biu-playbar-transport-icon)] text-[rgb(var(--biu-inverse-ink))] transition-transform duration-[var(--biu-duration-fast)] hover:scale-105 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100"
      >
        <Icon name={isPlaying ? "pause" : "play"} />
      </button>

      <button
        type="button"
        aria-label="下一首"
        title="下一首"
        disabled={!ready || single}
        onClick={() => void next()}
        className="grid size-[var(--biu-playbar-transport-icon)] flex-none cursor-pointer place-items-center text-[length:var(--biu-playbar-transport-icon)] text-[rgb(var(--biu-film))] transition-colors duration-[var(--biu-duration-fast)] hover:text-[rgb(var(--biu-text-primary))] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:text-[rgb(var(--biu-film))]"
      >
        <Icon name="next" />
      </button>
    </div>
  );
};

export default MusicPlayControl;

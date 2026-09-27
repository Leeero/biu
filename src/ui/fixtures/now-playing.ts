/**
 * 播放栏「正在播放」内容的夹具形状。
 *
 * 播放栏是**全局**组件：它读 `usePlayList` / `usePlayProgress` 两个全局 store，
 * 而不是页面数据。因此设计稿上的播放栏（12 页里 11 页都有，且**每一页都是满态** ——
 * 有曲名、有进度、有队列计数）在夹具模式下无法由页面夹具带出来，需要单独一份。
 *
 * 与其它夹具同理：这里只描述**展示内容**，不描述布局。播放栏的几何与材质在
 * `cplus-spec-lock.json` 的 `geometry.playbar` / `material.playbar`。
 *
 * 为什么不直接把演示曲目写进 `usePlayList`：那个 store 是 **`persist` 的**，
 * `partialize` 会把 `list` / `playId` 落进 localStorage —— 为了让截图能比对，
 * 而把演示队列写进用户的持久化队列，是拿副作用换便利。因此这里的值经
 * `useNowPlaying()` 以**只读视图**的形式叠加在 store 之上，不写回 store。
 */
export interface FixtureNowPlaying {
  /** 主行。设计稿是 `《雨落长街》· 全专上线`（第 02 屏）/ `夜航`（第 01 屏）。 */
  title: string;
  /** 副行。设计稿是 `卧室音乐计划 · 新碟 banner` / `NOISE_LAB`。 */
  sub: string;
  /** 是否无损 —— 决定质量徽标文案（见 `AUDIO_QUALITY_LABEL`）。 */
  lossless: boolean;
  /** 已播秒数。82 ⇒ 设计稿的「01:22」。 */
  elapsedSeconds: number;
  /** 总时长秒数。228 ⇒ 设计稿的「03:48」。 */
  durationSeconds: number;
  /** 队列长度 —— 药丸的「队列 · 12」，**不是收藏或歌单数量**。 */
  queueCount: number;
  /** 是否处于播放态。设计稿的传输控件是 ▶（未播放），故为 false。 */
  playing: boolean;
}

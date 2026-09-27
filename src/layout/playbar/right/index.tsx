import QueueButton from "../queue-button";

/**
 * 播放栏右段 —— **只放设计钉住的那一枚药丸**。
 *
 * 设计稿 12 页的右段恒为一枚「队列 · N」药丸（第 11 页是沉浸态、无播放栏），右缘距
 * 画布右 52px（`--biu-playbar-inset-r`，第 02/03/05/09/13 页同值）。
 *
 * 1.3.9 曾把 6 枚控件都放在这里（播放模式 / 下载 / 抽屉入口 / 队列 / 音量 / 倍速），
 * 结果是 5 枚 32px 控件把右段左缘推到 x1080.8，压住了中段的尾随时间（x1088.5–1172）。
 * 这不是「多了几个图标」，而是**设计钉住的时间读数被遮住**，故本轮把那一组搬到
 * `../deferred`（左段与中段之间的设计预留缓冲），右段回到设计稿的样子。
 *
 * 右段没有第二种排法：可用宽 `1440 − 52 − 89 − 中段右缘` 只剩得下药丸本身。
 * 推导与登记见 spec-lock `geometry.playbar.deferred` /
 * `geometry.playbar.right.segmentDeferral`。
 */
const RightControl = () => (
  <div className="flex items-center">
    <QueueButton />
  </div>
);

export default RightControl;

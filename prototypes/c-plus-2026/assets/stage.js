/**
 * Biu 2.0 · C+ 视觉稿舞台适配
 * 设计稿画布固定 1440 × 900，此处等比缩放居中，保证任何预览窗口下比例与设计稿一致。
 */
(function () {
  var W = 1440;
  var H = 900;

  function fit() {
    var stage = document.querySelector(".stage");
    if (!stage) return;
    var s = Math.min(window.innerWidth / W, window.innerHeight / H);
    stage.style.transform = "scale(" + s + ")";
    stage.style.left = (window.innerWidth - W * s) / 2 + "px";
    stage.style.top = (window.innerHeight - H * s) / 2 + "px";
  }

  window.addEventListener("resize", fit);
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", fit);
  } else {
    fit();
  }
})();

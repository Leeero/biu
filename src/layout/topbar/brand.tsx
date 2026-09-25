import { Link } from "react-router";

/**
 * 顶栏品牌位。
 *
 * 决策 3 移除侧栏后，Logo 从侧栏迁到这里；品牌位同时是一级导航的第一个出口
 * （点击回发现音乐）。字号 24 / 字重 700 / 字距 -0.4px 取自设计稿实测。
 */
const Brand = () => (
  <Link
    to="/"
    aria-label="Biu · 返回发现音乐"
    className="window-no-drag flex-none text-[24px] leading-none font-bold tracking-[-0.4px] text-[rgb(var(--biu-text-primary))] no-underline"
  >
    Biu
  </Link>
);

export default Brand;

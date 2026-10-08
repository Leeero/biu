import { useNavigate } from "react-router";

import { RiDownload2Line, RiHeart3Line, RiMusic2Line, RiTimeLine } from "@remixicon/react";
import clx from "classnames";

const ITEMS = [
  { label: "发现", href: "/", icon: RiMusic2Line },
  { label: "音乐库", href: "/library", icon: RiHeart3Line },
  { label: "稍后", href: "/later", icon: RiTimeLine },
  { label: "下载", href: "/download-list", icon: RiDownload2Line },
] as const;

const MobileNav = ({ pathname }: { pathname: string }) => {
  const navigate = useNavigate();
  return (
    <nav className="shell4188-mobile-nav" aria-label="移动端导航">
      {ITEMS.map(({ label, href, icon: Icon }) => {
        const active = href === "/" ? pathname === "/" || pathname === "/search" : pathname.startsWith(href);
        return (
          <button
            key={href}
            type="button"
            className={clx(active && "is-active")}
            aria-current={active ? "page" : undefined}
            onClick={() => navigate(href)}
          >
            <Icon size={18} />
            <span>{label}</span>
          </button>
        );
      })}
    </nav>
  );
};

export default MobileNav;

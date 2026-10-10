import type { ReactNode } from "react";

import { RiErrorWarningLine, RiInbox2Line, RiLoader4Line } from "@remixicon/react";
import { twMerge } from "tailwind-merge";

import { Button } from "@/ui/primitives/button";

type PageStateKind = "loading" | "empty" | "error";

interface PageStateProps {
  kind: PageStateKind;
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: ReactNode;
  className?: string;
}

const defaults: Record<PageStateKind, { title: string; description: string }> = {
  loading: { title: "正在加载", description: "内容马上就好" },
  empty: { title: "这里还没有内容", description: "换个分类或稍后再来看看" },
  error: { title: "加载失败", description: "请检查网络后重试" },
};

export const PageState = ({
  kind,
  title = defaults[kind].title,
  description = defaults[kind].description,
  actionLabel,
  onAction,
  icon,
  className,
}: PageStateProps) => (
  <section
    role={kind === "error" ? "alert" : "status"}
    aria-live="polite"
    className={twMerge("flex min-h-64 flex-col items-center justify-center px-6 text-center", className)}
  >
    <div className="lili-theme-4188:bg-[var(--lili-4188-surface-elevated)] lili-theme-4188:text-[var(--lili-4188-text-secondary)] lili-theme-4188:shadow-none mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[rgb(var(--lili-color-surface-raised))] text-[rgb(var(--lili-color-text-secondary))] shadow-[var(--lili-shadow-card)]">
      {kind === "loading" ? (
        <RiLoader4Line aria-hidden="true" className="size-6 animate-spin text-[var(--lili-4188-action)]" />
      ) : (
        (icon ?? (kind === "error" ? <RiErrorWarningLine /> : <RiInbox2Line />))
      )}
    </div>
    <h2 className="lili-theme-4188:text-[var(--lili-4188-text-primary)] text-base font-semibold">{title}</h2>
    <p className="lili-theme-4188:text-[var(--lili-4188-text-muted)] mt-1 max-w-sm text-sm text-[rgb(var(--lili-color-text-secondary))]">
      {description}
    </p>
    {actionLabel && onAction && (
      <Button className="mt-5" variant="primary" onClick={onAction}>
        {actionLabel}
      </Button>
    )}
  </section>
);

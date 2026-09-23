import type { ReactNode } from "react";

import { Button, Spinner } from "@heroui/react";
import { RiErrorWarningLine, RiInbox2Line } from "@remixicon/react";
import { twMerge } from "tailwind-merge";

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
    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[rgb(var(--biu-color-surface-raised))] text-[rgb(var(--biu-color-text-secondary))] shadow-[var(--biu-shadow-card)]">
      {kind === "loading" ? (
        <Spinner size="md" />
      ) : (
        (icon ?? (kind === "error" ? <RiErrorWarningLine /> : <RiInbox2Line />))
      )}
    </div>
    <h2 className="text-base font-semibold">{title}</h2>
    <p className="mt-1 max-w-sm text-sm text-[rgb(var(--biu-color-text-secondary))]">{description}</p>
    {actionLabel && onAction && (
      <Button className="mt-5" color="primary" variant="flat" onPress={onAction}>
        {actionLabel}
      </Button>
    )}
  </section>
);

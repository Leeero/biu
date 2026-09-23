import type { ReactNode } from "react";

import { twMerge } from "tailwind-merge";

interface PageHeaderProps {
  title?: ReactNode;
  description?: ReactNode;
  leading?: ReactNode;
  actions?: ReactNode;
  className?: string;
}

export const PageHeader = ({ title, description, leading, actions, className }: PageHeaderProps) => (
  <header className={twMerge("mb-5 flex min-h-11 items-center justify-between gap-4", className)}>
    <div className="min-w-0">
      {leading}
      {title && <h1 className="truncate text-2xl font-semibold tracking-[-0.02em]">{title}</h1>}
      {description && <p className="mt-1 text-sm text-[rgb(var(--biu-color-text-secondary))]">{description}</p>}
    </div>
    {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
  </header>
);

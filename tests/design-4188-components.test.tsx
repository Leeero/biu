import { act } from "react";
import { createRoot } from "react-dom/client";

import { readFileSync } from "node:fs";
import path from "node:path";
import { afterEach, describe, expect, test } from "vitest";

import { Button } from "@/ui/primitives/button";
import { PageState } from "@/ui/states/page-state";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const mounted: Array<{ root: ReturnType<typeof createRoot>; container: HTMLDivElement }> = [];

const render = async (node: React.ReactNode) => {
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  mounted.push({ root, container });
  await act(async () => root.render(node));
  return container;
};

afterEach(async () => {
  for (const item of mounted.splice(0)) {
    await act(async () => item.root.unmount());
    item.container.remove();
  }
});

describe("4188 通用组件合同", () => {
  test("按钮保留 selected、loading 与 error 的真实语义", async () => {
    const container = await render(
      <>
        <Button aria-pressed>已选择</Button>
        <Button loading>处理中</Button>
        <Button aria-invalid>重试</Button>
      </>,
    );
    const [selected, loading, error] = Array.from(container.querySelectorAll("button"));
    expect(selected).toHaveAttribute("aria-pressed", "true");
    expect(loading).toHaveAttribute("aria-busy", "true");
    expect(loading).toHaveAttribute("data-loading", "true");
    expect(loading).toBeDisabled();
    expect(error).toHaveAttribute("aria-invalid", "true");
  });

  test("页面状态覆盖 loading、empty、error 且错误态使用 alert", async () => {
    const container = await render(
      <>
        <PageState kind="loading" />
        <PageState kind="empty" />
        <PageState kind="error" actionLabel="重试" onAction={() => undefined} />
      </>,
    );
    expect(container.querySelectorAll('[role="status"]')).toHaveLength(2);
    expect(container.querySelector('[role="alert"]')).toHaveTextContent("加载失败");
    expect(container.querySelector('[role="alert"] button')).toHaveTextContent("重试");
  });

  test("迁移后的组件只消费 4188 语义令牌，不直接消费原始色板", () => {
    const files = [
      "src/ui/primitives/button/index.tsx",
      "src/ui/primitives/pill/index.tsx",
      "src/ui/primitives/icon-button/index.tsx",
      "src/ui/primitives/search-field/index.tsx",
      "src/ui/primitives/segmented-control/index.tsx",
      "src/ui/primitives/progress-bar/index.tsx",
      "src/ui/primitives/tag/index.tsx",
      "src/ui/patterns/dialog/index.tsx",
      "src/ui/states/page-state.tsx",
    ];

    for (const file of files) {
      const source = readFileSync(path.resolve(process.cwd(), file), "utf8");
      expect(source, file).not.toContain("var(--c-4188-");
    }
  });
});

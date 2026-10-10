import { useState } from "react";

import { RiAlertLine, RiHeartLine } from "@remixicon/react";

import { Button } from "@/ui/primitives/button";
import { IconButton } from "@/ui/primitives/icon-button";
import { SearchField } from "@/ui/primitives/search-field";

import { ExhibitSection, Showcase, StateMatrix, type UiState } from "./showcase";

const previewClass = (state: UiState) =>
  state === "hover"
    ? "brightness-110"
    : state === "focus-visible"
      ? "outline-2 outline-offset-2 outline-[var(--lili-4188-focus)]"
      : state === "pressed"
        ? "scale-[var(--lili-4188-press-scale)] brightness-90"
        : "";

export const State4188Exhibit = () => {
  const [query, setQuery] = useState("");

  return (
    <ExhibitSection
      title="通用组件状态合同"
      note="阶段 3 的八态检查基线。hover、focus-visible 与 pressed 格仅为静态预览；实际键鼠交互仍由同一组件样式提供。"
    >
      <Showcase name="Button" proto=".primary-btn / .secondary-btn" page="源文件 Pages.jsx、styles.css">
        <StateMatrix
          render={state => (
            <Button
              variant={state === "error" ? "danger" : state === "selected" ? "accent" : "primary"}
              disabled={state === "disabled"}
              loading={state === "loading"}
              aria-pressed={state === "selected"}
              aria-invalid={state === "error"}
              className={previewClass(state)}
            >
              {state === "error" ? "重试" : state === "loading" ? "处理中" : "立即播放"}
            </Button>
          )}
        />
      </Showcase>

      <Showcase name="IconButton" proto=".icon-btn / .track-action" page="源文件 styles.css">
        <StateMatrix
          render={state => (
            <IconButton
              label="收藏"
              isDisabled={state === "disabled"}
              isLoading={state === "loading"}
              aria-pressed={state === "selected"}
              className={previewClass(state)}
              color={state === "error" ? "danger" : "default"}
            >
              <RiHeartLine size={18} />
            </IconButton>
          )}
        />
      </Showcase>

      <Showcase name="SearchField" proto=".search-input" page="源文件 Pages.jsx、styles.css">
        <div className="grid gap-4 lg:grid-cols-2">
          <SearchField value={query} onValueChange={setQuery} placeholder="搜索歌曲、歌手或歌单" />
          <SearchField
            value="搜索请求失败"
            onValueChange={() => undefined}
            label="搜索错误"
            className="border-[var(--lili-4188-error)]"
            trailing={<RiAlertLine aria-hidden="true" className="text-[var(--lili-4188-error)]" />}
          />
        </div>
      </Showcase>
    </ExhibitSection>
  );
};

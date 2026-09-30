import { useMemo } from "react";
import { useSearchParams } from "react-router";

import { PLACEHOLDER_GRADIENTS } from "@/ui/fixtures/placeholder-art";
import { DOWNLOADS_FIXTURE_NAME, SCREEN_05_DOWNLOADS_FIXTURE } from "@/ui/fixtures/screen-05-downloads";

export const useDownloadsFixture = () => {
  const [params] = useSearchParams();
  return params.get("fixture") === DOWNLOADS_FIXTURE_NAME;
};

export const useDownloadsFixtureData = () => {
  const enabled = useDownloadsFixture();
  return useMemo(
    () =>
      enabled
        ? {
            ...SCREEN_05_DOWNLOADS_FIXTURE,
            tasks: SCREEN_05_DOWNLOADS_FIXTURE.tasks.map(task => ({
              ...task,
              placeholder: PLACEHOLDER_GRADIENTS[task.artIndex],
            })),
          }
        : null,
    [enabled],
  );
};

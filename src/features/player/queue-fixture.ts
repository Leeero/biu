import { useMemo } from "react";
import { useSearchParams } from "react-router";

import { PLACEHOLDER_GRADIENTS } from "@/ui/fixtures/placeholder-art";
import { QUEUE_FIXTURE_NAME, SCREEN_09_QUEUE_FIXTURE } from "@/ui/fixtures/screen-09-queue";

export const useQueueFixtureData = () => {
  const [params] = useSearchParams();
  const enabled = params.get("fixture") === QUEUE_FIXTURE_NAME;
  return useMemo(
    () =>
      enabled
        ? {
            ...SCREEN_09_QUEUE_FIXTURE,
            tracks: SCREEN_09_QUEUE_FIXTURE.tracks.map(track => ({
              ...track,
              placeholder: PLACEHOLDER_GRADIENTS[track.artIndex],
            })),
          }
        : null,
    [enabled],
  );
};

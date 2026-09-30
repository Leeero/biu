import { useMemo } from "react";
import { useSearchParams } from "react-router";

import { LOCAL_MUSIC_FIXTURE_NAME, SCREEN_04_LOCAL_MUSIC_FIXTURE } from "@/ui/fixtures/screen-04-local-music";

export const useLocalMusicFixture = () => {
  const [params] = useSearchParams();
  return params.get("fixture") === LOCAL_MUSIC_FIXTURE_NAME;
};

export const useLocalMusicFixtureData = () => {
  const enabled = useLocalMusicFixture();
  return useMemo(() => (enabled ? SCREEN_04_LOCAL_MUSIC_FIXTURE : null), [enabled]);
};

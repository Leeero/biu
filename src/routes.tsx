import { lazy } from "react";
import { Navigate, type RouteObject } from "react-router";

import Layout from "./layout";
import EmptyPage from "./pages/empty";
import MusicRecommend from "./pages/music-recommend";
import NotFound from "./pages/not-found";

const DesignSystemPage = lazy(() => import("./pages/design-system"));
const DownloadList = lazy(() => import("./pages/download-list"));
const History = lazy(() => import("./pages/history"));
const Later = lazy(() => import("./pages/later"));
const Library = lazy(() => import("./pages/library"));
const LocalMusicPage = lazy(() => import("./pages/local-music"));
const MiniPlayer = lazy(() => import("./pages/mini-player"));
const Search = lazy(() => import("./pages/search"));
const Settings = lazy(() => import("./pages/settings"));
const SocialPage = lazy(() => import("./pages/social"));
const UserProfile = lazy(() => import("./pages/user-profile"));
const Folder = lazy(() => import("./pages/video-collection"));

const routes: RouteObject[] = [
  {
    path: "/",
    element: <Layout />,
    children: [
      {
        index: true,
        element: <MusicRecommend />,
      },
      {
        path: "library",
        element: <Library />,
      },
      {
        path: "later",
        element: <Later />,
      },
      {
        path: "history",
        element: <History />,
      },
      {
        path: "follow",
        element: <SocialPage />,
      },
      {
        path: "collection/:id",
        element: <Folder />,
      },
      {
        path: "user/:id",
        element: <UserProfile />,
      },
      {
        path: "settings",
        element: <Settings />,
      },
      {
        path: "download-list",
        element: <DownloadList />,
      },
      {
        path: "dynamic-feed",
        element: <Navigate to="/follow?tab=updates" replace />,
      },
      {
        path: "local-music",
        element: <LocalMusicPage />,
      },
      {
        path: "search",
        element: <Search />,
      },
      {
        path: "empty",
        element: <EmptyPage />,
      },
      ...(import.meta.env.DEV
        ? [
            {
              path: "design-system",
              element: <DesignSystemPage />,
            },
          ]
        : []),
    ],
  },
  {
    path: "mini-player",
    element: <MiniPlayer />,
  },
  {
    path: "*",
    element: <NotFound />,
  },
];

export default routes;

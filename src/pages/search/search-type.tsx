export enum SearchType {
  All = "all",
  Video = "video",
  User = "bili_user",
  Playlist = "playlist",
}

export const SearchTypeOptions = [
  {
    label: "综合",
    value: SearchType.All,
  },
  {
    label: "音乐视频",
    value: SearchType.Video,
  },
  {
    label: "创作者",
    value: SearchType.User,
  },
  {
    label: "播放列表",
    value: SearchType.Playlist,
  },
];

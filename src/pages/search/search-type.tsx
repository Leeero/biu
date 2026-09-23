export enum SearchType {
  Video = "video",
  User = "bili_user",
}

export const SearchTypeOptions = [
  {
    label: "音乐视频",
    value: SearchType.Video,
  },
  {
    label: "创作者",
    value: SearchType.User,
  },
];

/** UI 可以基于这些能力决定是否展示操作，不能据此绕过服务端权限校验。 */
export interface TrackCapabilities {
  canPlay: boolean;
  canPlayNext: boolean;
  canAddToQueue: boolean;
  canFavorite: boolean;
  canDownloadAudio: boolean;
  canDownloadVideo: boolean;
  canOpenSource: boolean;
  canOpenCreator: boolean;
}

export interface CapabilityContext {
  isLoggedIn: boolean;
}

export interface PlaylistCapabilities {
  canPlay: boolean;
  canAddToQueue: boolean;
  canFavorite: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canCleanInvalid: boolean;
  canBatchDownloadAudio: boolean;
  canBatchDownloadVideo: boolean;
}

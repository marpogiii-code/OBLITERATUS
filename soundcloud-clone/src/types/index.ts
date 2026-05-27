export interface TrackWithUser {
  id: string;
  title: string;
  description: string;
  audioUrl: string;
  coverUrl: string;
  duration: number;
  genre: string;
  tags: string;
  plays: number;
  isPublic: boolean;
  waveformData: string;
  createdAt: string;
  userId: string;
  user: UserBasic;
  _count: {
    likes: number;
    comments: number;
    reposts: number;
  };
  isLiked?: boolean;
  isReposted?: boolean;
}

export interface UserBasic {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string;
}

export interface UserProfile extends UserBasic {
  bio: string;
  headerUrl: string;
  createdAt: string;
  _count: {
    tracks: number;
    followers: number;
    following: number;
  };
  isFollowing?: boolean;
}

export interface CommentWithUser {
  id: string;
  content: string;
  timestamp: number;
  createdAt: string;
  user: UserBasic;
}

export interface PlaylistWithUser {
  id: string;
  name: string;
  description: string;
  coverUrl: string;
  isPublic: boolean;
  createdAt: string;
  user: UserBasic;
  tracks: {
    track: TrackWithUser;
    position: number;
  }[];
  _count: {
    tracks: number;
  };
}

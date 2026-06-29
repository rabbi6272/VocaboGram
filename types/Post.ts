export interface Post {
  id: string;
  caption: string | null;
  likesCount: number | null;
  commentsCount: number | null;
  sharesCount: number | null;
  viewsCount: number | null;
  type: 'text' | 'image' | 'video' | 'reel';
  location: string;
  media: [
    {
      id: string;
      height: number;
      width: number;
      url: string;
      thumbnailUrl: string;
      type: 'image' | 'video' | 'reel';
    },
  ];
  audio?: {
    id: string;
    title: string;
    artist: string;
    url: string;
    isOriginal: boolean;
  };
  hashtags?: string[];
  isLiked?: boolean;
  isSaved?: boolean;
  updatedAt: { seconds: Date; nanoseconds: Date };
  mentions?: string[];

  userId: string;
  username: string;
  userAvatar: string;
}

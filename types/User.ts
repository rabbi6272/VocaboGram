export interface User {
  uid: string;
  username: string;
  fullName: string;
  bio: string;
  avatarUrl: string;
  email: string;
  followersCount: number;
  followingCount: number;
  gender: string;
  isPrivate: boolean;
  isVerified: boolean;
  postsCount: number;
  website: string;
  createdAt: Date;
  updatedAt: Date;
}

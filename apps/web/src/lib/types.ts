export interface AuthorInfo {
  id: string;
  username: string;
  avatarUrl?: string;
}

export interface PostListItem {
  id: string;
  title: string;
  content: string;
  authorId: string;
  author?: AuthorInfo;
  createdAt?: string;
  likeCount?: number;
  commentCount?: number;
}

export interface UserProfile {
  id: string;
  username: string;
  email?: string;
  avatarUrl?: string;
  bio?: string;
  createdAt?: string;
}

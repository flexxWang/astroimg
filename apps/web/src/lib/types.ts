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

export interface Paginated<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  hasMore: boolean;
}

export interface UserProfile {
  id: string;
  username: string;
  email?: string;
  avatarUrl?: string;
  bio?: string;
  createdAt?: string;
  stats?: {
    posts: number;
    followers: number;
    following: number;
    likes: number;
  };
}

export interface WorkType {
  id: string;
  code: string;
  name: string;
}

export interface WorkDevice {
  id: string;
  code: string;
  name: string;
}

export interface WorkItem {
  id: string;
  title: string;
  description?: string;
  imageUrl: string;
  createdAt?: string;
  authorId: string;
  author?: AuthorInfo;
  type?: Pick<WorkType, "id" | "name">;
  device?: Pick<WorkDevice, "id" | "name">;
}

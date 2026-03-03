import type { PostEntity } from '../../infra/entities/post.entity';
import type { PostMediaEntity } from '../../infra/entities/post-media.entity';
import type { PostLikeEntity } from '../../infra/entities/post-like.entity';
import type { PostCommentEntity } from '../../infra/entities/post-comment.entity';
import type { FeedEntityType, FeedType } from '../../domain/types/feed.types';
import type { MediaType } from '../../infra/entities/post-media.entity';

export const FEED_REPOSITORY = Symbol('FEED_REPOSITORY');

// ---- Input types ----

export type PostCreateInput = {
  authorType: FeedEntityType;
  authorId: string;
  content: string;
  gameId?: number | null;
  medias?: PostMediaInput[];
};

export type PostMediaInput = {
  type: MediaType;
  url: string;
  displayOrder?: number | null;
  width?: number | null;
  height?: number | null;
};

export type PostUpdateInput = {
  content?: string;
  gameId?: number | null;
  medias?: PostMediaInput[];
};

export type CommentCreateInput = {
  postId: string;
  authorId: string;
  content: string;
};

// ---- Query types ----

export type FeedQueryFilter = {
  authorType?: FeedEntityType;
  gameId?: number | null;
};

export type FeedResult = {
  posts: PostWithMeta[];
  total: number;
  hasMore: boolean;
};

export type PostWithMeta = PostEntity & {
  likesCount: number;
  commentsCount: number;
  engagementScore: number;
  isLikedByUser: boolean;
};

export type AuthorPostsResult = {
  data: PostEntity[];
  total: number;
};

// ---- Repository port ----

export interface FeedRepositoryPort {
  // Posts
  createPost(input: PostCreateInput): Promise<PostEntity>;
  findPostById(id: string): Promise<PostEntity | null>;
  updatePost(id: string, input: PostUpdateInput): Promise<PostEntity | null>;
  deletePost(id: string): Promise<void>;
  incrementViewCount(postId: string): Promise<void>;

  // Feed queries
  getDiscoverFeed(
    limit: number,
    offset: number,
    viewerProfileId?: string | null,
    filter?: FeedQueryFilter,
  ): Promise<FeedResult>;
  getFollowingFeed(
    viewerProfileId: string,
    limit: number,
    offset: number,
    filter?: FeedQueryFilter,
  ): Promise<FeedResult>;

  // Author posts
  findPostsByAuthor(
    authorType: FeedEntityType,
    authorId: string,
    limit: number,
    offset: number,
    viewerProfileId?: string | null,
  ): Promise<AuthorPostsResult>;
  findProfileIdBySlug(slug: string): Promise<string | null>;
  findTeamIdBySlug(slug: string): Promise<string | null>;

  // Likes
  toggleLike(postId: string, profileId: string): Promise<{ liked: boolean }>;
  hasLiked(postId: string, profileId: string): Promise<boolean>;

  // Comments
  createComment(input: CommentCreateInput): Promise<PostCommentEntity>;
  findCommentsByPost(postId: string, limit: number, offset: number): Promise<PostCommentEntity[]>;
  findCommentById(commentId: string): Promise<PostCommentEntity | null>;
  deleteComment(commentId: string): Promise<void>;
}

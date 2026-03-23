import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PostEntity } from '../../entities/post.entity';
import { PostLikeEntity } from '../../entities/post-like.entity';
import { PostCommentEntity } from '../../entities/post-comment.entity';
import { PostMediaEntity } from '../../entities/post-media.entity';
import { UserProfileEntity } from '@/contexts/auth/infra/persistence/entities/user-profile.entity';
import { TeamEntity } from '@/contexts/teams/infra/entities/team.entity';
import { FollowEntity } from '@/contexts/follows/infra/entities/follow.entity';
import {
  FeedRepositoryPort,
  PostCreateInput,
  PostUpdateInput,
  FeedQueryFilter,
  FeedResult,
  CommentCreateInput,
  AuthorPostsResult,
  PostWithMeta,
} from '../../../app/ports/feed.repository.port';
import { FeedEntityType } from '../../../domain/types/feed.types';

@Injectable()
export class FeedRepositoryTypeorm implements FeedRepositoryPort {
  constructor(
    @InjectRepository(PostEntity) private postRepo: Repository<PostEntity>,
    @InjectRepository(PostLikeEntity) private likeRepo: Repository<PostLikeEntity>,
    @InjectRepository(PostCommentEntity) private commentRepo: Repository<PostCommentEntity>,
    @InjectRepository(PostMediaEntity) private mediaRepo: Repository<PostMediaEntity>,
    @InjectRepository(UserProfileEntity) private profileRepo: Repository<UserProfileEntity>,
    @InjectRepository(TeamEntity) private teamRepo: Repository<TeamEntity>,
    @InjectRepository(FollowEntity) private followRepo: Repository<FollowEntity>,
  ) {}

  // ---- Posts ----

  async createPost(input: PostCreateInput, authorId): Promise<PostEntity> {

    const post = this.postRepo.create({
      content: input.content,
      authorPlayer: input.authorType === 'PLAYER' ? {id: authorId} : null,
      authorTeam: input.authorType === 'TEAM' ? {id: authorId} : null,
      gameId: input.gameId ?? null,
      status: 'PUBLISHED',
      publishedAt: new Date(),
      likesCount: 0,
      commentsCount: 0,
      viewsCount: 0,
      engagementScore: 0,
    });

    const saved = await this.postRepo.save(post);

    // Handle medias if provided
    if (input.medias && input.medias.length > 0) {
      const mediasToSave = input.medias.map((media) =>
        this.mediaRepo.create({
          post: saved,
          url: media.url,
          type: media.type,
          displayOrder: media.displayOrder ?? null,
          width: media.width ?? null,
          height: media.height ?? null,
        }),
      );
      saved.medias = await this.mediaRepo.save(mediasToSave);
    }

    return saved;
  }

  async findPostById(id: string): Promise<PostEntity | null> {
    return this.postRepo.findOne({
      where: { id },
      relations: ['authorPlayer', 'authorTeam', 'medias', 'likes', 'comments'],
    });
  }

  async updatePost(id: string, input: PostUpdateInput): Promise<PostEntity | null> {
    const post = await this.postRepo.findOne({ where: { id } });
    if (!post) return null;

    if (input.content !== undefined) post.content = input.content;
    if (input.gameId !== undefined) post.gameId = input.gameId;

    const updated = await this.postRepo.save(post);

    // Handle medias if provided
    if (input.medias) {
      // Delete existing medias
      await this.mediaRepo.delete({ post: { id } });

      // Create new medias
      if (input.medias.length > 0) {
        const mediasToSave = input.medias.map((media) =>
          this.mediaRepo.create({
            post: updated,
            url: media.url,
            type: media.type,
            displayOrder: media.displayOrder ?? null,
            width: media.width ?? null,
            height: media.height ?? null,
          }),
        );
        updated.medias = await this.mediaRepo.save(mediasToSave);
      }
    }

    return updated;
  }

  async deletePost(id: string): Promise<void> {
    await this.postRepo.delete(id);
  }

  async incrementViewCount(postId: string): Promise<void> {
    await this.postRepo.increment({ id: postId }, 'viewsCount', 1);
  }

  // ---- Feed Queries ----

  async getDiscoverFeed(
    limit: number,
    offset: number,
    viewerProfileId?: string | null,
    filter?: FeedQueryFilter,
  ): Promise<FeedResult> {
    const query = this.postRepo.createQueryBuilder('post')
      .leftJoinAndSelect('post.authorPlayer', 'authorPlayer')
      .leftJoinAndSelect('post.authorTeam', 'authorTeam')
      .leftJoinAndSelect('post.medias', 'medias')
      .where('post.status = :status', { status: 'PUBLISHED' })
      .orderBy('post.publishedAt', 'DESC');

    // Apply filters
    if (filter?.authorType) {
      if (filter.authorType === 'PLAYER') {
        query.andWhere('post.authorPlayer IS NOT NULL');
      } else if (filter.authorType === 'TEAM') {
        query.andWhere('post.authorTeam IS NOT NULL');
      }
    }

    if (filter?.gameId) {
      query.andWhere('post.gameId = :gameId', { gameId: filter.gameId });
    }

    const total = await query.getCount();
    const posts = await query.skip(offset).take(limit).getMany();

    // Enrich with like/comment counts and user like status
    const enrichedPosts: PostWithMeta[] = await Promise.all(
      posts.map((post) => this.enrichPostWithMeta(post, viewerProfileId)),
    );

    return {
      posts: enrichedPosts,
      total,
      hasMore: offset + limit < total,
    };
  }

  async getFollowingFeed(
    viewerProfileId: string,
    limit: number,
    offset: number,
    filter?: FeedQueryFilter,
  ): Promise<FeedResult> {
    const follows = await this.followRepo.find({
      where: { followerPlayer: { id: viewerProfileId } },
      relations: ['followedPlayer', 'followedTeam'],
    });

    const followedProfileIds = follows
      .map((follow) => follow.followedPlayer?.id)
      .filter((id): id is string => !!id);
    const followedTeamIds = follows
      .map((follow) => follow.followedTeam?.id)
      .filter((id): id is string => !!id);

    if (followedProfileIds.length === 0 && followedTeamIds.length === 0) {
      return { posts: [], total: 0, hasMore: false };
    }

    // Build query for following feed
    const query = this.postRepo.createQueryBuilder('post')
      .leftJoinAndSelect('post.authorPlayer', 'authorPlayer')
      .leftJoinAndSelect('post.authorTeam', 'authorTeam')
      .leftJoinAndSelect('post.medias', 'medias')
      .where('post.status = :status', { status: 'PUBLISHED' })
      .andWhere(
        '(post.author_player_id IN (:...followedProfileIds) OR post.author_team_id IN (:...followedTeamIds))',
        {
          followedProfileIds: followedProfileIds.length > 0 ? followedProfileIds : [''],
          followedTeamIds: followedTeamIds.length > 0 ? followedTeamIds : [''],
        },
      )
      .orderBy('post.publishedAt', 'DESC');

    // Apply filters
    if (filter?.authorType) {
      if (filter.authorType === 'PLAYER') {
        query.andWhere('post.authorPlayer IS NOT NULL');
      } else if (filter.authorType === 'TEAM') {
        query.andWhere('post.authorTeam IS NOT NULL');
      }
    }

    if (filter?.gameId) {
      query.andWhere('post.gameId = :gameId', { gameId: filter.gameId });
    }

    const total = await query.getCount();
    const posts = await query.skip(offset).take(limit).getMany();

    const enrichedPosts: PostWithMeta[] = await Promise.all(
      posts.map((post) => this.enrichPostWithMeta(post, viewerProfileId)),
    );

    return {
      posts: enrichedPosts,
      total,
      hasMore: offset + limit < total,
    };
  }

  // ---- Author Posts ----

  async findPostsByAuthor(
    authorType: FeedEntityType,
    authorId: string,
    limit: number,
    offset: number,
    viewerProfileId?: string | null,
  ): Promise<AuthorPostsResult> {
    const query = this.postRepo.createQueryBuilder('post')
      .leftJoinAndSelect('post.authorPlayer', 'authorPlayer')
      .leftJoinAndSelect('post.authorTeam', 'authorTeam')
      .leftJoinAndSelect('post.medias', 'medias')
      .where('post.status = :status', { status: 'PUBLISHED' });

    if (authorType === 'PLAYER') {
      query.andWhere('post.author_player_id = :authorId', { authorId });
    } else {
      query.andWhere('post.author_team_id = :authorId', { authorId });
    }

    const total = await query.getCount();
    const posts = await query
      .orderBy('post.publishedAt', 'DESC')
      .skip(offset)
      .take(limit)
      .getMany();

    const enrichedPosts: PostWithMeta[] = await Promise.all(
      posts.map((post) => this.enrichPostWithMeta(post, viewerProfileId)),
    );

    return {
      data: enrichedPosts,
      total,
    };
  }

  async findProfileIdBySlug(slug: string): Promise<string | null> {
    const profile = await this.profileRepo.findOne({
      where: { slug },
      select: ['id'],
    });
    return profile?.id ?? null;
  }

  async findTeamIdBySlug(slug: string): Promise<string | null> {
    const team = await this.teamRepo.findOne({
      where: { slug },
      select: ['id'],
    });
    return team?.id ?? null;
  }

  // ---- Likes ----

  async toggleLike(postId: string, profileId: string): Promise<{ liked: boolean }> {
    const existing = await this.likeRepo.findOne({
      where: { post: { id: postId }, profile: { id: profileId } },
    });

    if (existing) {
      // Unlike
      await this.likeRepo.delete(existing.id);
      await this.postRepo.decrement({ id: postId }, 'likesCount', 1);
      return { liked: false };
    } else {
      // Like
      const like = this.likeRepo.create({
        post: { id: postId } as PostEntity,
        profile: { id: profileId } as UserProfileEntity,
      });
      await this.likeRepo.save(like);
      await this.postRepo.increment({ id: postId }, 'likesCount', 1);
      return { liked: true };
    }
  }

  async hasLiked(postId: string, profileId: string): Promise<boolean> {
    const like = await this.likeRepo.findOne({
      where: { post: { id: postId }, profile: { id: profileId } },
    });
    return !!like;
  }

  // ---- Comments ----

  async createComment(input: CommentCreateInput): Promise<PostCommentEntity> {
    const comment = this.commentRepo.create({
      post: { id: input.postId } as PostEntity,
      author: { id: input.authorId } as UserProfileEntity,
      content: input.content,
    });

    const saved = await this.commentRepo.save(comment);
    await this.postRepo.increment({ id: input.postId }, 'commentsCount', 1);

    return this.commentRepo.findOne({
      where: { id: saved.id },
      relations: ['author', 'post'],
    }) as Promise<PostCommentEntity>;
  }

  async findCommentsByPost(postId: string, limit: number, offset: number): Promise<PostCommentEntity[]> {
    return this.commentRepo.find({
      where: { post: { id: postId } },
      relations: ['author'],
      order: { createdAt: 'DESC' },
      skip: offset,
      take: limit,
    });
  }

  async findCommentById(commentId: string): Promise<PostCommentEntity | null> {
    return this.commentRepo.findOne({
      where: { id: commentId },
      relations: ['author', 'post'],
    });
  }

  async deleteComment(commentId: string): Promise<void> {
    const comment = await this.commentRepo.findOne({ where: { id: commentId }, relations: ['post'] });
    if (comment) {
      await this.commentRepo.delete(commentId);
      await this.postRepo.decrement({ id: comment.post.id }, 'commentsCount', 1);
    }
  }

  // ---- Helpers ----

  private async enrichPostWithMeta(
    post: PostEntity,
    viewerProfileId?: string | null,
  ): Promise<PostWithMeta> {
    const likesCount = await this.likeRepo.count({ where: { post: { id: post.id } } });
    const commentsCount = await this.commentRepo.count({ where: { post: { id: post.id } } });
    const isLikedByUser = viewerProfileId ? await this.hasLiked(post.id, viewerProfileId) : false;

    // Calculate engagement score
    const engagementScore = likesCount * 1 + commentsCount * 2 + (post.viewsCount ?? 0) * 0.1;

    return {
      ...post,
      likesCount,
      commentsCount,
      engagementScore,
      isLikedByUser,
    };
  }
}

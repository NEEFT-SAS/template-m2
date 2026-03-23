import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  BadRequestException,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { ConnectedGuard } from '../../auth/infra/guards/connected.guard';

// DTOs
import { GetFeedDto, CreatePostDto, UpdatePostDto } from '@neeft-sas/shared';

// Use Cases
import { GetFeedUseCase } from '../app/usecases/get-feed.usecase';
import { CreatePostUseCase, GetPostUseCase, UpdatePostUseCase, DeletePostUseCase } from '../app/usecases/create-post.usecases';
import { TogglePostLikeUseCase, GetLikeStatusUseCase, CreateCommentUseCase, GetPostCommentsUseCase, DeleteCommentUseCase } from '../app/usecases/post-interactions.usecases';
import { GetAuthorPostsUseCase } from '../app/usecases/get-author-posts.usecase';

type JwtUser = {
  pid: string;
};
type RequestWithUser = Request & { user?: JwtUser };

@Controller('feed')
export class FeedController {
  constructor(
    private readonly getFeedUseCase: GetFeedUseCase,
    private readonly createPostUseCase: CreatePostUseCase,
    private readonly getPostUseCase: GetPostUseCase,
    private readonly updatePostUseCase: UpdatePostUseCase,
    private readonly deletePostUseCase: DeletePostUseCase,
    private readonly togglePostLikeUseCase: TogglePostLikeUseCase,
    private readonly getLikeStatusUseCase: GetLikeStatusUseCase,
    private readonly createCommentUseCase: CreateCommentUseCase,
    private readonly getPostCommentsUseCase: GetPostCommentsUseCase,
    private readonly deleteCommentUseCase: DeleteCommentUseCase,
    private readonly getAuthorPostsUseCase: GetAuthorPostsUseCase,
  ) {}

  /**
   * GET /feed
   * Fetch the feed based on type (DISCOVER, FOLLOWING, PERSONALIZED)
   * Supports optional filters by authorType, gameId
   */
  @Get()
  async getFeed(
    @Query() dto: GetFeedDto,
    @Req() req?: RequestWithUser,
  ) {
    const viewerProfileId = req?.user?.pid ?? null;
    return this.getFeedUseCase.execute(
      dto.type || 'DISCOVER',
      dto.limit || 20,
      dto.offset || 0,
      viewerProfileId,
      {
        authorType: dto.authorType,
        gameId: dto.gameId,
      },
    );
  }

  /**
   * GET /feed/author/:authorType/:authorSlug
   * Fetch all posts from a specific author (PLAYER or TEAM)
   */
  @Get('author/:authorType/:authorSlug')
  async getAuthorPosts(
    @Param('authorType') authorType: string,
    @Param('authorSlug') authorSlug: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @Req() req?: RequestWithUser,
  ) {
    const dto = {
      authorType: authorType as any,
      authorSlug,
      limit: limit ? parseInt(limit, 10) : 20,
      offset: offset ? parseInt(offset, 10) : 0,
    };

    if (!['PLAYER', 'TEAM'].includes(dto.authorType.toUpperCase())) {
      throw new BadRequestException('Invalid authorType. Must be PLAYER or TEAM');
    }

    const viewerProfileId = req?.user?.pid ?? null;
    return this.getAuthorPostsUseCase.execute(
      dto.authorType,
      dto.authorSlug,
      dto.limit,
      dto.offset,
      viewerProfileId,
    );
  }

  /**
   * GET /feed/post/:postId
   * Fetch a specific post by ID
   * Increments view count if user is authenticated
   */
  @Get('post/:postId')
  async getPost(
    @Param('postId') postId: string,
    @Req() req?: RequestWithUser,
  ) {
    const viewerProfileId = req?.user?.pid ?? null;
    return this.getPostUseCase.execute(postId, viewerProfileId);
  }

  /**
   * POST /feed/post
   * Create a new post
   * Requires authentication
   */
  @Post('post')
  @UseGuards(ConnectedGuard)
  async createPost(
    @Body() dto: CreatePostDto,
    @Req() req: RequestWithUser,
  ) {
    if (!req.user?.pid) {
      throw new BadRequestException('User profile ID is required');
    }

    return this.createPostUseCase.execute({
      content: dto.content,
      authorType: dto.authorType || 'PLAYER',
      authorSlug: dto.authorSlug ?? '',
      gameId: dto.gameId || null,
      medias: dto.medias || [],
    }, req.user.pid);
  }

  /**
   * PATCH /feed/:postId
   * Update a post (content, game, medias)
   * Requires authentication and ownership
   */
  @Patch('post/:postId')
  @UseGuards(ConnectedGuard)
  async updatePost(
    @Param('postId') postId: string,
    @Body() dto: UpdatePostDto,
    @Req() req: RequestWithUser,
  ) {
    if (!req.user?.pid) {
      throw new BadRequestException('User profile ID is required');
    }

    return this.updatePostUseCase.execute(postId, req.user.pid, {
      content: dto.content,
      gameId: dto.gameId ?? null,
      medias: dto.medias,
    });
  }

  /**
   * DELETE /feed/:postId
   * Delete a post
   * Requires authentication and ownership
   */
  @Delete('post/:postId')
  @UseGuards(ConnectedGuard)
  @HttpCode(204)
  async deletePost(
    @Param('postId') postId: string,
    @Req() req: RequestWithUser,
  ) {
    if (!req.user?.pid) {
      throw new BadRequestException('User profile ID is required');
    }

    await this.deletePostUseCase.execute(postId, req.user.pid);
  }

  /**
   * POST /feed/post/:postId/like
   * Toggle like on a post
   * Requires authentication
   */
  @Post('post/:postId/like')
  @UseGuards(ConnectedGuard)
  async togglePostLike(
    @Param('postId') postId: string,
    @Req() req: RequestWithUser,
  ) {
    if (!req.user?.pid) {
      throw new BadRequestException('User profile ID is required');
    }

    return this.togglePostLikeUseCase.execute(postId, req.user.pid);
  }

  /**
   * GET /feed/post/:postId/like
   * Get like status for a post
   * Requires authentication
   */
  @Get('post/:postId/like')
  @UseGuards(ConnectedGuard)
  async getLikeStatus(
    @Param('postId') postId: string,
    @Req() req: RequestWithUser,
  ) {
    if (!req.user?.pid) {
      throw new BadRequestException('User profile ID is required');
    }

    return this.getLikeStatusUseCase.execute(postId, req.user.pid);
  }

  /**
   * POST /feed/post/:postId/comments
   * Create a comment on a post
   * Requires authentication
   */
  @Post('post/:postId/comments')
  @UseGuards(ConnectedGuard)
  async createComment(
    @Param('postId') postId: string,
    @Body('content') content: string,
    @Req() req: RequestWithUser,
  ) {
    if (!req.user?.pid) {
      throw new BadRequestException('User profile ID is required');
    }

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      throw new BadRequestException('Comment content is required');
    }

    return this.createCommentUseCase.execute(postId, req.user.pid, content.trim());
  }

  /**
   * GET /feed/post/:postId/comments
   * Get comments for a post
   */
  @Get('post/:postId/comments')
  async getPostComments(
    @Param('postId') postId: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const parsedLimit = limit ? parseInt(limit, 10) : 20;
    const parsedOffset = offset ? parseInt(offset, 10) : 0;

    if (parsedLimit < 1 || parsedLimit > 100) {
      throw new BadRequestException('Limit must be between 1 and 100');
    }

    if (parsedOffset < 0) {
      throw new BadRequestException('Offset must be non-negative');
    }

    return this.getPostCommentsUseCase.execute(postId, parsedLimit, parsedOffset);
  }

  /**
   * DELETE /feed/post/:postId/comments/:commentId
   * Delete a comment
   * Requires authentication and ownership
   */
  @Delete('post/:postId/comments/:commentId')
  @UseGuards(ConnectedGuard)
  @HttpCode(204)
  async deleteComment(
    @Param('postId') postId: string,
    @Param('commentId') commentId: string,
    @Req() req: RequestWithUser,
  ) {
    if (!req.user?.pid) {
      throw new BadRequestException('User profile ID is required');
    }

    await this.deleteCommentUseCase.execute(postId, commentId, req.user.pid);
  }
}

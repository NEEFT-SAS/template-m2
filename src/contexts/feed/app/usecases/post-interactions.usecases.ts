import { Inject, Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { FEED_REPOSITORY, FeedRepositoryPort } from '../ports/feed.repository.port';
import { plainToInstance } from 'class-transformer';
import { FeedPostCommentPresenter } from '../../api/presenters/feed-post-comment.response';

@Injectable()
export class TogglePostLikeUseCase {
  constructor(
    @Inject(FEED_REPOSITORY) private readonly feedRepo: FeedRepositoryPort,
  ) { }

  async execute(postId: string, profileId: string): Promise<{ liked: boolean }> {
    const post = await this.feedRepo.findPostById(postId);
    if (!post) throw new NotFoundException(`Post ${postId} not found`);
    return this.feedRepo.toggleLike(postId, profileId);
  }
}

@Injectable()
export class GetLikeStatusUseCase {
  constructor(
    @Inject(FEED_REPOSITORY) private readonly feedRepo: FeedRepositoryPort,
  ) { }

  async execute(postId: string, profileId: string): Promise<{ hasLiked: boolean }> {
    const hasLiked = await this.feedRepo.hasLiked(postId, profileId);
    return { hasLiked };
  }
}

@Injectable()
export class CreateCommentUseCase {
  constructor(
    @Inject(FEED_REPOSITORY) private readonly feedRepo: FeedRepositoryPort,
  ) { }

  async execute(postId: string, authorId: string, content: string) {
    const post = await this.feedRepo.findPostById(postId);
    if (!post) throw new NotFoundException(`Post ${postId} not found`);

    const comment = await this.feedRepo.createComment({ postId, authorId, content });
    return plainToInstance(FeedPostCommentPresenter, comment, { excludeExtraneousValues: true });
  }
}

@Injectable()
export class GetPostCommentsUseCase {
  constructor(
    @Inject(FEED_REPOSITORY) private readonly feedRepo: FeedRepositoryPort,
  ) { }

  async execute(postId: string, limit: number, offset: number) {
    const comments = await this.feedRepo.findCommentsByPost(postId, limit, offset);
    return comments.map((c) =>
      plainToInstance(FeedPostCommentPresenter, c, { excludeExtraneousValues: true }),
    );
  }
}

@Injectable()
export class DeleteCommentUseCase {
  constructor(
    @Inject(FEED_REPOSITORY) private readonly feedRepo: FeedRepositoryPort,
  ) { }

  async execute(postId: string, commentId: string, requesterProfileId: string) {
    const comment = await this.feedRepo.findCommentById(commentId);
    if (!comment || comment.post.id !== postId) {
      throw new NotFoundException(`Comment ${commentId} not found`);
    }
    if (comment.author.id !== requesterProfileId) {
      throw new ForbiddenException('You do not own this comment');
    }
    await this.feedRepo.deleteComment(commentId);
  }
}

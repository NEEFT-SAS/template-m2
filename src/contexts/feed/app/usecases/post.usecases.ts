import { Inject, Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { FEED_REPOSITORY, FeedRepositoryPort, PostCreateInput } from '../ports/feed.repository.port';
import { FeedForbiddenError, FeedNotFoundError } from '../../domain/errors/feed.errors';
import { plainToInstance } from 'class-transformer';
import { FeedPostPresenter } from '../../api/presenters/feed-post.response';

@Injectable()
export class CreatePostUseCase {
  constructor(
    @Inject(FEED_REPOSITORY) private readonly feedRepo: FeedRepositoryPort,
  ) { }

  async execute(input: PostCreateInput) {
    const post = await this.feedRepo.createPost(input);
    return plainToInstance(FeedPostPresenter, post, { excludeExtraneousValues: true });
  }
}

@Injectable()
export class GetPostUseCase {
  constructor(
    @Inject(FEED_REPOSITORY) private readonly feedRepo: FeedRepositoryPort,
  ) { }

  async execute(postId: string, viewerProfileId?: string | null) {
    const post = await this.feedRepo.findPostById(postId);
    if (!post) throw new NotFoundException(`Post ${postId} not found`);

    if (viewerProfileId) {
      await this.feedRepo.incrementViewCount(postId);
    }

    return plainToInstance(FeedPostPresenter, post, { excludeExtraneousValues: true });
  }
}

@Injectable()
export class UpdatePostUseCase {
  constructor(
    @Inject(FEED_REPOSITORY) private readonly feedRepo: FeedRepositoryPort,
  ) { }

  async execute(postId: string, requesterProfileId: string, input: { content?: string; gameId?: number | null; medias?: any[] }) {
    const existing = await this.feedRepo.findPostById(postId);
    if (!existing) throw new NotFoundException(`Post ${postId} not found`);

    // Vérification propriété
    if (existing.authorPlayer && existing.authorPlayer.id !== requesterProfileId) {
      throw new ForbiddenException('You do not own this post');
    }

    const updated = await this.feedRepo.updatePost(postId, input);
    if (!updated) throw new NotFoundException(`Post ${postId} not found`);

    return plainToInstance(FeedPostPresenter, updated, { excludeExtraneousValues: true });
  }
}

@Injectable()
export class DeletePostUseCase {
  constructor(
    @Inject(FEED_REPOSITORY) private readonly feedRepo: FeedRepositoryPort,
  ) { }

  async execute(postId: string, requesterProfileId: string) {
    const existing = await this.feedRepo.findPostById(postId);
    if (!existing) throw new NotFoundException(`Post ${postId} not found`);

    if (existing.authorPlayer && existing.authorPlayer.id !== requesterProfileId) {
      throw new ForbiddenException('You do not own this post');
    }

    await this.feedRepo.deletePost(postId);
  }
}

import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { FEED_REPOSITORY, FeedRepositoryPort } from '../ports/feed.repository.port';
import { FeedEntityType } from '../../domain/types/feed.types';
import { FeedPostPresenter } from '../../api/presenters/feed-post.response';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class GetAuthorPostsUseCase {
  constructor(
    @Inject(FEED_REPOSITORY) private readonly feedRepo: FeedRepositoryPort,
  ) { }

  async execute(
    authorType: FeedEntityType,
    authorSlug: string,
    limit: number,
    offset: number,
    viewerProfileId?: string | null,
  ) {
    let authorId: string | null;

    if (authorType === 'PLAYER') {
      authorId = await this.feedRepo.findProfileIdBySlug(authorSlug);
    } else {
      authorId = await this.feedRepo.findTeamIdBySlug(authorSlug);
    }

    if (!authorId) {
      return {
        data: [],
        pagination: { total: 0, limit, offset, hasMore: false },
      };
    }

    const result = await this.feedRepo.findPostsByAuthor(
      authorType,
      authorId,
      limit,
      offset,
      viewerProfileId,
    );

    return {
      data: result.data.map((p) =>
        plainToInstance(FeedPostPresenter, p, { excludeExtraneousValues: true }),
      ),
      pagination: {
        total: result.total,
        limit,
        offset,
        hasMore: offset + result.data.length < result.total,
      },
    };
  }
}

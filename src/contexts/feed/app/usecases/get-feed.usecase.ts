import { Inject, Injectable } from '@nestjs/common';
import { FEED_REPOSITORY, FeedRepositoryPort, FeedQueryFilter } from '../ports/feed.repository.port';
import { FeedType } from '../../domain/types/feed.types';
import { plainToInstance } from 'class-transformer';
import { FeedPostPresenter } from '../../api/presenters/feed-post.response';

@Injectable()
export class GetFeedUseCase {
  constructor(
    @Inject(FEED_REPOSITORY) private readonly feedRepo: FeedRepositoryPort,
  ) { }

  async execute(
    feedType: FeedType,
    limit: number,
    offset: number,
    viewerProfileId?: string | null,
    filter?: FeedQueryFilter,
  ) {
    let result;

    if (!viewerProfileId) {
      result = await this.feedRepo.getDiscoverFeed(limit, offset, undefined, filter);
    } else {
      switch (feedType) {
        case 'FOLLOWING':
          result = await this.feedRepo.getFollowingFeed(viewerProfileId, limit, offset, filter);
          break;
        case 'DISCOVER':
          result = await this.feedRepo.getDiscoverFeed(limit, offset, viewerProfileId, filter);
          break;
        case 'PERSONALIZED':
        default:
          // Personalized = 80% following + 20% discover (dédupliqué)
          result = await this._getPersonalizedFeed(viewerProfileId, limit, offset, filter);
          break;
      }
    }

    return {
      data: result.posts.map((p) =>
        plainToInstance(FeedPostPresenter, p, { excludeExtraneousValues: true }),
      ),
      pagination: {
        total: result.total,
        limit,
        offset,
        hasMore: result.hasMore,
      },
    };
  }

  private async _getPersonalizedFeed(
    viewerProfileId: string,
    limit: number,
    offset: number,
    filter?: FeedQueryFilter,
  ) {
    const followingLimit = Math.floor(limit * 0.8);
    const discoverLimit = limit - followingLimit;

    const [followingFeed, discoverFeed] = await Promise.all([
      this.feedRepo.getFollowingFeed(viewerProfileId, followingLimit, offset, filter),
      this.feedRepo.getDiscoverFeed(discoverLimit, 0, viewerProfileId, filter),
    ]);

    const combined = [...followingFeed.posts];
    const existingIds = new Set(combined.map((p) => p.id));

    for (const post of discoverFeed.posts) {
      if (!existingIds.has(post.id)) {
        combined.push(post);
      }
    }

    return {
      posts: combined.slice(0, limit),
      total: followingFeed.total + discoverFeed.total,
      hasMore: followingFeed.hasMore || discoverFeed.hasMore,
    };
  }
}

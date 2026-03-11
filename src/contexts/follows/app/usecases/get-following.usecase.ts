import { Injectable } from '@nestjs/common';
import { FollowListPresenter } from '@neeft-sas/shared';
import { plainToInstance } from 'class-transformer';
import { FollowService } from '../services/follow.service';
import { FollowEntityType } from '../../domain/types/follow.types';

@Injectable()
export class GetFollowingUseCase {
  constructor(
    private readonly followService: FollowService,
  ) {}

  async execute(
    followerType: FollowEntityType,
    slug: string,
    requesterProfileId: string | null | undefined,
    pagination: { limit?: number; offset?: number },
  ): Promise<FollowListPresenter> {
    const result = await this.followService.getFollowing(
      followerType,
      slug,
      requesterProfileId,
      pagination,
    );

    return plainToInstance(FollowListPresenter, result, { excludeExtraneousValues: true });
  }
}

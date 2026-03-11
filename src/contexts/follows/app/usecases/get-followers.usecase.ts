import { Injectable } from '@nestjs/common';
import { FollowListPresenter } from '@neeft-sas/shared';
import { plainToInstance } from 'class-transformer';
import { FollowService } from '../services/follow.service';
import { FollowEntityType } from '../../domain/types/follow.types';

@Injectable()
export class GetFollowersUseCase {
  constructor(
    private readonly followService: FollowService,
  ) {}

  async execute(
    targetType: FollowEntityType,
    slug: string,
    requesterProfileId: string | null | undefined,
    pagination: { limit?: number; offset?: number },
  ): Promise<FollowListPresenter> {
    const result = await this.followService.getFollowers(
      targetType,
      slug,
      requesterProfileId,
      pagination,
    );

    return plainToInstance(FollowListPresenter, result, { excludeExtraneousValues: true });
  }
}

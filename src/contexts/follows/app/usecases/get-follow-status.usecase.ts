import { Injectable } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { FollowService } from '../services/follow.service';
import { FollowEntityType } from '../../domain/types/follow.types';
import { FollowStatusPresenter } from '../../api/presenters/follow-status.presenter';

@Injectable()
export class GetFollowStatusUseCase {
  constructor(
    private readonly followService: FollowService,
  ) {}

  async execute(
    targetType: FollowEntityType,
    targetSlug: string,
    requesterProfileId: string | null | undefined,
  ): Promise<FollowStatusPresenter> {
    const status = await this.followService.getFollowStatus(
      targetType,
      targetSlug,
      requesterProfileId,
    );

    return plainToInstance(FollowStatusPresenter, status, { excludeExtraneousValues: true });
  }
}

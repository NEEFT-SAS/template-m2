import { Injectable } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { FollowActionInput, FollowService } from '../services/follow.service';
import { FollowEntityType } from '../../domain/types/follow.types';
import { FollowStatusPresenter } from '../../api/presenters/follow-status.presenter';

@Injectable()
export class FollowEntityUseCase {
  constructor(
    private readonly followService: FollowService,
  ) {}

  async execute(
    requesterProfileId: string,
    requesterSlug: string | undefined,
    targetType: FollowEntityType,
    targetSlug: string,
    input: FollowActionInput,
  ): Promise<FollowStatusPresenter> {
    const status = await this.followService.follow(
      { ...input, followedType: targetType, followedSlug: targetSlug },
      requesterProfileId,
      requesterSlug,
    );

    return plainToInstance(FollowStatusPresenter, status, { excludeExtraneousValues: true });
  }
}

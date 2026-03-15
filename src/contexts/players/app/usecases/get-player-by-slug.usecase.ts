import { Inject, Injectable } from '@nestjs/common';
import {
  PLAYER_REPOSITORY,
  PlayerRepositoryPort,
} from '../ports/player.repository.port';
import { PlayerNotFoundError } from '../../domain/errors/player-profile.errors';
import { plainToInstance } from 'class-transformer';
import { PlayerProfileResponse } from '../../api/presenters/player-profile.response';
import { PlayerProfileScoreService } from '../services/player-profile-score.service';

@Injectable()
export class GetPlayerBySlugUseCase {
  constructor(
    @Inject(PLAYER_REPOSITORY)
    private readonly playersRepo: PlayerRepositoryPort,
    private readonly playerProfileScoreService: PlayerProfileScoreService,
  ) {}

  async execute(slug: string): Promise<any> {
    const player = await this.playersRepo.findPublicProfileBySlug(slug);
    if (!player) {
      throw new PlayerNotFoundError(slug);
    }

    const scores =
      await this.playerProfileScoreService.computeForProfile(player);

    return plainToInstance(
      PlayerProfileResponse,
      { ...player, ...scores },
      { excludeExtraneousValues: true },
    );
  }
}

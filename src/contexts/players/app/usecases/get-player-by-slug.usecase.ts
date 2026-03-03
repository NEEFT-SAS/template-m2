import { Inject, Injectable } from '@nestjs/common';
import { PLAYER_REPOSITORY, PlayerRepositoryPort } from '../ports/player.repository.port';
import { PlayerNotFoundError } from '../../domain/errors/player-profile.errors';
import { plainToInstance } from 'class-transformer';
import { PlayerProfileResponse } from '../../api/presenters/player-profile.response';

@Injectable()
export class GetPlayerBySlugUseCase {
  constructor(
    @Inject(PLAYER_REPOSITORY) private readonly playersRepo: PlayerRepositoryPort,
  ) {}

  async execute(slug: string): Promise<any> {
    const player = await this.playersRepo.findPublicProfileBySlug(slug);
    if (!player) {
      throw new PlayerNotFoundError(slug);
    }

    return plainToInstance(PlayerProfileResponse, player, { excludeExtraneousValues: true });
  }
}

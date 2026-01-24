import { Inject, Injectable } from '@nestjs/common';
import { PlayerGamePresenter } from '@neeft-sas/shared';
import { plainToInstance } from 'class-transformer';
import { PLAYER_REPOSITORY, PlayerRepositoryPort } from '../../ports/player.repository.port';
import { PlayerNotFoundError } from '@/contexts/players/domain/errors/player-profile.errors';

@Injectable()
export class GetPlayerGamesUseCase {
  constructor(
    @Inject(PLAYER_REPOSITORY) private readonly repo: PlayerRepositoryPort,
  ) {}

  async execute(userSlug: string): Promise<PlayerGamePresenter[]> {
    const profileId = await this.repo.findProfileIdBySlug(userSlug);
    if (!profileId) {
      throw new PlayerNotFoundError(userSlug);
    }

    const games = await this.repo.findPlayerGames(profileId);
    return plainToInstance(PlayerGamePresenter, games, { excludeExtraneousValues: true });
  }
}

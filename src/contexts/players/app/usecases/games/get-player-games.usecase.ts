import { Inject, Injectable } from '@nestjs/common';
import type { PlayerGamePresenter } from '@neeft-sas/shared';
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

    return this.repo.findPlayerGames(profileId);
  }
}

import { Inject, Injectable } from '@nestjs/common';
import { PlayerGamePresenter } from '@neeft-sas/shared';
import { plainToInstance } from 'class-transformer';
import { PLAYER_REPOSITORY, PlayerRepositoryPort } from '../../ports/player.repository.port';
import { PlayerNotFoundError } from '@/contexts/players/domain/errors/player-profile.errors';
import { PlayerGameNotFoundError } from '@/contexts/players/domain/errors/player-game.errors';

@Injectable()
export class GetPlayerGameUseCase {
  constructor(
    @Inject(PLAYER_REPOSITORY) private readonly repo: PlayerRepositoryPort,
  ) {}

  async execute(userSlug: string, gameId: number): Promise<PlayerGamePresenter> {
    const profileId = await this.repo.findProfileIdBySlug(userSlug);
    if (!profileId) {
      throw new PlayerNotFoundError(userSlug);
    }

    const game = await this.repo.findPlayerGameByProfileAndGame(profileId, gameId);
    if (!game) {
      throw new PlayerGameNotFoundError(userSlug, gameId);
    }

    return plainToInstance(PlayerGamePresenter, game, { excludeExtraneousValues: true });
  }
}

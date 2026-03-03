import { Inject, Injectable } from '@nestjs/common';
import { ResourcesStore } from '@/contexts/resources/infra/cache/resources.store';
import { PLAYER_REPOSITORY, PlayerRepositoryPort } from '../../ports/player.repository.port';
import { PlayerNotFoundError } from '@/contexts/players/domain/errors/player-profile.errors';
import { PlayerGameNotFoundError } from '@/contexts/players/domain/errors/player-game.errors';
import { PlayerGameResponse } from '@/contexts/players/api/presenters/player-game.response';
import { toPlayerGameResponse } from '../../services/player-game-response.mapper';

@Injectable()
export class GetPlayerGameUseCase {
  constructor(
    @Inject(PLAYER_REPOSITORY) private readonly repo: PlayerRepositoryPort,
    private readonly resourcesStore: ResourcesStore,
  ) {}

  async execute(userSlug: string, rscGameId: number): Promise<PlayerGameResponse> {
    const profileId = await this.repo.findProfileIdBySlug(userSlug);
    if (!profileId) {
      throw new PlayerNotFoundError(userSlug);
    }

    const game = await this.repo.findPlayerGameByProfileAndGame(profileId, rscGameId);
    if (!game) {
      throw new PlayerGameNotFoundError(userSlug, rscGameId);
    }

    const resource = this.resourcesStore.getSnapshot().rscGames.find((item) => item.id === game.rscGame?.id) ?? null;
    return toPlayerGameResponse(game, resource);
  }
}

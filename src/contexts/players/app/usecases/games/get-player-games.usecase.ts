import { Inject, Injectable } from '@nestjs/common';
import { ResourcesStore } from '@/contexts/resources/infra/cache/resources.store';
import { PLAYER_REPOSITORY, PlayerRepositoryPort } from '../../ports/player.repository.port';
import { PlayerNotFoundError } from '@/contexts/players/domain/errors/player-profile.errors';
import { PlayerGameResponse } from '@/contexts/players/api/presenters/player-game.response';
import { toPlayerGameResponse } from '../../services/player-game-response.mapper';

@Injectable()
export class GetPlayerGamesUseCase {
  constructor(
    @Inject(PLAYER_REPOSITORY) private readonly repo: PlayerRepositoryPort,
    private readonly resourcesStore: ResourcesStore,
  ) {}

  async execute(userSlug: string): Promise<PlayerGameResponse[]> {
    const profileId = await this.repo.findProfileIdBySlug(userSlug);
    if (!profileId) {
      throw new PlayerNotFoundError(userSlug);
    }

    const games = await this.repo.findPlayerGames(profileId);
    const gamesById = new Map(
      this.resourcesStore.getSnapshot().rscGames.map((item) => [item.id, item]),
    );

    return games.map((game) => toPlayerGameResponse(game, gamesById.get(game.rscGame?.id ?? 0) ?? null));
  }
}

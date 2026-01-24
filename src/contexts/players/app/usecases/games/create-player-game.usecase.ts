import { Inject, Injectable } from '@nestjs/common';
import { CreatePlayerGameDTO } from '@neeft-sas/shared';
import type { PlayerGamePresenter } from '@neeft-sas/shared';
import { ResourcesStore } from '@/contexts/resources/infra/cache/resources.store';
import { PlayerNotFoundError } from '@/contexts/players/domain/errors/player-profile.errors';
import { PLAYER_REPOSITORY, PlayerRepositoryPort } from '../../ports/player.repository.port';
import { PlayerGameAlreadyExistsError, PlayerGameDuplicateSelectionError, PlayerGameInvalidCharactersError, PlayerGameInvalidGameError, PlayerGameInvalidModeRanksError, PlayerGameInvalidPlatformsError, PlayerGameInvalidPositionsError } from '@/contexts/players/domain/errors/player-game.errors';
import { EVENT_BUS, EventBusPort } from '@/core/events/event-bus.port';
import { PlayerSearchSyncEvent } from '@/contexts/players/domain/events/player-search-sync.event';
import { buildAccountInput, collectDuplicates } from '../../services/player-game.utils';

@Injectable()
export class CreatePlayerGameUseCase {
  constructor(
    @Inject(PLAYER_REPOSITORY) private readonly repo: PlayerRepositoryPort,
    private readonly resourcesStore: ResourcesStore,
    @Inject(EVENT_BUS) private readonly eventBus: EventBusPort,
  ) {}

  async execute(userSlug: string, dto: CreatePlayerGameDTO): Promise<PlayerGamePresenter> {
    const profileId = await this.repo.findProfileIdBySlug(userSlug);
    if (!profileId) {
      throw new PlayerNotFoundError(userSlug);
    }

    const existing = await this.repo.findPlayerGameIdByProfileAndGame(profileId, dto.gameId);
    if (existing) {
      throw new PlayerGameAlreadyExistsError(userSlug, dto.gameId);
    }

    const snapshot = this.resourcesStore.getSnapshot();
    const game = snapshot.rscGames.find((item) => item.id === dto.gameId);
    if (!game) {
      throw new PlayerGameInvalidGameError(userSlug, dto.gameId);
    }

    const positionIds = dto.positionIds ?? [];
    const platformIds = dto.platformIds ?? [];
    const characterIds = dto.characterIds ?? [];
    const modeRanks = dto.modeRanks ?? [];

    const positionDuplicates = collectDuplicates(positionIds);
    if (positionDuplicates.length) {
      throw new PlayerGameDuplicateSelectionError(userSlug, 'positionIds', positionDuplicates);
    }

    const platformDuplicates = collectDuplicates(platformIds);
    if (platformDuplicates.length) {
      throw new PlayerGameDuplicateSelectionError(userSlug, 'platformIds', platformDuplicates);
    }

    const characterDuplicates = collectDuplicates(characterIds);
    if (characterDuplicates.length) {
      throw new PlayerGameDuplicateSelectionError(userSlug, 'characterIds', characterDuplicates);
    }

    const allowedPositions = new Set(game.positions.map((item) => item.rscPositionId));
    const invalidPositions = positionIds.filter((id) => !allowedPositions.has(id));
    if (invalidPositions.length) {
      throw new PlayerGameInvalidPositionsError(userSlug, invalidPositions);
    }

    const allowedPlatforms = new Set(game.platforms.map((item) => item.rscPlatformId));
    const invalidPlatforms = platformIds.filter((id) => !allowedPlatforms.has(id));
    if (invalidPlatforms.length) {
      throw new PlayerGameInvalidPlatformsError(userSlug, invalidPlatforms);
    }

    const allowedCharacters = new Set(game.characters.map((item) => item.rscCharacterId));
    const invalidCharacters = characterIds.filter((id) => !allowedCharacters.has(id));
    if (invalidCharacters.length) {
      throw new PlayerGameInvalidCharactersError(userSlug, invalidCharacters);
    }

    const modeIds = modeRanks.map((item) => item.modeId);
    const rankIds = modeRanks.map((item) => item.rankId);
    const modeDuplicates = collectDuplicates(modeIds);
    if (modeDuplicates.length) {
      throw new PlayerGameDuplicateSelectionError(userSlug, 'modeRanks', modeDuplicates);
    }

    const allowedModes = new Set(game.modes.map((item) => item.rscModeId));
    const allowedRanks = new Set(game.ranks.map((item) => item.rscRankId));
    const invalidModes = modeIds.filter((id) => !allowedModes.has(id));
    const invalidRanks = rankIds.filter((id) => !allowedRanks.has(id));
    if (invalidModes.length || invalidRanks.length) {
      throw new PlayerGameInvalidModeRanksError(userSlug, invalidModes, invalidRanks);
    }

    const account = buildAccountInput(game.slug, dto.payload ?? null);

    const created = await this.repo.createPlayerGame(profileId, {
      gameId: dto.gameId,
      isRecruitable: dto.isRecruitable,
      isFavoriteGame: dto.isFavoriteGame,
      trackerUrl: dto.trackerUrl ?? null,
      positionIds,
      platformIds,
      characterIds,
      modeRanks,
      account,
    });

    await this.eventBus.publish(PlayerSearchSyncEvent.create({ slug: userSlug }));

    return created;
  }
}

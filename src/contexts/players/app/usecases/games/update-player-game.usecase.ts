import { Inject, Injectable } from '@nestjs/common';
import { UpdatePlayerGameDTO } from '@neeft-sas/shared';
import { ResourcesStore } from '@/contexts/resources/infra/cache/resources.store';
import { PlayerNotFoundError } from '@/contexts/players/domain/errors/player-profile.errors';
import { PlayerGameDuplicateSelectionError, PlayerGameInvalidCharactersError, PlayerGameInvalidGameError, PlayerGameInvalidModeRanksError, PlayerGameInvalidPlatformsError, PlayerGameInvalidPositionsError, PlayerGameNotFoundError } from '@/contexts/players/domain/errors/player-game.errors';
import { EVENT_BUS, EventBusPort } from '@/core/events/event-bus.port';
import { PlayerSearchSyncEvent } from '@/contexts/players/domain/events/player-search-sync.event';
import { PLAYER_REPOSITORY, PlayerGameUpdateInput, PlayerRepositoryPort } from '../../ports/player.repository.port';
import { buildAccountInput, collectDuplicates } from '../../services/player-game.utils';
import { PlayerGameResponse } from '@/contexts/players/api/presenters/player-game.response';
import { toPlayerGameResponse } from '../../services/player-game-response.mapper';

@Injectable()
export class UpdatePlayerGameUseCase {
  constructor(
    @Inject(PLAYER_REPOSITORY) private readonly repo: PlayerRepositoryPort,
    private readonly resourcesStore: ResourcesStore,
    @Inject(EVENT_BUS) private readonly eventBus: EventBusPort,
  ) {}

  async execute(userSlug: string, rscGameId: number, dto: UpdatePlayerGameDTO): Promise<PlayerGameResponse> {
    const profileId = await this.repo.findProfileIdBySlug(userSlug);
    if (!profileId) {
      throw new PlayerNotFoundError(userSlug);
    }

    const existing = await this.repo.findPlayerGameByProfileAndGame(profileId, rscGameId);
    if (!existing) {
      throw new PlayerGameNotFoundError(userSlug, rscGameId);
    }

    const hasPositionIds = dto.positionIds !== undefined;
    const hasPlatformIds = dto.platformIds !== undefined;
    const hasCharacterIds = dto.characterIds !== undefined;
    const hasModeRanks = dto.modeRanks !== undefined;
    const hasPayload = dto.payload !== undefined;

    const requiresResource =
      hasPositionIds || hasPlatformIds || hasCharacterIds || hasModeRanks || hasPayload;

    const snapshot = this.resourcesStore.getSnapshot();
    const game = snapshot.rscGames.find((item) => item.id === rscGameId) ?? null;

    if (requiresResource && !game) {
      throw new PlayerGameInvalidGameError(userSlug, rscGameId);
    }

    let positionIds: number[] | undefined;
    if (hasPositionIds) {
      positionIds = dto.positionIds ?? [];
      const positionDuplicates = collectDuplicates(positionIds);
      if (positionDuplicates.length) {
        throw new PlayerGameDuplicateSelectionError(userSlug, 'positionIds', positionDuplicates);
      }
      const allowedPositions = new Set(game!.rscGamePositions.map((item) => item.id));
      const invalidPositions = positionIds.filter((id) => !allowedPositions.has(id));
      if (invalidPositions.length) {
        throw new PlayerGameInvalidPositionsError(userSlug, invalidPositions);
      }
    }

    let platformIds: number[] | undefined;
    if (hasPlatformIds) {
      platformIds = dto.platformIds ?? [];
      const platformDuplicates = collectDuplicates(platformIds);
      if (platformDuplicates.length) {
        throw new PlayerGameDuplicateSelectionError(userSlug, 'platformIds', platformDuplicates);
      }
      const allowedPlatforms = new Set(game!.rscGamePlatforms.map((item) => item.id));
      const invalidPlatforms = platformIds.filter((id) => !allowedPlatforms.has(id));
      if (invalidPlatforms.length) {
        throw new PlayerGameInvalidPlatformsError(userSlug, invalidPlatforms);
      }
    }

    let characterIds: number[] | undefined;
    if (hasCharacterIds) {
      characterIds = dto.characterIds ?? [];
      const characterDuplicates = collectDuplicates(characterIds);
      if (characterDuplicates.length) {
        throw new PlayerGameDuplicateSelectionError(userSlug, 'characterIds', characterDuplicates);
      }
      const allowedCharacters = new Set(game!.rscGameCharacters.map((item) => item.id));
      const invalidCharacters = characterIds.filter((id) => !allowedCharacters.has(id));
      if (invalidCharacters.length) {
        throw new PlayerGameInvalidCharactersError(userSlug, invalidCharacters);
      }
    }

    let modeRanks: UpdatePlayerGameDTO['modeRanks'] | undefined;
    if (hasModeRanks) {
      modeRanks = dto.modeRanks ?? [];
      const modeIds = modeRanks.map((item) => item.modeId);
      const rankIds = modeRanks.map((item) => item.rankId);
      const modeDuplicates = collectDuplicates(modeIds);
      if (modeDuplicates.length) {
        throw new PlayerGameDuplicateSelectionError(userSlug, 'modeRanks', modeDuplicates);
      }
      const allowedModes = new Set(game!.rscGameModes.map((item) => item.id));
      const allowedRanks = new Set(game!.rscGameRanks.map((item) => item.id));
      const invalidModes = modeIds.filter((id) => !allowedModes.has(id));
      const invalidRanks = rankIds.filter((id) => !allowedRanks.has(id));
      if (invalidModes.length || invalidRanks.length) {
        throw new PlayerGameInvalidModeRanksError(userSlug, invalidModes, invalidRanks);
      }
    }

    const updates: PlayerGameUpdateInput = {};
    if (dto.isRecruitable !== undefined) updates.isRecruitable = dto.isRecruitable;
    if (dto.isFavoriteGame !== undefined) updates.isFavoriteGame = dto.isFavoriteGame;
    if (dto.trackerUrl !== undefined) updates.trackerUrl = dto.trackerUrl ?? null;
    if (hasPositionIds) updates.positionIds = positionIds ?? [];
    if (hasPlatformIds) updates.platformIds = platformIds ?? [];
    if (hasCharacterIds) updates.characterIds = characterIds ?? [];
    if (hasModeRanks) updates.modeRanks = modeRanks ?? [];
    if (hasPayload) {
      updates.account = buildAccountInput(game!.slug, dto.payload ?? null);
    }

    if (!Object.keys(updates).length) {
      return toPlayerGameResponse(existing, game);
    }

    const updated = await this.repo.updatePlayerGame(profileId, rscGameId, updates);
    await this.eventBus.publish(PlayerSearchSyncEvent.create({ slug: userSlug }));
    return toPlayerGameResponse(updated, game);
  }
}

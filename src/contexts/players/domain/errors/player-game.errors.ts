import { DomainError } from "@/core/errors/domain-error";

export class PlayerGameAlreadyExistsError extends DomainError {
  constructor(slug: string, gameId: number) {
    super({
      code: 'PLAYER_GAME_ALREADY_EXISTS',
      message: 'Player already has this game',
      statusCode: 400,
      fields: { gameId: ['already_exists'] },
      details: { slug, gameId },
    });
  }
}

export class PlayerGameInvalidGameError extends DomainError {
  constructor(slug: string, gameId: number) {
    super({
      code: 'PLAYER_GAME_INVALID_GAME',
      message: 'Invalid game for player',
      statusCode: 400,
      fields: { gameId: ['invalid_game'] },
      details: { slug, gameId },
    });
  }
}

export class PlayerGameDuplicateSelectionError extends DomainError {
  constructor(slug: string, field: string, duplicates: number[]) {
    super({
      code: 'PLAYER_GAME_DUPLICATE_SELECTION',
      message: 'Duplicate selection in player game',
      statusCode: 400,
      fields: { [field]: ['duplicate'] },
      details: { slug, field, duplicates },
    });
  }
}

export class PlayerGameInvalidPositionsError extends DomainError {
  constructor(slug: string, invalidIds: number[]) {
    super({
      code: 'PLAYER_GAME_INVALID_POSITIONS',
      message: 'Invalid positions for player game',
      statusCode: 400,
      fields: { positionIds: ['invalid_position'] },
      details: { slug, invalidIds },
    });
  }
}

export class PlayerGameInvalidPlatformsError extends DomainError {
  constructor(slug: string, invalidIds: number[]) {
    super({
      code: 'PLAYER_GAME_INVALID_PLATFORMS',
      message: 'Invalid platforms for player game',
      statusCode: 400,
      fields: { platformIds: ['invalid_platform'] },
      details: { slug, invalidIds },
    });
  }
}

export class PlayerGameInvalidCharactersError extends DomainError {
  constructor(slug: string, invalidIds: number[]) {
    super({
      code: 'PLAYER_GAME_INVALID_CHARACTERS',
      message: 'Invalid characters for player game',
      statusCode: 400,
      fields: { characterIds: ['invalid_character'] },
      details: { slug, invalidIds },
    });
  }
}

export class PlayerGameInvalidModeRanksError extends DomainError {
  constructor(slug: string, invalidModeIds: number[], invalidRankIds: number[]) {
    super({
      code: 'PLAYER_GAME_INVALID_MODE_RANKS',
      message: 'Invalid mode ranks for player game',
      statusCode: 400,
      fields: { modeRanks: ['invalid_mode_rank'] },
      details: { slug, invalidModeIds, invalidRankIds },
    });
  }
}

export class PlayerGameInvalidPayloadError extends DomainError {
  constructor(slug: string, reason: string, details?: Record<string, unknown>) {
    super({
      code: 'PLAYER_GAME_INVALID_PAYLOAD',
      message: 'Invalid payload for player game',
      statusCode: 400,
      fields: { payload: ['invalid_payload'] },
      details: { slug, reason, ...details },
    });
  }
}

export class PlayerGameNotFoundError extends DomainError {
  constructor(slug: string, gameId: number) {
    super({
      code: 'PLAYER_GAME_NOT_FOUND',
      message: 'Player game not found',
      statusCode: 404,
      fields: { gameId: ['not_found'] },
      details: { slug, gameId },
    });
  }
}

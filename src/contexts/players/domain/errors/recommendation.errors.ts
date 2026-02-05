import { DomainError } from '@/core/errors/domain-error';

export class RecommendationGameNotFoundError extends DomainError {
  constructor(gameId: number | string) {
    super({
      code: 'RECOMMENDATION_GAME_NOT_FOUND',
      message: 'Game not found',
      statusCode: 404,
      fields: { gameId: ['not_found'] },
      details: { gameId },
    });
  }
}

export class RecommendationNotFoundError extends DomainError {
  constructor(recommendationId: string) {
    super({
      code: 'RECOMMENDATION_NOT_FOUND',
      message: 'Recommendation not found',
      statusCode: 404,
      fields: { recommendationId: ['not_found'] },
      details: { recommendationId },
    });
  }
}

export class RecommendationForbiddenError extends DomainError {
  constructor(recommendationId: string) {
    super({
      code: 'RECOMMENDATION_FORBIDDEN',
      message: 'Access denied',
      statusCode: 403,
      fields: { recommendationId: ['forbidden'] },
      details: { recommendationId },
    });
  }
}

export class RecommendationSelfNotAllowedError extends DomainError {
  constructor() {
    super({
      code: 'RECOMMENDATION_SELF_NOT_ALLOWED',
      message: 'You cannot recommend yourself',
      statusCode: 400,
      fields: { target: ['self_not_allowed'] },
    });
  }
}

export class RecommendationAlreadyExistsError extends DomainError {
  constructor() {
    super({
      code: 'RECOMMENDATION_ALREADY_EXISTS',
      message: 'Recommendation already exists',
      statusCode: 409,
      fields: { recommendation: ['already_exists'] },
    });
  }
}

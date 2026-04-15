import { DomainError } from '@/core/errors/domain-error';

export class RecruitmentNotFoundError extends DomainError {
  constructor(recruitmentId?: string) {
    super({
      code: 'RECRUITMENT_NOT_FOUND',
      message: 'Offre de recrutement introuvable.',
      statusCode: 404,
      fields: { id: ['not_found'] },
      details: recruitmentId ? { recruitmentId } : {},
    });
  }
}

export class RecruitmentApplicationNotFoundError extends DomainError {
  constructor(applicationId?: string) {
    super({
      code: 'RECRUITMENT_APPLICATION_NOT_FOUND',
      message: 'Candidature introuvable.',
      statusCode: 404,
      fields: { id: ['not_found'] },
      details: applicationId ? { applicationId } : {},
    });
  }
}

export class RecruitmentAccessDeniedError extends DomainError {
  constructor(reason?: string) {
    super({
      code: 'RECRUITMENT_ACCESS_DENIED',
      message: reason || "Vous n'avez pas la permission de gerer ce recrutement.",
      statusCode: 403,
    });
  }
}

export class RecruitmentAlreadyAppliedError extends DomainError {
  constructor() {
    super({
      code: 'RECRUITMENT_ALREADY_APPLIED',
      message: 'Vous avez deja postule a cette offre.',
      statusCode: 400,
    });
  }
}

export class RecruitmentNotPublishedError extends DomainError {
  constructor() {
    super({
      code: 'RECRUITMENT_NOT_PUBLISHED',
      message: "Cette offre n'est pas ouverte aux candidatures.",
      statusCode: 400,
    });
  }
}

export class RecruitmentGameRequiredError extends DomainError {
  constructor(field: 'platformIds' | 'positionIds' | 'rankIds' | 'minRankId' | 'maxRankId') {
    super({
      code: 'RECRUITMENT_GAME_REQUIRED',
      message: 'Le jeu est obligatoire pour definir les positions et les rangs.',
      statusCode: 400,
      fields: { gameId: ['required'] },
      details: { field },
    });
  }
}

export class RecruitmentInvalidGameSelectionError extends DomainError {
  constructor(
    field: 'platformIds' | 'positionIds' | 'rankIds' | 'minRankId' | 'maxRankId',
    gameId: number,
    invalidIds: number[],
  ) {
    super({
      code: 'RECRUITMENT_INVALID_GAME_SELECTION',
      message: 'Certaines selections ne correspondent pas au jeu choisi.',
      statusCode: 400,
      fields: { [field]: ['invalid_for_game'] },
      details: { field, gameId, invalidIds },
    });
  }
}

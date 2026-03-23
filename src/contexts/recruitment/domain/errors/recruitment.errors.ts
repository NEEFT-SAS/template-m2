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
      message: reason || "Vous n'avez pas la permission de gérer ce recrutement.",
      statusCode: 403,
    });
  }
}

export class RecruitmentAlreadyAppliedError extends DomainError {
  constructor() {
    super({
      code: 'RECRUITMENT_ALREADY_APPLIED',
      message: 'Vous avez déjà postulé à cette offre.',
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

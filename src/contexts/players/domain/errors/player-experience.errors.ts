import { DomainError } from "@/core/errors/domain-error";

export class PlayerExperienceInvalidDatesError extends DomainError {
  constructor(details?: { startDate?: Date; endDate?: Date | null }) {
    super({
      code: 'PLAYER_EXPERIENCE_INVALID_DATES',
      message: 'Experience end date cannot be before start date',
      statusCode: 400,
      fields: { endDate: ['end_date_before_start_date'] },
      details,
    });
  }
}

export class PlayerExperienceNotFoundError extends DomainError {
  constructor(slug: string, experienceId: number) {
    super({
      code: 'PLAYER_EXPERIENCE_NOT_FOUND',
      message: 'Experience not found',
      statusCode: 404,
      fields: { experienceId: ['not_found'] },
      details: { slug, experienceId },
    });
  }
}

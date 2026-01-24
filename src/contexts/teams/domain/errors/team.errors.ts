import { DomainError } from '@/core/errors/domain-error';

export class TeamOwnerNotFoundError extends DomainError {
  constructor(ownerProfileId: string) {
    super({
      code: 'TEAM_OWNER_NOT_FOUND',
      message: 'Team owner not found',
      statusCode: 404,
      fields: { ownerProfileId: ['not_found'] },
      details: { ownerProfileId },
    });
  }
}

export class TeamNotFoundError extends DomainError {
  constructor(teamId: string) {
    super({
      code: 'TEAM_NOT_FOUND',
      message: 'Team not found',
      statusCode: 404,
      fields: { teamId: ['not_found'] },
      details: { teamId },
    });
  }
}

export class TeamForbiddenError extends DomainError {
  constructor(teamId: string) {
    super({
      code: 'TEAM_FORBIDDEN',
      message: 'Access denied',
      statusCode: 403,
      fields: { teamId: ['forbidden'] },
      details: { teamId },
    });
  }
}

export class TeamSlugMismatchError extends DomainError {
  constructor(teamId: string, slug: string) {
    super({
      code: 'TEAM_SLUG_MISMATCH',
      message: 'Team slug confirmation does not match',
      statusCode: 400,
      fields: { slug: ['mismatch'] },
      details: { teamId, slug },
    });
  }
}

export class TeamInvalidCountryError extends DomainError {
  constructor(countryId: string) {
    super({
      code: 'TEAM_INVALID_COUNTRY',
      message: 'Invalid country',
      statusCode: 400,
      fields: { countryId: ['invalid_country'] },
      details: { countryId },
    });
  }
}

export class TeamInvalidLanguagesError extends DomainError {
  constructor(invalidIds: string[]) {
    super({
      code: 'TEAM_INVALID_LANGUAGES',
      message: 'Invalid languages',
      statusCode: 400,
      fields: { languageIds: ['invalid_language'] },
      details: { invalidIds },
    });
  }
}

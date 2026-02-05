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

export class TeamMemberProfileNotFoundError extends DomainError {
  constructor(profileSlug: string) {
    super({
      code: 'TEAM_MEMBER_PROFILE_NOT_FOUND',
      message: 'Team member profile not found',
      statusCode: 404,
      fields: { profileSlug: ['not_found'] },
      details: { profileSlug },
    });
  }
}

export class TeamMemberAlreadyExistsError extends DomainError {
  constructor(teamId: string, profileId: string) {
    super({
      code: 'TEAM_MEMBER_ALREADY_EXISTS',
      message: 'Team member already exists',
      statusCode: 409,
      fields: { profileId: ['already_exists'] },
      details: { teamId, profileId },
    });
  }
}

export class TeamMemberNotFoundError extends DomainError {
  constructor(teamId: string, memberId: string) {
    super({
      code: 'TEAM_MEMBER_NOT_FOUND',
      message: 'Team member not found',
      statusCode: 404,
      fields: { memberId: ['not_found'] },
      details: { teamId, memberId },
    });
  }
}

export class TeamRosterNotFoundError extends DomainError {
  constructor(teamId: string, rosterId: string) {
    super({
      code: 'TEAM_ROSTER_NOT_FOUND',
      message: 'Team roster not found',
      statusCode: 404,
      fields: { rosterId: ['not_found'] },
      details: { teamId, rosterId },
    });
  }
}

export class TeamRosterInvalidGameError extends DomainError {
  constructor(gameId: number) {
    super({
      code: 'TEAM_ROSTER_INVALID_GAME',
      message: 'Invalid roster game',
      statusCode: 400,
      fields: { gameId: ['invalid_game'] },
      details: { gameId },
    });
  }
}

export class TeamRosterMemberAlreadyExistsError extends DomainError {
  constructor(rosterId: string, memberId: string) {
    super({
      code: 'TEAM_ROSTER_MEMBER_ALREADY_EXISTS',
      message: 'Roster member already exists',
      statusCode: 409,
      fields: { memberId: ['already_exists'] },
      details: { rosterId, memberId },
    });
  }
}

export class TeamRosterInvalidPositionError extends DomainError {
  constructor(positionId: number, gameId: number) {
    super({
      code: 'TEAM_ROSTER_INVALID_POSITION',
      message: 'Invalid roster position',
      statusCode: 400,
      fields: { positionId: ['invalid_position'] },
      details: { positionId, gameId },
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

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

export class TeamMemberCannotEditSelfError extends DomainError {
  constructor(memberId: string) {
    super({
      code: 'TEAM_MEMBER_CANNOT_EDIT_SELF',
      message: 'You cannot edit your own internal role',
      statusCode: 403,
      fields: { memberId: ['forbidden_self_edit'] },
      details: { memberId },
    });
  }
}

export class TeamMemberRoleForbiddenError extends DomainError {
  constructor(actorRole: string, targetRole: string) {
    super({
      code: 'TEAM_MEMBER_ROLE_FORBIDDEN',
      message: 'You cannot change the role of a member with equal or higher authority',
      statusCode: 403,
      fields: { role: ['forbidden'] },
      details: { actorRole, targetRole },
    });
  }
}

export class TeamMemberOwnerImmutableError extends DomainError {
  constructor() {
    super({
      code: 'TEAM_MEMBER_OWNER_IMMUTABLE',
      message: 'Owner role, permissions and visibility cannot be changed',
      statusCode: 403,
      fields: { role: ['owner_immutable'] },
      details: {},
    });
  }
}

export class TeamMemberIllegalPermissionGrantError extends DomainError {
  constructor(illegalBits: bigint) {
    super({
      code: 'TEAM_MEMBER_ILLEGAL_PERMISSION_GRANT',
      message: 'You cannot grant permissions you do not hold',
      statusCode: 403,
      fields: { permissions: ['illegal_grant'] },
      details: { illegalBits: illegalBits.toString() },
    });
  }
}

export class TeamMemberIllegalPermissionRevokeError extends DomainError {
  constructor(illegalBits: bigint) {
    super({
      code: 'TEAM_MEMBER_ILLEGAL_PERMISSION_REVOKE',
      message: 'You cannot revoke permissions you do not hold',
      statusCode: 403,
      fields: { permissions: ['illegal_revoke'] },
      details: { illegalBits: illegalBits.toString() },
    });
  }
}

export class TeamMemberCannotDeleteOwnerError extends DomainError {
  constructor(teamId: string) {
    super({
      code: 'TEAM_MEMBER_CANNOT_DELETE_OWNER',
      message: 'The team owner cannot be removed from the team',
      statusCode: 403,
      fields: { memberId: ['owner_protected'] },
      details: { teamId },
    });
  }
}

export class TeamMemberEditPermissionError extends DomainError {
  constructor(teamId: string, memberId: string, requesterId: string) {
    super({
      code: 'TEAM_MEMBER_EDIT_PERMISSION_ERROR',
      message: 'Access denied',
      statusCode: 403,
      fields: { memberId: ['forbidden'] },
      details: { teamId, memberId, requesterId },
    });
  }
}


export class TeamMemberManagePermissionError extends DomainError {
  constructor(teamId: string, requesterId: string) {
    super({
      code: 'TEAM_MEMBER_MANAGE_PERMISSION_ERROR',
      message: 'Access denied',
      statusCode: 403,
      fields: { memberId: ['forbidden'] },
      details: { teamId, requesterId },
    });
  }
}

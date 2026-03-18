import { DomainError } from '@/core/errors/domain-error';

export class PlayerStaffRoleAlreadyExistsError extends DomainError {
  constructor(slug: string, roleId: string) {
    super({
      code: 'PLAYER_STAFF_ROLE_ALREADY_EXISTS',
      message: 'Player already has this staff role',
      statusCode: 400,
      fields: { roleId: ['already_exists'] },
      details: { slug, roleId },
    });
  }
}

export class PlayerStaffRoleInvalidRoleError extends DomainError {
  constructor(slug: string, roleId: string) {
    super({
      code: 'PLAYER_STAFF_ROLE_INVALID_ROLE',
      message: 'Invalid staff role for player',
      statusCode: 400,
      fields: { roleId: ['invalid_role'] },
      details: { slug, roleId },
    });
  }
}

export class PlayerStaffRoleNotFoundError extends DomainError {
  constructor(slug: string, roleId: string) {
    super({
      code: 'PLAYER_STAFF_ROLE_NOT_FOUND',
      message: 'Player staff role not found',
      statusCode: 404,
      fields: { roleId: ['not_found'] },
      details: { slug, roleId },
    });
  }
}

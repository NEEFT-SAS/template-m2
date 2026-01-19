import { DomainError } from '../../../../core/errors/domain-error';

export class PlayerIsNotOwnerError extends DomainError {
  constructor() {
    super({
      code: 'PLAYER_IS_NOT_OWNER',
      message: 'Player is not the owner of the profile',
      statusCode: 403,
      fields: { profileId: ['not_owner'] },
    });
  }
}

export class PlayerNotFoundError extends DomainError {
  constructor(slug: string) {
    super({
      code: 'PLAYER_NOT_FOUND',
      message: 'Player not found',
      statusCode: 404,
      fields: { slug: ['not_found'] },
      details: { slug },
    });
  }
}
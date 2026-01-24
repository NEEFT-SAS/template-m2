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

export class PlayerInvalidNationalityError extends DomainError {
  constructor(slug: string, nationalityId: string) {
    super({
      code: 'PLAYER_INVALID_NATIONALITY',
      message: 'Invalid nationality',
      statusCode: 400,
      fields: { nationalityId: ['invalid_country'] },
      details: { slug, nationalityId },
    });
  }
}

export class PlayerInvalidLanguagesError extends DomainError {
  constructor(slug: string, invalidIds: string[]) {
    super({
      code: 'PLAYER_INVALID_LANGUAGES',
      message: 'Invalid languages',
      statusCode: 400,
      fields: { languageIds: ['invalid_language'] },
      details: { slug, invalidIds },
    });
  }
}

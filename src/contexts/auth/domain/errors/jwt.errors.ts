import { DomainError } from "@/core/errors/domain-error";

export class JwtMalformedError extends DomainError {
  constructor() {
    super({
      code: 'JWT_MALFORMED',
      message: 'Malformed JWT token',
      statusCode: 401,
      fields: {
        token: ['Malformed JWT token'],
      },
    });
  }
}

export class JwtExpiredError extends DomainError {
  constructor() {
    super({
      code: 'JWT_EXPIRED',
      message: 'Expired JWT token',
      statusCode: 401,
      fields: {
        token: ['Expired JWT token'],
      },
    });
  }
}

export class JwtInvalidError extends DomainError {
  constructor() {
    super({
      code: 'JWT_INVALID',
      message: 'Invalid JWT token',
      statusCode: 401,
      fields: {
        token: ['Invalid JWT token'],
      },
    });
  }
}
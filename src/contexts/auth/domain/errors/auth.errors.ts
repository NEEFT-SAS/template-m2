import { DomainError } from '@/core/errors/domain-error';

export class AuthInvalidCredentialsError extends DomainError {
  constructor() {
    super({
      code: 'AUTH_INVALID_CREDENTIALS',
      message: 'Invalid credentials',
      statusCode: 401,
      fields: {
        email: ['Invalid credentials'],
        password: ['Invalid credentials'],
      },
    });
  }
}

export class AuthReferralCodeNotFoundError extends DomainError {
  constructor(details?: { referralCode?: string }) {
    super({
      code: 'AUTH_REFERRAL_CODE_NOT_FOUND',
      message: 'Referral code not found',
      statusCode: 404,
      fields: {
        referralCode: ['Referral code not found'],
      },
      details,
    });
  }
}

export class AuthCredentialsTooWeakError extends DomainError {
  constructor(details?: { reason?: string }) {
    super({
      code: 'AUTH_CREDENTIALS_TOO_WEAK',
      message: 'Credentials too weak',
      statusCode: 400,
      fields: {
        password: ['Credentials too weak'],
      },
      details,
    });
  }
}

export class AuthEmailAlreadyUsedError extends DomainError {
  constructor(details?: { email?: string }) {
    super({
      code: 'AUTH_EMAIL_ALREADY_USED',
      message: 'Email already used',
      statusCode: 409,
      fields: {
        email: ['Email already used'],
      },
      details,
    });
  }
}

export class AuthUsernameAlreadyUsedError extends DomainError {
  constructor(details?: { username?: string }) {
    super({
      code: 'AUTH_USERNAME_ALREADY_USED',
      message: 'Username already used',
      statusCode: 409,
      fields: {
        username: ['Username already used'],
      },
      details,
    });
  }
}

export class AuthUserTooYoungError extends DomainError {
  constructor(details?: { minAge?: number, currentAge?: number }) {
    super({
      code: 'AUTH_USER_TOO_YOUNG',
      message: `User must be at least ${details?.minAge ?? 13} years old`,
      statusCode: 400,
      fields: {
        birthDate: [`User must be at least ${details?.minAge ?? 13} years old`],
      },
      details: {
        minAge: 13,
        ...(details ?? {}),
      },
    });
  }
}
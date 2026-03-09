import { DomainError } from '@/core/errors/domain-error';
import { FollowEntityType } from '../types/follow.types';

export class FollowInvalidFollowerError extends DomainError {
  constructor(followerType?: FollowEntityType, followerSlug?: string | null) {
    super({
      code: 'FOLLOW_INVALID_FOLLOWER',
      message: 'Invalid follower',
      statusCode: 400,
      fields: { follower: ['invalid'] },
      details: { followerType, followerSlug: followerSlug ?? null },
    });
  }
}

export class FollowInvalidTargetError extends DomainError {
  constructor(targetType?: FollowEntityType, targetSlug?: string | null) {
    super({
      code: 'FOLLOW_INVALID_TARGET',
      message: 'Invalid target',
      statusCode: 400,
      fields: { target: ['invalid'] },
      details: { targetType, targetSlug: targetSlug ?? null },
    });
  }
}

export class FollowFollowerNotFoundError extends DomainError {
  constructor(followerType: FollowEntityType, followerSlug: string) {
    super({
      code: 'FOLLOW_FOLLOWER_NOT_FOUND',
      message: 'Follower not found',
      statusCode: 404,
      fields: { followerSlug: ['not_found'] },
      details: { followerType, followerSlug },
    });
  }
}

export class FollowTargetNotFoundError extends DomainError {
  constructor(targetType: FollowEntityType, targetSlug: string) {
    super({
      code: 'FOLLOW_TARGET_NOT_FOUND',
      message: 'Target not found',
      statusCode: 404,
      fields: { targetSlug: ['not_found'] },
      details: { targetType, targetSlug },
    });
  }
}

export class FollowForbiddenError extends DomainError {
  constructor(teamSlug: string) {
    super({
      code: 'FOLLOW_FORBIDDEN',
      message: 'Access denied',
      statusCode: 403,
      fields: { followerSlug: ['forbidden'] },
      details: { teamSlug },
    });
  }
}

export class FollowSelfNotAllowedError extends DomainError {
  constructor() {
    super({
      code: 'FOLLOW_SELF_NOT_ALLOWED',
      message: 'You cannot follow yourself',
      statusCode: 400,
      fields: { target: ['self_not_allowed'] },
    });
  }
}

export class FollowAlreadyExistsError extends DomainError {
  constructor() {
    super({
      code: 'FOLLOW_ALREADY_EXISTS',
      message: 'Already following',
      statusCode: 409,
      fields: { follow: ['already_exists'] },
    });
  }
}

export class FollowNotFoundError extends DomainError {
  constructor() {
    super({
      code: 'FOLLOW_NOT_FOUND',
      message: 'Follow not found',
      statusCode: 404,
      fields: { follow: ['not_found'] },
    });
  }
}

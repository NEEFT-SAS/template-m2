import { DomainError } from "@/core/errors/domain-error";

export class SocialLinkDuplicatePlatformError extends DomainError {
  constructor(slug: string) {
    super({
      code: 'SOCIAL_LINK_DUPLICATE_PLATFORM',
      message: 'Duplicate social link platform found',
      statusCode: 400,
      fields: { platformId: ['duplicate_platform'] },
      details: { slug },
    });
  }
}

export class SocialLinkInvalidPlatformError extends DomainError {
  constructor(slug: string, invalidIds: number[]) {
    super({
      code: 'SOCIAL_LINK_INVALID_PLATFORM',
      message: 'Invalid social link platform found',
      statusCode: 400,
      fields: { platformId: ['invalid_platform'] },
      details: { slug, invalidIds },
    });
  }
}
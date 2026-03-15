import { DomainError } from '@/core/errors/domain-error';

export class SearchPremiumFiltersError extends DomainError {
  constructor(filters: string[]) {
    super({
      code: 'SEARCH_PREMIUM_REQUIRED',
      message: 'Premium required to use these filters',
      statusCode: 403,
      fields: { filters },
    });
  }
}

export class SearchProviderUnavailableError extends DomainError {
  constructor(details?: Record<string, unknown>) {
    super({
      code: 'SEARCH_UNAVAILABLE',
      message: 'Search service is temporarily unavailable',
      statusCode: 503,
      details,
    });
  }
}

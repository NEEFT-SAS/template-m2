import { DomainError } from '@/core/errors/domain-error';

export class PlayerReportSelfError extends DomainError {
  constructor(reporterSlug: string, targetSlug: string) {
    super({
      code: 'PLAYER_REPORT_SELF',
      message: 'Player cannot report themselves',
      statusCode: 400,
      fields: { slug: ['cannot_report_self'] },
      details: { reporterSlug, targetSlug },
    });
  }
}

export class PlayerReportNotFoundError extends DomainError {
  constructor(slug: string, reportId: string) {
    super({
      code: 'PLAYER_REPORT_NOT_FOUND',
      message: 'Report not found',
      statusCode: 404,
      fields: { reportId: ['not_found'] },
      details: { slug, reportId },
    });
  }
}

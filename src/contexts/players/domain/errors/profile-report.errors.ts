import { DomainError } from '@/core/errors/domain-error';
import { ReportTargetType } from '../types/profile-report.types';

export class ProfileReportSelfError extends DomainError {
  constructor(reporterSlug: string, targetSlug: string) {
    super({
      code: 'PROFILE_REPORT_SELF',
      message: 'Profile cannot report themselves',
      statusCode: 400,
      fields: { slug: ['cannot_report_self'] },
      details: { reporterSlug, targetSlug },
    });
  }
}

export class ProfileReportDuplicateError extends DomainError {
  constructor(targetType: ReportTargetType, slug: string, reason: string) {
    super({
      code: 'PROFILE_REPORT_DUPLICATE',
      message: 'You have already reported this target for the same reason',
      statusCode: 409,
      fields: { slug: ['already_reported'], reason: ['already_reported'] },
      details: { targetType, slug, reason },
    });
  }
}

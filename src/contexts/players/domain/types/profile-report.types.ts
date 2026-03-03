import { PlayerReportReason } from '@neeft-sas/shared';

export enum ReportTargetTypeEnum {
  USER = 'user',
  TEAM = 'team',
}

export type ReportTargetType = `${ReportTargetTypeEnum}`;
export const REPORT_TARGET_TYPES = Object.values(ReportTargetTypeEnum);

export const REPORT_REASONS = Object.values(PlayerReportReason);
export type ReportReason = PlayerReportReason;

export enum ReportStatusEnum {
  PENDING = 'PENDING',
  IN_REVIEW = 'IN_REVIEW',
  RESOLVED = 'RESOLVED',
  REJECTED = 'REJECTED',
}

export type ReportStatus = `${ReportStatusEnum}`;
export const REPORT_STATUSES = Object.values(ReportStatusEnum);

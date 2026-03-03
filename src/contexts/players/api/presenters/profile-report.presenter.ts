import { Expose } from 'class-transformer';
import { IsDate, IsIn, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { REPORT_REASONS, REPORT_STATUSES, REPORT_TARGET_TYPES, ReportReason, ReportStatus, ReportTargetType } from '../../domain/types/profile-report.types';

export class ProfileReportPresenter {
  @Expose()
  @IsUUID()
  id!: string;

  @Expose()
  @IsIn(REPORT_TARGET_TYPES)
  targetType!: ReportTargetType;

  @Expose()
  @IsIn(REPORT_REASONS)
  reason!: ReportReason;

  @Expose()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  message!: string | null;

  @Expose()
  @IsIn(REPORT_STATUSES)
  status!: ReportStatus;

  @Expose()
  @IsDate()
  createdAt!: Date;
}

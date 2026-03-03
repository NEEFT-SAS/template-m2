import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { REPORT_REASONS, ReportReason } from '../../domain/types/profile-report.types';

export class CreateProfileReportDto {
  @IsIn(REPORT_REASONS)
  reason!: ReportReason;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  message?: string;
}

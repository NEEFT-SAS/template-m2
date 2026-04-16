import { Transform } from 'class-transformer';
import { IsIn, IsString, MaxLength } from 'class-validator';
import {
  TEAM_RECRUITMENT_APPLICATION_REVIEW_STATUSES,
  TeamRecruitmentApplicationReviewStatus,
} from '../../domain/types/recruitment.types';

export class UpdateRecruitmentApplicationStatusDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toUpperCase() : value))
  @IsString()
  @IsIn(TEAM_RECRUITMENT_APPLICATION_REVIEW_STATUSES)
  status!: TeamRecruitmentApplicationReviewStatus;
}

export class RejectRecruitmentApplicationDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MaxLength(4000)
  message!: string;
}

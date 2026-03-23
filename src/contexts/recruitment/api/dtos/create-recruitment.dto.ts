import { IsArray, IsBoolean, IsEnum, IsInt, IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';
import { TEAM_RECRUITMENT_TARGETS, TeamRecruitmentTarget, TEAM_RECRUITMENT_QUESTION_TYPES, TeamRecruitmentQuestionType } from '../../domain/types/recruitment.types';

export class UpsertRecruitmentQuestionDto {
  @IsString()
  @MaxLength(2048)
  title!: string;

  @IsEnum(TEAM_RECRUITMENT_QUESTION_TYPES)
  type!: TeamRecruitmentQuestionType;

  @IsBoolean()
  @IsOptional()
  required?: boolean;
}

export class CreateRecruitmentDto {
  @IsString()
  @MinLength(3)
  @MaxLength(255)
  title!: string;

  @IsString()
  @IsOptional()
  summary?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsBoolean()
  @IsOptional()
  urgent?: boolean;

  @IsBoolean()
  @IsOptional()
  isPaid?: boolean;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  missions?: string[];

  @IsEnum(TEAM_RECRUITMENT_TARGETS)
  target!: TeamRecruitmentTarget;

  @IsInt()
  @IsOptional()
  gameId?: number;

  @IsArray()
  @IsInt({ each: true })
  @IsOptional()
  positionIds?: number[];

  @IsArray()
  @IsInt({ each: true })
  @IsOptional()
  rankIds?: number[];

  @IsInt()
  @IsOptional()
  minElo?: number;

  @IsInt()
  @IsOptional()
  maxElo?: number;

  @IsInt()
  @IsOptional()
  minRankId?: number;

  @IsInt()
  @IsOptional()
  maxRankId?: number;

  @IsBoolean()
  @IsOptional()
  isPublished?: boolean;

  @IsArray()
  @IsOptional()
  questions?: UpsertRecruitmentQuestionDto[];
}

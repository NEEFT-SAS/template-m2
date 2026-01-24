import { toBool, toInt, toStringArray, toNumberArray } from '@neeft-sas/shared';
import { Transform } from 'class-transformer';
import { IsArray, IsBoolean, IsInt, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';

export class SearchPlayersQueryDto {
  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @Transform(({ value }) => toInt(value, 1))
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Transform(({ value }) => toInt(value, 20))
  @IsInt()
  @Min(1)
  @Max(50)
  perPage?: number = 20;

  @IsOptional()
  @IsUUID()
  nationalityId?: string;

  @IsOptional()
  @Transform(({ value }) => toStringArray(value))
  @IsArray()
  @IsUUID('4', { each: true })
  languageIds?: string[];

  @IsOptional()
  @Transform(({ value }) => toNumberArray(value))
  @IsArray()
  @IsInt({ each: true })
  badgeIds?: number[];

  @IsOptional()
  @Transform(({ value }) => toBool(value))
  @IsBoolean()
  hasProfilePicture?: boolean;

  @IsOptional()
  @Transform(({ value }) => toBool(value))
  @IsBoolean()
  hasSocialLinks?: boolean;

  @IsOptional()
  @Transform(({ value }) => toInt(value, 0))
  @IsInt()
  @Min(0)
  minExperienceCount?: number;

  @IsOptional()
  @Transform(({ value }) => toInt(value, 0))
  @IsInt()
  @Min(0)
  minProfileScore?: number;
}

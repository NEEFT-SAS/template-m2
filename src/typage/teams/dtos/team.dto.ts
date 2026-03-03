import { Transform } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDate,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
} from 'class-validator';
import { toDate, toStringArray, toUpperCaseTrimToUndefined, trimToUndefined } from '@/typage/shared/transforms';

export class CreateTeamDTO {
  @Transform(({ value }) => trimToUndefined(value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name!: string;

  @Transform(({ value }) => toUpperCaseTrimToUndefined(value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(4)
  @Matches(/^[A-Z0-9]+$/, { message: 'acronym must contain letters or digits only' })
  acronym!: string;

  @Transform(({ value }) => trimToUndefined(value))
  @IsOptional()
  @IsString()
  @MaxLength(4096)
  description?: string | null;

  @Transform(({ value }) => trimToUndefined(value))
  @IsOptional()
  @IsString()
  @MaxLength(1024)
  quote?: string | null;

  @Transform(({ value }) => trimToUndefined(value))
  @IsOptional()
  @IsString()
  @MaxLength(2048)
  bannerPicture?: string | null;

  @Transform(({ value }) => trimToUndefined(value))
  @IsOptional()
  @IsString()
  @MaxLength(2048)
  logoPicture?: string | null;

  @IsOptional()
  @Transform(({ value }) => toDate(value))
  @IsDate()
  foundedAt?: Date | null;

  @Transform(({ value }) => toStringArray(value))
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID('4', { each: true })
  languageIds!: string[];

  @Transform(({ value }) => trimToUndefined(value))
  @IsOptional()
  @IsUUID()
  countryId?: string | null;

  @Transform(({ value }) => trimToUndefined(value))
  @IsOptional()
  @IsString()
  @MaxLength(255)
  city?: string | null;
}

export class UpdateTeamDTO {
  @Transform(({ value }) => toUpperCaseTrimToUndefined(value))
  @IsOptional()
  @IsString()
  @MaxLength(4)
  @Matches(/^[A-Z0-9]+$/, { message: 'acronym must contain letters or digits only' })
  acronym?: string;

  @Transform(({ value }) => trimToUndefined(value))
  @IsOptional()
  @IsString()
  @MaxLength(4096)
  description?: string | null;

  @Transform(({ value }) => trimToUndefined(value))
  @IsOptional()
  @IsString()
  @MaxLength(1024)
  quote?: string | null;

  @Transform(({ value }) => trimToUndefined(value))
  @IsOptional()
  @IsString()
  @MaxLength(2048)
  bannerPicture?: string | null;

  @Transform(({ value }) => trimToUndefined(value))
  @IsOptional()
  @IsString()
  @MaxLength(2048)
  logoPicture?: string | null;

  @IsOptional()
  @Transform(({ value }) => toDate(value))
  @IsDate()
  foundedAt?: Date | null;

  @Transform(({ value }) => toStringArray(value))
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  languageIds?: string[];

  @Transform(({ value }) => trimToUndefined(value))
  @IsOptional()
  @IsUUID()
  countryId?: string | null;

  @Transform(({ value }) => trimToUndefined(value))
  @IsOptional()
  @IsString()
  @MaxLength(255)
  city?: string | null;
}

export class DeleteTeamDTO {
  @Transform(({ value }) => trimToUndefined(value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  slug!: string;
}

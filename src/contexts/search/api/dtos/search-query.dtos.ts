import { Transform } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

const toBool = (value: unknown, fallback = false) => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') return value.toLowerCase() === 'true';
  if (typeof value === 'number') return value === 1;
  return fallback;
};

const toInt = (value: unknown, fallback = 0) => {
  if (typeof value === 'number') return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number.parseInt(value, 10);
    return Number.isNaN(parsed) ? fallback : parsed;
  }
  return fallback;
};

const toStringArray = (value: unknown) => {
  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return undefined;
    return trimmed
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return undefined;
};

const toNumberArray = (value: unknown) => {
  const raw = toStringArray(value);
  if (!raw) return undefined;
  const parsed = raw
    .map((item) => Number(item))
    .filter((item) => Number.isFinite(item));
  return parsed.length ? parsed : undefined;
};

export const SEARCH_PLAYER_RECRUITABLE_VALUES = [
  'available',
  'unavailable',
] as const;
export type SearchPlayerRecruitable =
  (typeof SEARCH_PLAYER_RECRUITABLE_VALUES)[number];

export const SEARCH_TEAM_STATUSES = ['active', 'open', 'full'] as const;
export type SearchTeamStatus = (typeof SEARCH_TEAM_STATUSES)[number];

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

  @IsOptional()
  @Transform(({ value }) =>
    value === undefined || value === null || value === ''
      ? undefined
      : toInt(value, 0),
  )
  @IsInt()
  @Min(1)
  gameId?: number;

  @IsOptional()
  @Transform(({ value }) =>
    value === undefined || value === null || value === ''
      ? undefined
      : toInt(value, 0),
  )
  @IsInt()
  @Min(0)
  ageMin?: number;

  @IsOptional()
  @Transform(({ value }) =>
    value === undefined || value === null || value === ''
      ? undefined
      : toInt(value, 0),
  )
  @IsInt()
  @Min(0)
  ageMax?: number;

  @IsOptional()
  @Transform(({ value }) =>
    value === undefined || value === null || value === ''
      ? undefined
      : toInt(value, 0),
  )
  @IsInt()
  @Min(1)
  modeId?: number;

  @IsOptional()
  @Transform(({ value }) =>
    value === undefined || value === null || value === ''
      ? undefined
      : toInt(value, 0),
  )
  @IsInt()
  @Min(0)
  rankMin?: number;

  @IsOptional()
  @Transform(({ value }) =>
    value === undefined || value === null || value === ''
      ? undefined
      : toInt(value, 0),
  )
  @IsInt()
  @Min(0)
  rankMax?: number;

  @IsOptional()
  @Transform(({ value }) =>
    value === undefined || value === null || value === ''
      ? undefined
      : toInt(value, 0),
  )
  @IsInt()
  @Min(0)
  eloMin?: number;

  @IsOptional()
  @Transform(({ value }) =>
    value === undefined || value === null || value === ''
      ? undefined
      : toInt(value, 0),
  )
  @IsInt()
  @Min(0)
  eloMax?: number;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null) return undefined;
    const normalized = String(value).trim();
    return normalized === '' ? undefined : normalized;
  })
  @IsIn(SEARCH_PLAYER_RECRUITABLE_VALUES)
  recruitable?: SearchPlayerRecruitable;

  @IsOptional()
  @Transform(({ value }) => toNumberArray(value))
  @IsArray()
  @IsInt({ each: true })
  @Min(1, { each: true })
  positionIds?: number[];

  @IsOptional()
  @Transform(({ value }) => toNumberArray(value))
  @IsArray()
  @IsInt({ each: true })
  @Min(1, { each: true })
  platformIds?: number[];

  @IsOptional()
  @Transform(({ value }) => toNumberArray(value))
  @IsArray()
  @IsInt({ each: true })
  @Min(1, { each: true })
  characterIds?: number[];
}

export class SearchTeamsQueryDto {
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
  @IsUUID('4')
  countryId?: string;

  @IsOptional()
  @Transform(({ value }) => toStringArray(value))
  @IsArray()
  @IsUUID('4', { each: true })
  languageIds?: string[];

  @IsOptional()
  @Transform(({ value }) =>
    value === undefined || value === null || value === ''
      ? undefined
      : toInt(value, 0),
  )
  @IsInt()
  @Min(1)
  gameId?: number;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null) return undefined;
    const normalized = String(value).trim().toLowerCase();
    return normalized === '' ? undefined : normalized;
  })
  @IsIn(SEARCH_TEAM_STATUSES)
  teamStatus?: SearchTeamStatus;
}

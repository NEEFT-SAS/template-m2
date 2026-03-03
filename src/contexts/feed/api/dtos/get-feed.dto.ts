import { Transform } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Max, Min, IsString } from 'class-validator';
import { FEED_TYPES, FeedType, FEED_ENTITY_TYPES, FeedEntityType } from '../../domain/types/feed.types';

export class GetFeedDto {
  @IsEnum(FEED_TYPES)
  @IsOptional()
  type?: FeedType = 'DISCOVER';

  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  @Min(1)
  @Max(50)
  @IsOptional()
  limit?: number = 20;

  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  @Min(0)
  @IsOptional()
  offset?: number = 0;

  @IsEnum(FEED_ENTITY_TYPES)
  @IsOptional()
  authorType?: FeedEntityType;

  @Transform(({ value }) => (value ? parseInt(value, 10) : undefined))
  @IsInt()
  @IsOptional()
  gameId?: number;
}

export class GetAuthorPostsDto {
  @IsEnum(FEED_ENTITY_TYPES)
  authorType!: FeedEntityType;

  @IsString()
  authorSlug!: string;

  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit?: number = 20;

  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  @Min(0)
  @IsOptional()
  offset?: number = 0;
}

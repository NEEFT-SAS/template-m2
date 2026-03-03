import { IsString, IsNotEmpty, IsOptional, IsArray, IsEnum, MaxLength, ValidateNested, IsInt, Min } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { FEED_ENTITY_TYPES, FeedEntityType } from '../../domain/types/feed.types';
import { MEDIA_TYPES, MediaType } from '../../infra/entities/post-media.entity';

export class PostMediaDto {
  @IsString()
  url!: string;

  @IsEnum(MEDIA_TYPES)
  type!: MediaType;

  @IsOptional()
  displayOrder?: number | null;

  @IsInt()
  @Min(0)
  @IsOptional()
  width?: number | null;

  @IsInt()
  @Min(0)
  @IsOptional()
  height?: number | null;
}

export class CreatePostDto {
  @IsEnum(FEED_ENTITY_TYPES)
  @IsOptional()
  authorType?: FeedEntityType = 'PLAYER';

  @IsString()
  @IsOptional()
  authorSlug?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(10000)
  content!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PostMediaDto)
  @IsOptional()
  medias?: PostMediaDto[] = [];

  @Transform(({ value }) => (value ? parseInt(value, 10) : null))
  @IsInt()
  @IsOptional()
  gameId?: number | null;
}

export class UpdatePostDto {
  @IsString()
  @IsOptional()
  @MaxLength(10000)
  content?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PostMediaDto)
  @IsOptional()
  medias?: PostMediaDto[];

  @Transform(({ value }) => (value ? parseInt(value, 10) : null))
  @IsInt()
  @IsOptional()
  gameId?: number | null;
}

export class CreateCommentDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  content!: string;
}

import { IsEnum, IsOptional, IsString } from 'class-validator';
import { FOLLOW_ENTITY_TYPES, FollowEntityType } from '../../domain/types/follow.types';

export class FollowActionDto {
  @IsEnum(FOLLOW_ENTITY_TYPES)
  @IsOptional()
  followerType?: FollowEntityType;

  @IsString()
  @IsOptional()
  followerSlug?: string;

  @IsEnum(FOLLOW_ENTITY_TYPES)
  @IsOptional()
  followedType?: FollowEntityType;

  @IsString()
  @IsOptional()
  followedSlug?: string;
}

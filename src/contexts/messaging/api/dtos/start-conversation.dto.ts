import { IsIn, IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class StartConversationDto {
  @IsOptional()
  @IsIn(['self', 'team', 'SELF', 'TEAM'])
  scope?: string;

  @IsOptional()
  @IsUUID()
  contextTeamId?: string;

  @IsString()
  @IsIn(['player', 'team', 'PLAYER', 'TEAM'])
  targetType!: string;

  @IsOptional()
  @IsUUID()
  targetId?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  targetSlug?: string;

  @IsString()
  @MinLength(1)
  @MaxLength(5000)
  content!: string;
}

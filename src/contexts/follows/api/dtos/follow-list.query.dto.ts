import { Transform } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class FollowListQueryDto {
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
}

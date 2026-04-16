import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateNested,
} from 'class-validator';

export class RecruitmentAnswerPayloadDto {
  @IsUUID()
  questionId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  text?: string | null;

  @IsOptional()
  @IsBoolean()
  boolean?: boolean;
}

export class ApplyToRecruitmentDto {
  @IsOptional()
  @IsString()
  @MaxLength(8000)
  motivation?: string | null;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  positionId?: number | null;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => RecruitmentAnswerPayloadDto)
  answers?: RecruitmentAnswerPayloadDto[];
}

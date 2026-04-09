import { Transform } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, Min } from 'class-validator';

export enum AdCampaignSpendUpdateMode {
  INCREMENT = 'increment',
  SET = 'set',
}

export class AdCampaignSpendUpdateDto {
  @Transform(({ value }) => Number(value))
  @IsNumber()
  @Min(0)
  spent: number;

  @IsOptional()
  @IsEnum(AdCampaignSpendUpdateMode)
  mode?: AdCampaignSpendUpdateMode;
}


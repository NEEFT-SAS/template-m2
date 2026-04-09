import { Transform } from 'class-transformer';
import { IsNumber, Min } from 'class-validator';

export class AdCampaignBudgetUpdateDto {
  @Transform(({ value }) => Number(value))
  @IsNumber()
  @Min(0)
  budget: number;
}


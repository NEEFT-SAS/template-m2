import { Transform } from 'class-transformer';
import { IsDateString, IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { AdCampaignPlacement } from '../../ads.types';

export class AdCampaignCreateDto {
  @IsString()
  name: string;

  @IsEnum(AdCampaignPlacement)
  placementKey: AdCampaignPlacement;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsOptional()
  @IsString()
  targetUrl?: string;

  @IsOptional()
  @IsString()
  creativeUrl?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @Transform(({ value }) => (value === '' || value === null || value === undefined ? undefined : Number(value)))
  @IsNumber()
  @Min(0)
  budget?: number;

  @IsOptional()
  @Transform(({ value }) => (value === null || value === undefined ? undefined : String(value).toUpperCase()))
  @IsString()
  currency?: string;
}


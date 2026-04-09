import { IsEnum, IsOptional } from 'class-validator';
import { AdCampaignStatus } from '../../ads.types';

export class AdCampaignQueryDto {
  @IsOptional()
  @IsEnum(AdCampaignStatus)
  status?: AdCampaignStatus;
}


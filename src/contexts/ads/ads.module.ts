import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { AdsController } from './api/ads.controller';
import { AdsCampaignsService } from './app/services/ads-campaigns.service';
import { AdsService } from './app/services/ads.service';
import { AdAccountEntity } from './infra/entities/ad-account.entity';
import { AdAccountMemberEntity } from './infra/entities/ad-account-member.entity';
import { AdEntity } from './infra/entities/ad.entity';
import { AdCampaignEntity } from './infra/entities/ad-campaign.entity';

@Module({
  imports: [AuthModule, TypeOrmModule.forFeature([AdEntity, AdAccountEntity, AdAccountMemberEntity, AdCampaignEntity])],
  controllers: [AdsController],
  providers: [AdsService, AdsCampaignsService],
  exports: [AdsService, AdsCampaignsService],
})
export class AdsModule {}

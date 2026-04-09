import { ConnectedGuard } from '@/contexts/auth/infra/guards/connected.guard';
import { Body, Controller, Get, Param, Patch, Post, Query, Redirect, Req, UnauthorizedException, UseGuards } from '@nestjs/common';
import { AdsCampaignsService } from '../app/services/ads-campaigns.service';
import { AdsService } from '../app/services/ads.service';
import { AdCampaignBudgetUpdateDto } from './dtos/ad-campaign-budget-update.dto';
import { AdCampaignCreateDto } from './dtos/ad-campaign-create.dto';
import { AdCampaignQueryDto } from './dtos/ad-campaign-query.dto';
import { AdCampaignSpendUpdateDto } from './dtos/ad-campaign-spend-update.dto';
import { AdType } from '../infra/entities/ad.entity';

@Controller('ads')
export class AdsController {
  constructor(
    private readonly adsService: AdsService,
    private readonly adsCampaignsService: AdsCampaignsService,
  ) {}

  @Get()
  async getAd(@Query('type') type?: string) {
    const adType: AdType = type === 'sidebar' ? 'sidebar' : 'banner';
    return this.adsService.getOneAdHtml(adType);
  }

  @Get('click/:id')
  @Redirect()
  async click(@Param('id') id: string) {
    const targetUrl = await this.adsService.resolveClickTarget(id);
    return { url: targetUrl, statusCode: 302 };
  }

  @Get('campaigns')
  @UseGuards(ConnectedGuard)
  async listCampaigns(@Req() req: any, @Query() query: AdCampaignQueryDto) {
    const userProfileId = req.user?.pid;
    if (!userProfileId) throw new UnauthorizedException('Utilisateur non authentifie.');
    return this.adsCampaignsService.listCampaignsForUser(userProfileId, query.status);
  }

  @Post('campaigns/payment-intent')
  @UseGuards(ConnectedGuard)
  async createCampaignPaymentIntent(@Req() req: any, @Body() body: AdCampaignCreateDto) {
    const userProfileId = req.user?.pid;
    if (!userProfileId) throw new UnauthorizedException('Utilisateur non authentifie.');
    return this.adsCampaignsService.createCampaignPaymentIntentForUser(body, userProfileId, req.user?.slug);
  }

  @Post('campaigns/:id/pause')
  @UseGuards(ConnectedGuard)
  async pauseCampaign(@Req() req: any, @Param('id') id: string) {
    const userProfileId = req.user?.pid;
    if (!userProfileId) throw new UnauthorizedException('Utilisateur non authentifie.');
    const campaign = await this.adsCampaignsService.pauseCampaignForUser(id, userProfileId);
    return this.adsCampaignsService.mapCampaign(campaign);
  }

  @Post('campaigns/:id/resume')
  @UseGuards(ConnectedGuard)
  async resumeCampaign(@Req() req: any, @Param('id') id: string) {
    const userProfileId = req.user?.pid;
    if (!userProfileId) throw new UnauthorizedException('Utilisateur non authentifie.');
    const campaign = await this.adsCampaignsService.resumeCampaignForUser(id, userProfileId);
    return this.adsCampaignsService.mapCampaign(campaign);
  }

  @Patch('campaigns/:id/budget')
  @UseGuards(ConnectedGuard)
  async updateBudget(@Req() req: any, @Param('id') id: string, @Body() body: AdCampaignBudgetUpdateDto) {
    const userProfileId = req.user?.pid;
    if (!userProfileId) throw new UnauthorizedException('Utilisateur non authentifie.');
    const campaign = await this.adsCampaignsService.updateCampaignBudgetForUser(id, userProfileId, body);
    return this.adsCampaignsService.mapCampaign(campaign);
  }

  @Patch('campaigns/:id/spend')
  @UseGuards(ConnectedGuard)
  async updateSpend(@Req() req: any, @Param('id') id: string, @Body() body: AdCampaignSpendUpdateDto) {
    const userProfileId = req.user?.pid;
    if (!userProfileId) throw new UnauthorizedException('Utilisateur non authentifie.');
    const campaign = await this.adsCampaignsService.updateCampaignSpendForUser(id, userProfileId, body);
    return this.adsCampaignsService.mapCampaign(campaign);
  }
}

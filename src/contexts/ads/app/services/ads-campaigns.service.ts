import { UserProfileEntity } from '@/contexts/auth/infra/persistence/entities/user-profile.entity';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AdCampaignBudgetUpdateDto } from '../../api/dtos/ad-campaign-budget-update.dto';
import { AdCampaignCreateDto } from '../../api/dtos/ad-campaign-create.dto';
import { AdCampaignSpendUpdateDto, AdCampaignSpendUpdateMode } from '../../api/dtos/ad-campaign-spend-update.dto';
import { AdAccountMemberRole, AdCampaignPlacement, AdCampaignStatus } from '../../ads.types';
import { AdAccountEntity } from '../../infra/entities/ad-account.entity';
import { AdAccountMemberEntity } from '../../infra/entities/ad-account-member.entity';
import { AdCampaignEntity } from '../../infra/entities/ad-campaign.entity';

export type AdsCampaignPresenter = {
  id: string;
  name: string;
  placementKey: string;
  placementLabel: string;
  status: AdCampaignStatus;
  startDate: string;
  endDate: string;
  budget: number;
  spent: number;
  impressions: number;
  clicks: number;
  ctr: number;
  createdAt: string;
  currency?: string;
};

@Injectable()
export class AdsCampaignsService {
  constructor(
    @InjectRepository(AdAccountEntity)
    private readonly accounts: Repository<AdAccountEntity>,
    @InjectRepository(AdAccountMemberEntity)
    private readonly members: Repository<AdAccountMemberEntity>,
    @InjectRepository(AdCampaignEntity)
    private readonly campaigns: Repository<AdCampaignEntity>,
  ) {}

  async listCampaignsForUser(userProfileId: string, status?: AdCampaignStatus): Promise<AdsCampaignPresenter[]> {
    const qb = this.campaigns
      .createQueryBuilder('campaign')
      .innerJoin('campaign.account', 'account')
      .innerJoin('account.members', 'member', 'member.user_profile_id = :userProfileId', { userProfileId })
      .orderBy('campaign.createdAt', 'DESC');

    if (status) qb.andWhere('campaign.status = :status', { status });

    const rows = await qb.getMany();
    return rows.map((row) => this.mapCampaign(row));
  }

  async createCampaignPaymentIntentForUser(payload: AdCampaignCreateDto, userProfileId: string, profileSlug?: string): Promise<{
    intentType: 'payment' | 'hosted_invoice' | 'none';
    clientSecret: string | null;
    campaignId: string | null;
    hostedInvoiceUrl: string | null;
  }> {
    const campaign = await this.createCampaignForUser(payload, userProfileId, profileSlug ?? null);

    return {
      intentType: 'none',
      clientSecret: null,
      campaignId: campaign.id,
      hostedInvoiceUrl: null,
    };
  }

  async pauseCampaignForUser(campaignId: string, userProfileId: string): Promise<AdCampaignEntity> {
    const campaign = await this.getCampaignForUserOrThrow(campaignId, userProfileId);
    if (campaign.status === AdCampaignStatus.ENDED) {
      throw new BadRequestException('Cannot pause an ended campaign');
    }
    campaign.status = AdCampaignStatus.PAUSED;
    return this.campaigns.save(campaign);
  }

  async resumeCampaignForUser(campaignId: string, userProfileId: string): Promise<AdCampaignEntity> {
    const campaign = await this.getCampaignForUserOrThrow(campaignId, userProfileId);
    if (campaign.status === AdCampaignStatus.ENDED) {
      throw new BadRequestException('Cannot resume an ended campaign');
    }
    campaign.status = this.resolveStatusWithBudget(campaign, { preservePaused: false });
    return this.campaigns.save(campaign);
  }

  async updateCampaignBudgetForUser(campaignId: string, userProfileId: string, payload: AdCampaignBudgetUpdateDto): Promise<AdCampaignEntity> {
    const campaign = await this.getCampaignForUserOrThrow(campaignId, userProfileId);
    if (payload.budget < 0) {
      throw new BadRequestException('Budget must be positive');
    }
    campaign.budget = payload.budget;
    campaign.status = this.resolveStatusWithBudget(campaign, { preservePaused: true });
    return this.campaigns.save(campaign);
  }

  async updateCampaignSpendForUser(campaignId: string, userProfileId: string, payload: AdCampaignSpendUpdateDto): Promise<AdCampaignEntity> {
    const campaign = await this.getCampaignForUserOrThrow(campaignId, userProfileId);
    if (payload.spent < 0) {
      throw new BadRequestException('Amount must be positive');
    }

    const current = this.toNumber(campaign.spent);
    const mode = payload.mode ?? AdCampaignSpendUpdateMode.SET;
    const next = mode === AdCampaignSpendUpdateMode.INCREMENT ? current + payload.spent : payload.spent;
    campaign.spent = next;
    campaign.status = this.resolveStatusWithBudget(campaign, { preservePaused: true });
    return this.campaigns.save(campaign);
  }

  mapCampaign(campaign: AdCampaignEntity): AdsCampaignPresenter {
    const impressions = campaign.impressions ?? 0;
    const clicks = campaign.clicks ?? 0;
    const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;

    return {
      id: campaign.id,
      name: campaign.name,
      placementKey: campaign.placementKey,
      placementLabel: this.getPlacementLabel(campaign.placementKey),
      status: campaign.status,
      startDate: campaign.startDate.toISOString(),
      endDate: campaign.endDate.toISOString(),
      budget: this.toNumber(campaign.budget),
      spent: this.toNumber(campaign.spent),
      impressions,
      clicks,
      ctr,
      createdAt: campaign.createdAt.toISOString(),
      currency: campaign.currency,
    };
  }

  private async createCampaignForUser(payload: AdCampaignCreateDto, userProfileId: string, profileSlug?: string | null): Promise<AdCampaignEntity> {
    const account = await this.resolveDefaultAccount(userProfileId, profileSlug ?? null);
    const startDate = this.parseDate(payload.startDate, 'startDate');
    const endDate = this.parseDate(payload.endDate, 'endDate');

    if (endDate < startDate) {
      throw new BadRequestException('End date must be after start date');
    }

    const campaign = this.campaigns.create({
      account,
      name: payload.name,
      placementKey: payload.placementKey,
      status: AdCampaignStatus.DRAFT,
      startDate,
      endDate,
      budget: payload.budget ?? 0,
      currency: (payload.currency ?? 'EUR').toUpperCase(),
      targetUrl: payload.targetUrl ?? null,
      creativeUrl: payload.creativeUrl ?? null,
      notes: payload.notes ?? null,
    });

    return await this.campaigns.save(campaign);
  }

  private async resolveDefaultAccount(userProfileId: string, profileSlug: string | null): Promise<AdAccountEntity> {
    const member = await this.members.findOne({
      where: { user: { id: userProfileId }, isDefault: true },
      relations: ['account'],
    });

    if (member?.account) return member.account;

    const name = profileSlug ? `Campagnes ${profileSlug}` : 'Compte publicitaire';
    const account = await this.accounts.save(this.accounts.create({ name }));

    const userRef = { id: userProfileId } as UserProfileEntity;
    const membership = this.members.create({
      account,
      user: userRef,
      role: AdAccountMemberRole.OWNER,
      isDefault: true,
    });

    await this.members.save(membership);
    return account;
  }

  private async getCampaignForUserOrThrow(campaignId: string, userProfileId: string): Promise<AdCampaignEntity> {
    const campaign = await this.campaigns
      .createQueryBuilder('campaign')
      .innerJoin('campaign.account', 'account')
      .innerJoin('account.members', 'member', 'member.user_profile_id = :userProfileId', { userProfileId })
      .where('campaign.id = :campaignId', { campaignId })
      .getOne();

    if (!campaign) throw new NotFoundException('Campaign not found');
    return campaign;
  }

  private getPlacementLabel(placement: AdCampaignPlacement): string {
    switch (placement) {
      case AdCampaignPlacement.BANNER:
        return 'Banniere';
      case AdCampaignPlacement.SIDEBAR:
        return 'Sidebar';
      default:
        return placement;
    }
  }

  private parseDate(value: string, label: string): Date {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException(`Invalid ${label}`);
    }
    return date;
  }

  private resolveStatusWithBudget(campaign: AdCampaignEntity, options?: { preservePaused?: boolean }): AdCampaignStatus {
    const lifecycleStatus = this.computeLifecycleStatus(campaign);
    if (lifecycleStatus === AdCampaignStatus.ENDED) return AdCampaignStatus.ENDED;

    const budget = this.toNumber(campaign.budget);
    const spent = this.toNumber(campaign.spent);

    if (options?.preservePaused && campaign.status === AdCampaignStatus.PAUSED && (budget <= 0 || spent < budget)) {
      return AdCampaignStatus.PAUSED;
    }

    if (budget > 0 && spent >= budget) return AdCampaignStatus.PAUSED;
    return lifecycleStatus;
  }

  private computeLifecycleStatus(campaign: AdCampaignEntity): AdCampaignStatus {
    const now = new Date();
    if (now < campaign.startDate) return AdCampaignStatus.SCHEDULED;
    if (now > campaign.endDate) return AdCampaignStatus.ENDED;
    return AdCampaignStatus.ACTIVE;
  }

  private toNumber(value: unknown): number {
    if (value == null) return 0;
    if (typeof value === 'number') return value;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
}

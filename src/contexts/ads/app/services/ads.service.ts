import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThanOrEqual, Repository } from 'typeorm';
import { AdDisplayMode, AdEntity, AdType } from '../../infra/entities/ad.entity';

export type AdPresenter = {
  type: 'custom';
  htmlContent?: string;
  imgUrl?: string;
  link?: string;
  displayMode?: AdDisplayMode;
};

@Injectable()
export class AdsService {
  constructor(
    @InjectRepository(AdEntity)
    private readonly adsRepository: Repository<AdEntity>,
  ) {}

  async getOneAd(type: AdType): Promise<AdEntity | null> {
    return this.adsRepository.findOne({
      where: {
        expirationDate: MoreThanOrEqual(new Date()),
        type,
        isActive: true,
      },
      order: { priority: 'DESC' },
    });
  }

  async getOneAdHtml(type: AdType): Promise<AdPresenter | null> {
    const ad = await this.getOneAd(type);
    if (!ad) return null;

    const className = type === 'banner' ? 'neeft-vertise-banner' : 'neeft-vertise-sidebar';
    const displayModeStyle =
      ad.displayMode === 'cover'
        ? 'width:100%;height:100%;object-fit:cover;'
        : 'width:100%;height:auto;';
    const htmlContent = `<a href="${ad.link}" target="_blank" rel="noopener" class="${className}"><img src="${ad.imgUrl}" alt="vertise" class="${className}" style="${displayModeStyle}"/></a>`;

    return {
      type: 'custom',
      htmlContent,
      imgUrl: ad.imgUrl,
      link: ad.link,
      displayMode: ad.displayMode,
    };
  }

  async resolveClickTarget(adId: string): Promise<string> {
    const ad = await this.adsRepository.findOne({
      where: { id: adId, isActive: true, expirationDate: MoreThanOrEqual(new Date()) },
    });
    if (!ad) throw new NotFoundException('Ad not found');
    return ad.link;
  }
}

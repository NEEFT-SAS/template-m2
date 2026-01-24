import { Inject, Injectable } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { CreatePlayerProfessionalExperienceDTO, PlayerProfessionalExperiencePresenter } from '@neeft-sas/shared';
import { PLAYER_REPOSITORY, PlayerRepositoryPort } from '../../ports/player.repository.port';
import { PlayerNotFoundError } from '../../../domain/errors/player-profile.errors';
import { PlayerExperienceInvalidDatesError } from '../../../domain/errors/player-experience.errors';
import { EVENT_BUS, EventBusPort } from '@/core/events/event-bus.port';
import { PlayerSearchSyncEvent } from '../../../domain/events/player-search-sync.event';

@Injectable()
export class AddPlayerProfessionalExperienceUseCase {
  constructor(
    @Inject(PLAYER_REPOSITORY) private readonly repo: PlayerRepositoryPort,
    @Inject(EVENT_BUS) private readonly eventBus: EventBusPort,
  ) {}

  async execute(userSlug: string, dto: CreatePlayerProfessionalExperienceDTO): Promise<PlayerProfessionalExperiencePresenter> {
    if (dto.endDate && dto.startDate && dto.endDate < dto.startDate) {
      throw new PlayerExperienceInvalidDatesError({ startDate: dto.startDate, endDate: dto.endDate });
    }

    const profileId = await this.repo.findProfileIdBySlug(userSlug);
    if (!profileId) {
      throw new PlayerNotFoundError(userSlug);
    }

    const experience = await this.repo.addProfessionalExperience(profileId, {
      companyName: dto.companyName,
      companyLogoUrl: dto.companyLogoUrl ?? null,
      positionTitle: dto.positionTitle,
      contractType: dto.contractType ?? null,
      description: dto.description ?? null,
      missions: dto.missions ?? null,
      startDate: dto.startDate,
      endDate: dto.endDate ?? null,
      location: dto.location ?? null,
    });

    await this.eventBus.publish(PlayerSearchSyncEvent.create({ slug: userSlug }));

    return plainToInstance(PlayerProfessionalExperiencePresenter, experience, { excludeExtraneousValues: true });
  }
}

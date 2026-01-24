import { Inject, Injectable } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { PlayerPrivateProfilePresenter, UpdatePlayerProfileDTO } from '@neeft-sas/shared';
import { AUTH_REPOSITORY, AuthRepositoryPort } from '@/contexts/auth/app/ports/auth.repository.port';
import { AuthEmailAlreadyUsedError } from '@/contexts/auth/domain/errors/auth.errors';
import { PlayerInvalidLanguagesError, PlayerInvalidNationalityError, PlayerNotFoundError } from '../../domain/errors/player-profile.errors';
import { PLAYER_REPOSITORY, PlayerCredentialsUpdateInput, PlayerProfileUpdateInput, PlayerRepositoryPort } from '../ports/player.repository.port';
import { DomainError } from '@/core/errors/domain-error';
import { ResourcesStore } from '@/contexts/resources/infra/cache/resources.store';
import { EVENT_BUS, EventBusPort } from '@/core/events/event-bus.port';
import { PlayerSearchSyncEvent } from '../../domain/events/player-search-sync.event';

@Injectable()
export class UpdatePlayerProfileUseCase {
  constructor(
    @Inject(PLAYER_REPOSITORY) private readonly repo: PlayerRepositoryPort,
    @Inject(AUTH_REPOSITORY) private readonly authRepo: AuthRepositoryPort,
    private readonly resourcesStore: ResourcesStore,
    @Inject(EVENT_BUS) private readonly eventBus: EventBusPort,
  ) {}

  async execute(slug: string, dto: UpdatePlayerProfileDTO, isAdmin: boolean): Promise<PlayerPrivateProfilePresenter> {
    const hasAdminFields =
      dto.firstname !== undefined ||
      dto.lastname !== undefined ||
      dto.email !== undefined ||
      dto.birthdate !== undefined;

    if (hasAdminFields && !isAdmin) {
      throw new DomainError({
        code: 'AUTH_FORBIDDEN',
        message: 'Access denied',
        statusCode: 403,
      });
    }

    const context = await this.repo.findProfileContextBySlug(slug);
    if (!context) {
      throw new PlayerNotFoundError(slug);
    }

    if (dto.email !== undefined) {
      const existing = await this.authRepo.findCredentialsByEmail(dto.email);
      if (existing && existing.id !== context.userCredentialId) {
        throw new AuthEmailAlreadyUsedError({ email: dto.email });
      }
    }

    const profileUpdates: PlayerProfileUpdateInput = {};
    if (dto.firstname !== undefined) profileUpdates.firstname = dto.firstname;
    if (dto.lastname !== undefined) profileUpdates.lastname = dto.lastname;
    if (dto.birthdate !== undefined) profileUpdates.birthDate = dto.birthdate;
    if (dto.description !== undefined) profileUpdates.description = dto.description;
    if (dto.citation !== undefined) profileUpdates.citation = dto.citation;
    if (dto.profilePicture !== undefined) profileUpdates.profilePicture = dto.profilePicture;
    if (dto.bannerPicture !== undefined) profileUpdates.bannerPicture = dto.bannerPicture;

    if (dto.nationalityId !== undefined || dto.languageIds !== undefined) {
      const snapshot = this.resourcesStore.getSnapshot();

      if (dto.nationalityId !== undefined && dto.nationalityId !== null) {
        const allowedCountries = new Set(snapshot.rscCountries.map((country) => country.id));
        if (!allowedCountries.has(dto.nationalityId)) {
          throw new PlayerInvalidNationalityError(slug, dto.nationalityId);
        }
      }

      if (dto.languageIds !== undefined && dto.languageIds !== null) {
        const allowedLanguages = new Set(snapshot.rscLanguages.map((language) => language.id));
        const invalidIds = dto.languageIds.filter((id) => !allowedLanguages.has(id));
        if (invalidIds.length) {
          throw new PlayerInvalidLanguagesError(slug, invalidIds);
        }
      }
    }

    if (dto.nationalityId !== undefined) profileUpdates.nationalityId = dto.nationalityId;
    if (dto.languageIds !== undefined) profileUpdates.languageIds = dto.languageIds;

    const credentialsUpdates: PlayerCredentialsUpdateInput = {};
    if (dto.email !== undefined) credentialsUpdates.email = dto.email;

    await this.repo.updateProfile(context, {
      profile: profileUpdates,
      credentials: Object.keys(credentialsUpdates).length ? credentialsUpdates : undefined,
    });

    const updated = await this.repo.findPrivateProfileBySlug(slug);
    if (!updated) {
      throw new PlayerNotFoundError(slug);
    }

    await this.eventBus.publish(PlayerSearchSyncEvent.create({ slug }));

    return plainToInstance(
      PlayerPrivateProfilePresenter,
      { ...updated.profile, email: updated.credentials.email },
      { excludeExtraneousValues: true },
    );
  }
}

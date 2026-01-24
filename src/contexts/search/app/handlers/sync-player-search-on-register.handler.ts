import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AUTH_USER_REGISTERED_EVENT, UserRegisteredPayload } from '@/contexts/auth/domain/events/user-registered.event.';
import { UserProfileEntity } from '@/contexts/auth/infra/persistence/entities/user-profile.entity';
import { PlayerSearchIndexer } from '../../infra/typesense/player-search.indexer';

@Injectable()
export class SyncPlayerSearchOnRegisterHandler {
  private readonly logger = new Logger(SyncPlayerSearchOnRegisterHandler.name);

  constructor(
    @InjectRepository(UserProfileEntity) private readonly profilesRepo: Repository<UserProfileEntity>,
    private readonly indexer: PlayerSearchIndexer,
  ) {}

  @OnEvent(AUTH_USER_REGISTERED_EVENT)
  async handle(payload: UserRegisteredPayload): Promise<void> {
    const profile = await this.profilesRepo.findOne({
      where: { userCredentialId: payload.userCredentialId },
      select: ['id', 'slug'],
    });

    if (!profile?.slug) {
      this.logger.warn(`Search sync skipped (no profile for credentialId=${payload.userCredentialId})`);
      return;
    }

    try {
      await this.indexer.syncBySlug(profile.slug);
    } catch (err: any) {
      this.logger.error(`Search sync failed for slug=${profile.slug}: ${err?.message ?? err}`);
    }
  }
}

import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PLAYER_SEARCH_SYNC_EVENT, PlayerSearchSyncPayload } from '@/contexts/players/domain/events/player-search-sync.event';
import { PlayerSearchIndexer } from '../../infra/typesense/player-search.indexer';

@Injectable()
export class SyncPlayerSearchOnUpdateHandler {
  private readonly logger = new Logger(SyncPlayerSearchOnUpdateHandler.name);

  constructor(private readonly indexer: PlayerSearchIndexer) {}

  @OnEvent(PLAYER_SEARCH_SYNC_EVENT)
  async handle(payload: PlayerSearchSyncPayload): Promise<void> {
    try {
      await this.indexer.syncBySlug(payload.slug);
    } catch (err: any) {
      this.logger.error(`Search sync failed for slug=${payload.slug}: ${err?.message ?? err}`);
    }
  }
}

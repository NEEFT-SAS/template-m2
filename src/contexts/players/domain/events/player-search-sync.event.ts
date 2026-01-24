export const PLAYER_SEARCH_SYNC_EVENT = 'players.search.sync';

export type PlayerSearchSyncPayload = {
  slug: string;
};

export class PlayerSearchSyncEvent {
  static eventName = PLAYER_SEARCH_SYNC_EVENT;

  static create(payload: PlayerSearchSyncPayload) {
    return {
      name: PlayerSearchSyncEvent.eventName,
      payload,
    };
  }
}

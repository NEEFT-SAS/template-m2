import { PlayerReportReason } from '@neeft-sas/shared';

export const PLAYER_REPORTED_EVENT = 'players.player.reported';

export type PlayerReportedPayload = {
  reportId: string;
  reporterProfileId: string;
  reporterSlug: string;
  targetProfileId: string;
  targetSlug: string;
  reason: PlayerReportReason;
  details: string;
  createdAt: Date;
};

export class PlayerReportedEvent {
  static eventName = PLAYER_REPORTED_EVENT;

  static create(payload: PlayerReportedPayload) {
    return {
      name: PlayerReportedEvent.eventName,
      payload,
    };
  }
}

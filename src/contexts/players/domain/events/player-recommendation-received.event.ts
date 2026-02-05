export const PLAYER_RECOMMENDATION_RECEIVED_EVENT = 'players.recommendation.received';

export type PlayerRecommendationReceivedPayload = {
  recommendationId: string;
  recipientProfileId: string;
  recipientEmail: string;
  recipientSlug: string;
  recipientUsername: string;
  authorDisplayName: string;
  authorSlug: string;
  content: string;
  createdAt: Date;
};

export class PlayerRecommendationReceivedEvent {
  static eventName = PLAYER_RECOMMENDATION_RECEIVED_EVENT;

  static create(payload: PlayerRecommendationReceivedPayload) {
    return {
      name: PlayerRecommendationReceivedEvent.eventName,
      payload,
    };
  }
}

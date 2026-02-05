import { MAILER, MailerPort } from '@/core/mailer/mailer.port';
import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OnEvent } from '@nestjs/event-emitter';
import { PLAYER_RECOMMENDATION_RECEIVED_EVENT, PlayerRecommendationReceivedPayload } from '../../domain/events/player-recommendation-received.event';
import { playerRecommendationReceivedEmailTemplate } from '../../mailer/templates/player-recommendation-received-email.template';

@Injectable()
export class SendPlayerRecommendationReceivedEmailHandler {
  constructor(
    private readonly config: ConfigService,
    @Inject(MAILER) private readonly mailer: MailerPort,
  ) {}

  @OnEvent(PLAYER_RECOMMENDATION_RECEIVED_EVENT)
  async handle(payload: PlayerRecommendationReceivedPayload): Promise<void> {
    const appWebUrl = this.config.get<string>('APP_WEB_URL') ?? '';
    const profileUrl = appWebUrl ? `${appWebUrl.replace(/\/$/, '')}/players/${encodeURIComponent(payload.recipientSlug)}` : undefined;

    const tpl = playerRecommendationReceivedEmailTemplate({
      recipientUsername: payload.recipientUsername,
      recipientSlug: payload.recipientSlug,
      authorDisplayName: payload.authorDisplayName,
      authorSlug: payload.authorSlug,
      content: payload.content,
      createdAt: payload.createdAt,
      profileUrl,
    });

    await this.mailer.send({
      to: payload.recipientEmail,
      subject: tpl.subject,
      text: tpl.text,
      html: tpl.html,
    });
  }
}

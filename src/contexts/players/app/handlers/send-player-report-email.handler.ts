import { MAILER, MailerPort } from '@/core/mailer/mailer.port';
import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OnEvent } from '@nestjs/event-emitter';
import { PLAYER_REPORTED_EVENT, PlayerReportedPayload } from '../../domain/events/player-reported.event';
import { playerReportEmailTemplate } from '../../mailer/templates/player-report-email.template';

@Injectable()
export class SendPlayerReportEmailHandler {
  constructor(
    private readonly config: ConfigService,
    @Inject(MAILER) private readonly mailer: MailerPort,
  ) {}

  @OnEvent(PLAYER_REPORTED_EVENT)
  async handle(payload: PlayerReportedPayload): Promise<void> {
    const recipient = this.config.get<string>('PLAYER_REPORTS_EMAIL') ?? 'contact@neeft.fr';
    const tpl = playerReportEmailTemplate({
      reportId: payload.reportId,
      reporterSlug: payload.reporterSlug,
      targetSlug: payload.targetSlug,
      reason: payload.reason,
      details: payload.details,
      createdAt: payload.createdAt,
    });

    await this.mailer.send({
      to: recipient,
      subject: tpl.subject,
      text: tpl.text,
      html: tpl.html,
    });
  }
}

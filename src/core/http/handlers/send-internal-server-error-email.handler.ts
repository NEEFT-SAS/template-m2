import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OnEvent } from '@nestjs/event-emitter';
import { MAILER, MailerPort } from '@/core/mailer/mailer.port';
import { INTERNAL_SERVER_ERROR_EVENT, InternalServerErrorEventPayload } from '../events/internal-server-error.event';
import { internalServerErrorReportEmailTemplate } from '../templates/internal-server-error-report-email.template';
import { writeFile, writeSync } from 'fs';

@Injectable()
export class SendInternalServerErrorEmailHandler {
  private readonly logger = new Logger(SendInternalServerErrorEmailHandler.name);

  constructor(
    private readonly config: ConfigService,
    @Inject(MAILER) private readonly mailer: MailerPort
  ) {}

  @OnEvent(INTERNAL_SERVER_ERROR_EVENT)
  async handle(payload: InternalServerErrorEventPayload): Promise<void> {
    const recipient = this.config.get<string>('INTERNAL_EXCEPTION_REPORT_EMAIL')?.trim();

    if (!recipient) {
      this.logger.warn('INTERNAL_EXCEPTION_REPORT_EMAIL is not configured. Skipping internal error report email.');
      return;
    }

    const template = internalServerErrorReportEmailTemplate({ payload });
    await this.mailer.send({
      to: recipient,
      subject: template.subject,
      text: template.text,
      html: template.html
    });
  }
}

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { MailerPort, SendMailInput } from './mailer.port';

const toBool = (value: unknown, fallback = false) => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') return value.toLowerCase() === 'true';
  return fallback;
};

const toInt = (value: unknown, fallback: number) => {
  if (typeof value === 'number') return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const n = Number.parseInt(value, 10);
    return Number.isNaN(n) ? fallback : n;
  }
  return fallback;
};

@Injectable()
export class NodemailerService implements MailerPort {
  private readonly logger = new Logger(NodemailerService.name);

  private readonly enabled: boolean;
  private readonly from: string;
  private readonly transporter: nodemailer.Transporter | null;

  constructor(private readonly config: ConfigService) {
    this.enabled = toBool(this.config.get('MAILER_ENABLED'), true);
    this.from = this.config.get<string>('MAIL_FROM') ?? 'no-reply@neeft.fr';

    if (!this.enabled) {
      this.transporter = null;
      this.logger.warn('Mailer disabled (MAILER_ENABLED=false)');
      return;
    }

    const host = this.config.get<string>('MAIL_HOST') ?? '';
    const port = toInt(this.config.get('MAIL_PORT'), 587);
    const user = this.config.get<string>('MAIL_USER') ?? '';
    const pass = this.config.get<string>('MAIL_PASS') ?? '';

    const secure = toBool(this.config.get('MAIL_SECURE'), false);
    const requireTLS = toBool(this.config.get('MAIL_REQUIRE_TLS'), false);

    const tlsServername = this.config.get<string>('MAIL_TLS_SERVERNAME') ?? undefined;
    const rejectUnauthorized = toBool(this.config.get('MAIL_TLS_REJECT_UNAUTHORIZED'), true);

    if (!host || !user || !pass) {
      this.transporter = null;
      this.logger.error('Mailer missing env: MAIL_HOST / MAIL_USER / MAIL_PASS');
      return;
    }

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      requireTLS,
      auth: { user, pass },
      tls: {
        servername: tlsServername,
        rejectUnauthorized,
      },
    });

    this.transporter
      .verify()
      .then(() => this.logger.log('Mailer ready'))
      .catch((err) => this.logger.error(`Mailer verify failed: ${err?.message ?? err}`));
  }

  async send(input: SendMailInput): Promise<void> {
    if (!this.enabled) return;

    if (!this.transporter) {
      this.logger.error('Mailer transporter not ready');
      return;
    }

    await this.transporter.sendMail({
      from: this.from,
      to: input.to,
      subject: input.subject,
      text: input.text,
      html: input.html,
    });
  }
}

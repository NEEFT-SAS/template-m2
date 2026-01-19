import { MAILER, MailerPort } from '@/core/mailer/mailer.port';
import { Inject, Injectable } from '@nestjs/common';
import { AuthMailerPort, SendUserRegisteredEmailInput } from '../app/ports/auth-mailer.port';
import { registeredUserEmailTemplate } from './templates/registered-user-email.template';


@Injectable()
export class AuthMailerCoreAdapter implements AuthMailerPort {
  constructor(
    @Inject(MAILER)
    private readonly mailer: MailerPort,
  ) {}

  async sendUserRegisteredEmail(input: SendUserRegisteredEmailInput): Promise<void> {
    const tpl = registeredUserEmailTemplate({ username: input.username });

    await this.mailer.send({
      to: input.to,
      subject: tpl.subject,
      text: tpl.text,
      html: tpl.html,
    });
  }
}

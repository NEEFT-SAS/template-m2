import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OnEvent } from '@nestjs/event-emitter';
import { AUTH_MAILER, AuthMailerPort } from '../ports/auth-mailer.port';
import { AUTH_USER_REGISTERED_EVENT, UserRegisteredPayload } from '../../domain/events/user-registered.event.';

@Injectable()
export class SendUserRegisteredEmailHandler {
  constructor(
    private readonly config: ConfigService,

    @Inject(AUTH_MAILER) private readonly authMailer: AuthMailerPort,
  ) {}

  @OnEvent(AUTH_USER_REGISTERED_EVENT)
  async handle(payload: UserRegisteredPayload): Promise<void> {
    const appWebUrl = this.config.get<string>('APP_WEB_URL') ?? 'http://localhost:3000';

    const verifyUrl = `${appWebUrl}/auth/verify-email?token=${encodeURIComponent(payload.verifyToken)}`;

    await this.authMailer.sendUserRegisteredEmail({
      to: payload.email,
      username: payload.username,
    });
  }
}

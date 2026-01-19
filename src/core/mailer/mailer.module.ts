import { Global, Module } from '@nestjs/common';
import { MAILER } from './mailer.port';
import { NodemailerService } from './mailer.service';

@Global()
@Module({
  providers: [{ provide: MAILER, useClass: NodemailerService }],
  exports: [MAILER],
})
export class MailerModule {}

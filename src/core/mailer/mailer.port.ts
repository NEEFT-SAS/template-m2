export const MAILER = Symbol('MAILER');

export type SendMailInput = {
  to: string;
  subject: string;
  text?: string;
  html?: string;
};

export interface MailerPort {
  send(input: SendMailInput): Promise<void>;
}

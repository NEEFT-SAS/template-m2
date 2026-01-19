export const AUTH_MAILER = Symbol('AUTH_MAILER');

export type SendUserRegisteredEmailInput = {
  to: string;
  username: string;
};

export interface AuthMailerPort {
  sendUserRegisteredEmail(input: SendUserRegisteredEmailInput): Promise<void>;
}

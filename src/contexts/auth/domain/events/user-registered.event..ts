export const AUTH_USER_REGISTERED_EVENT = 'auth.user.registered';

export type UserRegisteredPayload = {
  userCredentialId: string;
  email: string;
  username: string;
  verifyToken: string;
};

export class UserRegisteredEvent {
  static eventName = AUTH_USER_REGISTERED_EVENT;

  static create(payload: UserRegisteredPayload) {
    return {
      name: UserRegisteredEvent.eventName,
      payload,
    };
  }
}

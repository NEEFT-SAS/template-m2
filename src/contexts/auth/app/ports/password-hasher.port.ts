export const PASSWORD_HASHER = Symbol('PASSWORD_HASHER');

export interface PasswordHasherPort {
  hash(raw: string): Promise<string>;
  compare(raw: string, hash: string): Promise<boolean>;
}

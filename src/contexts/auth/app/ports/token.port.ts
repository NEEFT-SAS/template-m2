export const TOKEN_SERVICE = Symbol('TOKEN_SERVICE');

export type AccessTokenPayload = {
  sub: string; // user credential id
  pid: string; // user profile id
  email: string;
  username: string;
  slug: string;
};

export type RefreshTokenPayload = {
  sub: string;
};

export interface TokenPort {
  createAccessToken(payload: AccessTokenPayload): Promise<string>;
  createRefreshToken(payload: RefreshTokenPayload): Promise<string>;

  verifyAccessToken(token: string): Promise<AccessTokenPayload>;
  verifyRefreshToken(token: string): Promise<RefreshTokenPayload>;
}

/***************************
 *
 * Guard: optional auth
 *
 ***************************/

import { CanActivate, ExecutionContext, Injectable, UnauthorizedException, Inject } from '@nestjs/common';
import { TOKEN_SERVICE, TokenPort } from '../../app/ports/token.port';
import { extractBearerToken } from './auth-token.utils';
import { JwtInvalidError } from '../../domain/errors/jwt.errors';

@Injectable()
export class OptionalAuthGuard implements CanActivate {
  constructor(
    @Inject(TOKEN_SERVICE)
    private readonly tokens: TokenPort,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();

    const token = extractBearerToken(req);
    if (!token) return true;

    try {
      const payload = await this.tokens.verifyAccessToken(token);
      req.user = payload;
      return true;
    } catch {
      throw new JwtInvalidError();
    }
  }
}

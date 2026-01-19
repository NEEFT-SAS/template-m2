import { AccessTokenPayload, RefreshTokenPayload, TokenPort } from '@/contexts/auth/app/ports/token.port';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { StringValue } from 'ms';

@Injectable()
export class JwtTokenService implements TokenPort {
  private readonly accessSecret: string;
  private readonly accessExpiresIn: StringValue;

  private readonly refreshSecret: string;
  private readonly refreshExpiresIn: StringValue;

  constructor(private readonly jwt: JwtService, private readonly config: ConfigService) {
    this.accessSecret = this.config.get<string>('JWT_ACCESS_SECRET') ?? '';
    this.accessExpiresIn = (this.config.get<string>('JWT_ACCESS_EXPIRES_IN') ?? '15m') as StringValue;

    this.refreshSecret = this.config.get<string>('JWT_REFRESH_SECRET') ?? '';
    this.refreshExpiresIn = (this.config.get<string>('JWT_REFRESH_EXPIRES_IN') ?? '30d') as StringValue;
  }

  async createAccessToken(payload: AccessTokenPayload): Promise<string> {
    return this.jwt.signAsync(payload, { secret: this.accessSecret, expiresIn: this.accessExpiresIn });
  }

  async createRefreshToken(payload: RefreshTokenPayload): Promise<string> {
    return this.jwt.signAsync(payload, { secret: this.refreshSecret, expiresIn: this.refreshExpiresIn });
  }

  async verifyAccessToken(token: string): Promise<AccessTokenPayload> {
    return this.jwt.verifyAsync<AccessTokenPayload>(token, { secret: this.accessSecret });
  }

  async verifyRefreshToken(token: string): Promise<RefreshTokenPayload> {
    return this.jwt.verifyAsync<RefreshTokenPayload>(token, { secret: this.refreshSecret });
  }
}

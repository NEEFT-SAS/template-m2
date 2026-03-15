import { Inject, Injectable } from '@nestjs/common';
import {
  AUTH_REPOSITORY,
  AuthRepositoryPort,
} from '../ports/auth.repository.port';
import {
  PASSWORD_HASHER,
  PasswordHasherPort,
} from '../ports/password-hasher.port';
import { TOKEN_SERVICE, TokenPort } from '../ports/token.port';
import { UserJwtTokensPresenter, UserLoginDto } from '@neeft-sas/shared';
import { AuthInvalidCredentialsError } from '../../domain/errors/auth.errors';
import { EVENT_BUS, EventBusPort } from '@/core/events/event-bus.port';
import { PlayerSearchSyncEvent } from '@/contexts/players/domain/events/player-search-sync.event';

@Injectable()
export class UserLoginUsecase {
  @Inject(AUTH_REPOSITORY) private readonly authRepo: AuthRepositoryPort;
  @Inject(PASSWORD_HASHER) private readonly hasher: PasswordHasherPort;
  @Inject(TOKEN_SERVICE) private readonly tokens: TokenPort;
  @Inject(EVENT_BUS) private readonly eventBus: EventBusPort;

  async execute(dto: UserLoginDto): Promise<UserJwtTokensPresenter> {
    const credentials = await this.authRepo.findCredentialsByEmail(dto.email);
    if (!credentials) {
      throw new AuthInvalidCredentialsError();
    }

    const isPasswordValid = await this.hasher.compare(
      dto.password,
      credentials.passwordHash,
    );
    if (!isPasswordValid) {
      throw new AuthInvalidCredentialsError();
    }

    const profile = await this.authRepo.findProfileByCredentialId(
      credentials.id,
    );
    if (!profile) {
      throw new AuthInvalidCredentialsError();
    }

    const access_token = await this.tokens.createAccessToken({
      sub: credentials.id,
      pid: profile.id,
      email: credentials.email,
      username: profile.username,
      slug: profile.slug,
    });
    const refresh_token = await this.tokens.createRefreshToken({
      sub: credentials.id,
    });

    await this.authRepo.updateCredentialsLastLoginAt(
      credentials.id,
      new Date(),
    );
    await this.eventBus.publish(
      PlayerSearchSyncEvent.create({ slug: profile.slug }),
    );

    return { access_token, refresh_token };
  }
}

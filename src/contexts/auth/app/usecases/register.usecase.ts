import { UserAccountAccessStatus, UserRegisterDto } from "@neeft-sas/shared";
import { Inject, Injectable } from "@nestjs/common";
import { AuthEmailAlreadyUsedError, AuthReferralCodeNotFoundError, AuthUsernameAlreadyUsedError, AuthUserTooYoungError } from "../../domain/errors/auth.errors";
import { getAgeParts, slugifyUnique, UserRegisteredPresenter } from "@neeft-sas/shared";
import { AUTH_REPOSITORY, AuthRepositoryPort } from "../ports/auth.repository.port";
import { PASSWORD_HASHER, PasswordHasherPort } from "../ports/password-hasher.port";
import { TOKEN_SERVICE, TokenPort } from "../ports/token.port";
import { EVENT_BUS, EventBusPort } from "@/core/events/event-bus.port";
import { UserRegisteredEvent } from "../../domain/events/user-registered.event.";

/***************************
 *
 * RULES:
 *
 * User must be at least 13 years old to register
 * 
 ***************************/
const MINIMUM_AGE = 13;

@Injectable()
export class UserRegisterUsecase {

  @Inject(AUTH_REPOSITORY) private readonly authRepo: AuthRepositoryPort;
  @Inject(PASSWORD_HASHER) private readonly hasher: PasswordHasherPort;
  @Inject(EVENT_BUS) private readonly eventBus: EventBusPort;

  async execute(dto: UserRegisterDto): Promise<UserRegisteredPresenter> {
    const userAge = getAgeParts(dto.birthdate);
    
    if (userAge.years < MINIMUM_AGE) {
      throw new AuthUserTooYoungError({ currentAge: userAge.years });
    }

    const emailTaken = await this.authRepo.existsCredentialsByEmail(dto.email);
    if (emailTaken) throw new AuthEmailAlreadyUsedError({ email: dto.email });

    const usernameTaken = await this.authRepo.existsProfileByUsername(dto.username);
    if (usernameTaken) throw new AuthUsernameAlreadyUsedError({ username: dto.username });

    let referredByUserId: string | null = null;
    if (dto.referralCode) {
      const referredByProfile = await this.authRepo.findProfileByReferralCode(dto.referralCode);
      if (!referredByProfile) throw new AuthReferralCodeNotFoundError({ referralCode: dto.referralCode });
      referredByUserId = referredByProfile.id;
    }

    const slug = await slugifyUnique(dto.username,
      async (candidate) => this.authRepo.existsProfileBySlug(candidate),
      { allowBaseSlug: false, suffixDigits: 4, maxRetries: 15 },
    );
    
    const passwordHash = await this.hasher.hash(dto.password);

    const { credentials, profile } = await this.authRepo.createCredentialsAndProfile({
      credentials: {
        email: dto.email,
        passwordHash,
        status: UserAccountAccessStatus.ACTIVE,
      },
      profile: {
        username: dto.username,
        firstname: dto.firstname,
        lastname: dto.lastname,
        slug,
        birthDate: dto.birthdate,
        referralCode: this.generateReferralCode(slug),
      },
      referredByUserId,
    });

    await this.eventBus.publish(UserRegisteredEvent.create({
      userCredentialId: credentials.id,
      email: credentials.email,
      username: profile.username,
      verifyToken: 'credentials.verifyToken',
    }))

    return {
      credentialsId: credentials.id,
      profileId: profile.id,
      email: dto.email,
      username: dto.username,
      slug
    }
  }

  private generateReferralCode(slug: string): string {
    // use generated slug as referral code
    return slug;
  }
}

import { UserCredentialsEntity } from '../../infra/persistence/entities/user-credentials.entity';
import { UserProfileEntity } from '../../infra/persistence/entities/user-profile.entity';
import { CreateCredentialsInput, CreateProfileInput } from '../types/auth.repository.types';

export const AUTH_REPOSITORY = Symbol('AUTH_REPOSITORY');

export interface AuthRepositoryPort {
  existsCredentialsByEmail(email: string): Promise<boolean>;
  findCredentialsByEmail(email: string): Promise<UserCredentialsEntity | null>;

  existsProfileByUsername(username: string): Promise<boolean>;
  existsProfileBySlug(slug: string): Promise<boolean>;

  findProfileByReferralCode(referralCode: string): Promise<UserProfileEntity | null>;
  findProfileByCredentialId(userCredentialId: string): Promise<UserProfileEntity | null>;
  
  updateCredentialsLastLoginAt(userCredentialId: string, date: Date): Promise<void>;

  createCredentialsAndProfile(input: {
    credentials: CreateCredentialsInput;
    profile: Omit<CreateProfileInput, 'userCredentialId' | 'referredByUserId'>;
    referredByUserId: string | null;
  }): Promise<{ credentials: UserCredentialsEntity; profile: UserProfileEntity }>;
}

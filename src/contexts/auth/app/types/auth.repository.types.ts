import { UserAccountAccessStatus } from '@neeft-sas/shared';
import { UserProfileGenderEnum } from '../../domain/types/user-profile-gender.enum';

export type CreateCredentialsInput = {
  email: string;
  passwordHash: string;
  status?: UserAccountAccessStatus;
};

export type CreateProfileInput = {
  userCredentialId: string;
  username: string;
  firstname: string;
  lastname: string;
  gender: UserProfileGenderEnum;
  slug: string;
  birthDate: Date;
  referralCode: string;
  // referredByUserId: string | null;
};

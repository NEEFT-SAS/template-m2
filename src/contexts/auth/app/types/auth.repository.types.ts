import { UserAccountAccessStatus } from '@neeft-sas/shared';

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
  slug: string;
  birthDate: Date;
  referralCode: string;
  // referredByUserId: string | null;
};

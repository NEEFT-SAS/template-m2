import { getAgeParts } from '@neeft-sas/shared';
import { Expose, Transform, Type } from 'class-transformer';
import { UserProfileGenderEnum } from '@/contexts/auth/domain/types/user-profile-gender.enum';

export class PlayerProfileCountryResponse {
  @Expose()
  id!: string;

  @Expose()
  code!: string;

  @Expose()
  code3!: string;

  @Expose()
  name!: string;

  @Expose()
  i18nName!: string;

  @Expose()
  flagIcon!: string | null;
}

export class PlayerProfileLanguageResponse {
  @Expose()
  id!: string;

  @Expose()
  code!: string;

  @Expose()
  locale!: string | null;

  @Expose()
  label!: string;

  @Expose()
  @Transform(({ obj }) => obj?.i18nLabel ?? obj?.i18nName ?? null)
  i18nLabel!: string | null;

  @Expose()
  direction!: string;

  @Expose()
  flagIcon!: string | null;
}

export class PlayerProfileResponse {
  @Expose()
  id!: string;

  @Expose()
  username!: string;

  @Expose()
  slug!: string;

  @Expose()
  @Transform(({ obj }) => getAgeParts(obj.birthDate, new Date()).years)
  age!: number;

  @Expose()
  description!: string | null;

  @Expose()
  citation!: string | null;

  @Expose()
  profilePicture!: string | null;

  @Expose()
  bannerPicture!: string | null;

  @Expose()
  @Type(() => PlayerProfileCountryResponse)
  nationality!: PlayerProfileCountryResponse | null;

  @Expose()
  @Type(() => PlayerProfileLanguageResponse)
  languages!: PlayerProfileLanguageResponse[];

  @Expose()
  referralCode!: string;

  @Expose()
  gender!: UserProfileGenderEnum;

  @Expose()
  phone!: string | null;

  @Expose()
  workSector!: string | null;

  @Expose()
  contractType!: string | null;

  @Expose()
  isDisabledPlayer!: boolean | null;

  @Expose()
  completenessScore!: number;

  @Expose()
  trustScore!: number;

  @Expose()
  profileScore!: number;
}

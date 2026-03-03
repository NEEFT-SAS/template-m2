import { RscCountryPresenter, RscLanguagePresenter, getAgeParts } from '@neeft-sas/shared';
import { Expose, Transform, Type } from 'class-transformer';
import { UserProfileGenderEnum } from '@/contexts/auth/domain/types/user-profile-gender.enum';

export class PlayerPrivateProfileResponse {
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
  @Type(() => RscCountryPresenter)
  nationality!: RscCountryPresenter | null;

  @Expose()
  @Type(() => RscLanguagePresenter)
  languages!: RscLanguagePresenter[];

  @Expose()
  referralCode!: string;

  @Expose()
  email!: string;

  @Expose()
  birthDate!: Date;

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
}

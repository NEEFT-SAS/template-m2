import { UserRegisterDto } from '@neeft-sas/shared';
import { IsEnum } from 'class-validator';
import { UserProfileGenderEnum } from '../../domain/types/user-profile-gender.enum';

export class UserRegisterRequestDto extends UserRegisterDto {
  @IsEnum(UserProfileGenderEnum)
  gender!: UserProfileGenderEnum;
}

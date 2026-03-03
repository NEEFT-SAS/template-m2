import { UpdatePlayerProfileDTO } from '@neeft-sas/shared';
import { Transform } from 'class-transformer';
import { IsBoolean, IsEnum, IsOptional, IsString, MaxLength, ValidateIf } from 'class-validator';
import { UserProfileGenderEnum } from '@/contexts/auth/domain/types/user-profile-gender.enum';

const trimString = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

export class UpdatePlayerProfileRequestDto extends UpdatePlayerProfileDTO {
  @IsOptional()
  @IsString()
  @MaxLength(32)
  @Transform(trimString)
  phone?: string | null;

  @ValidateIf((_obj, value) => value !== undefined)
  @IsEnum(UserProfileGenderEnum)
  gender?: UserProfileGenderEnum;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  @Transform(trimString)
  workSector?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  @Transform(trimString)
  contractType?: string | null;

  @IsOptional()
  @IsBoolean()
  isDisabledPlayer?: boolean | null;
}

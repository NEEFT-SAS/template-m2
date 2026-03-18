import { Transform } from 'class-transformer';
import { IsNotEmpty, IsObject, IsOptional, IsString, MaxLength } from 'class-validator';

const trimString = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class CreatePlayerStaffRoleDTO {
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  @Transform(trimString)
  roleId!: string;

  @IsOptional()
  @IsObject()
  payload?: Record<string, unknown> | null;
}

export class UpdatePlayerStaffRoleDTO {
  @IsOptional()
  @IsObject()
  payload?: Record<string, unknown> | null;
}

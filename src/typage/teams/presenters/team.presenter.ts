import { Expose, Type } from 'class-transformer';
import { IsArray, IsBoolean, IsDate, IsInt, IsOptional, IsString, IsUUID, ValidateNested } from 'class-validator';

export class TeamOwnerPresenter {
  @Expose()
  @IsUUID()
  id!: string;

  @Expose()
  @IsString()
  username!: string;

  @Expose()
  @IsString()
  slug!: string;

  @Expose()
  @IsOptional()
  @IsString()
  profilePicture!: string | null;
}

export class TeamPresenter {
  @Expose()
  @IsUUID()
  id!: string;

  @Expose()
  @IsString()
  name!: string;

  @Expose()
  @IsString()
  acronym!: string;

  @Expose()
  @IsString()
  slug!: string;

  @Expose()
  @IsOptional()
  @IsString()
  description!: string | null;

  @Expose()
  @IsOptional()
  @IsString()
  quote!: string | null;

  @Expose()
  @IsOptional()
  @IsString()
  bannerPicture!: string | null;

  @Expose()
  @IsOptional()
  @IsString()
  logoPicture!: string | null;

  @Expose()
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  foundedAt!: Date | null;

  @Expose()
  @IsOptional()
  @IsString()
  city!: string | null;

  @Expose()
  @IsBoolean()
  affiliated!: boolean;

  @Expose()
  @IsBoolean()
  isVerified!: boolean;

  @Expose()
  @IsInt()
  completenessScore!: number;

  @Expose()
  @IsInt()
  trustScore!: number;

  @Expose()
  country!: Record<string, unknown> | null;

  @Expose()
  @IsArray()
  languages!: Record<string, unknown>[];

  @Expose()
  @ValidateNested()
  @Type(() => TeamOwnerPresenter)
  owner!: TeamOwnerPresenter;
}

export class TeamPrivateProfilePresenter extends TeamPresenter {
  @Expose()
  @IsOptional()
  @IsInt()
  permissions!: number | null;
}

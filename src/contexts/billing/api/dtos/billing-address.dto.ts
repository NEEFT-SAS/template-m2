import { Transform } from 'class-transformer';
import { IsOptional, IsString } from 'class-validator';

export class BillingAddressDto {
  @IsOptional()
  @Transform(({ value }) => value ?? undefined)
  @IsString()
  line1?: string;

  @IsOptional()
  @Transform(({ value }) => value ?? undefined)
  @IsString()
  line2?: string;

  @IsOptional()
  @Transform(({ value }) => value ?? undefined)
  @IsString()
  postalCode?: string;

  @IsOptional()
  @Transform(({ value }) => value ?? undefined)
  @IsString()
  city?: string;

  @IsOptional()
  @Transform(({ value }) => value ?? undefined)
  @IsString()
  state?: string;

  @IsOptional()
  @Transform(({ value }) => value ?? undefined)
  @IsString()
  country?: string;
}

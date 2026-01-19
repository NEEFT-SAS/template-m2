
/**********************
# Validation runtime du .env (class-validator + class-transformer)
**********************/

import { plainToInstance, Transform } from 'class-transformer';
import { IsBoolean, IsEnum, IsInt, IsNumber, IsString, Min, validateSync } from 'class-validator';
import { toInt, toBool } from '@neeft-sas/shared'

export class EnvVariables {

  @IsEnum(['development', 'test', 'production'])
  NODE_ENV!: 'development' | 'test' | 'production';

  @IsNumber()
  @Transform(({ value }) => toInt(value, 4000))
  PORT!: number;

  // DATABASE
  @IsString()
  DB_HOST!: string;

  @Transform(({ value }) => toInt(value, 3306))
  @IsInt()
  @Min(1)
  DB_PORT!: number;

  @IsString()
  DB_USERNAME!: string;

  @IsString()
  DB_PASSWORD!: string;

  @IsString()
  DB_DATABASE!: string;

  @Transform(({ value }) => toBool(value))
  @IsBoolean()
  DB_SSL!: boolean;

  @Transform(({ value }) => toBool(value))
  @IsBoolean()
  DB_SYNCHRONIZE!: boolean;

  @Transform(({ value }) => toBool(value))
  @IsBoolean()
  DB_LOGGING!: boolean;

  @IsString()
  GITHUB_TOKEN!: string;
}

export type Env = EnvVariables;

export function validateEnv(config: Record<string, unknown>): Env {
  const env = plainToInstance(EnvVariables, config, {
    enableImplicitConversion: true,
    exposeDefaultValues: true,
  });

  const errors = validateSync(env, {
    whitelist: true,
    forbidNonWhitelisted: false,
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    const formatted = errors.map((e) => ({
      key: e.property,
      constraints: e.constraints ?? {},
    }));

    // eslint-disable-next-line no-console
    console.error('Invalid environment variables:', formatted);

    throw new Error('Invalid environment variables');
  }

  return env;
}

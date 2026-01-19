/***************************
 *
 * Build TypeORM options from validated env
 *
 ***************************/

import { toBool } from '@neeft-sas/shared';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { join } from 'path';

export function buildTypeOrmOptions(config: ConfigService): TypeOrmModuleOptions {
  const isProd = config.get<string>('NODE_ENV') === 'production';

  const dbSsl = config.get<boolean>('DB_SSL') ?? false;

  return {
    type: 'mysql',
    host: config.get<string>('DB_HOST'),
    port: config.get<number>('DB_PORT'),
    username: config.get<string>('DB_USERNAME'),
    password: config.get<string>('DB_PASSWORD'),
    database: config.get<string>('DB_DATABASE'),

    synchronize: config.get<boolean>('DB_SYNCHRONIZE') ?? false,
    logging: config.get<boolean>('DB_LOGGING') ?? false,

    autoLoadEntities: true,

    charset: 'utf8mb4',
    timezone: 'Z',

    // ssl: toBool(dbSsl) ? { rejectUnauthorized: false } : undefined,

    migrations: [
      join(process.cwd(), 'dist/core/database/migrations/*.js'),
      join(process.cwd(), 'src/core/database/migrations/*.ts'),
    ],
  };
}

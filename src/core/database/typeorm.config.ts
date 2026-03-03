/***************************
 *
 * Build TypeORM options from validated env
 *
 ***************************/

import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export function buildTypeOrmOptions(config: ConfigService): TypeOrmModuleOptions {
  return {
    type: 'mysql',
    host: config.get<string>('DB_HOST'),
    port: config.get<number>('DB_PORT'),
    username: config.get<string>('DB_USERNAME'),
    password: config.get<string>('DB_PASSWORD'),
    database: config.get<string>('DB_DATABASE'),

    synchronize: config.get<boolean>('DB_SYNCHRONIZE') ?? false,
    // Keep query text/parameters out of logs; enable only warn/error when DB_LOGGING=true.
    logging: (config.get<boolean>('DB_LOGGING') ?? false) ? ['warn', 'error'] : false,

    autoLoadEntities: true,

    charset: 'utf8mb4',
    timezone: 'Z',

    // Migrations are handled by the TypeORM CLI DataSource, not by the app runtime.
  };
}

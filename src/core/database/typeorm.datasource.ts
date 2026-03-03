/***************************
 *
 * TypeORM DataSource (CLI migrations)
 *
 ***************************/

import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { config as dotenvConfig } from 'dotenv';
import { resolve } from 'path';
import { toBool } from '@neeft-sas/shared';

dotenvConfig({ path: resolve(process.cwd(), '.env') });

export const AppDataSource = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT ?? 3306),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD ?? '',
  database: process.env.DB_DATABASE,

  synchronize: process.env.DB_SYNCHRONIZE === 'true',
  // Keep query text/parameters out of logs; enable only warn/error when DB_LOGGING=true.
  logging: process.env.DB_LOGGING === 'true' ? ['warn', 'error'] : false,

  // charset: 'utf8mb4',
  // timezone: 'Z',

  // ...(toBool(process.env.DB_SSL) ? { ssl: { rejectUnauthorized: false } } : {}),

  entities: ['dist/**/*.orm-entity.js', 'dist/**/*.entity.js'],
  migrations: ['dist/core/database/migrations/*.js'],
});

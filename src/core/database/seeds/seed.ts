import 'reflect-metadata';
import { config as dotenvConfig } from 'dotenv';
import { resolve } from 'path';
import { DataSource } from 'typeorm';
import { seeders } from './seed.module';

dotenvConfig({ path: resolve(process.cwd(), '.env') });

const isTsRuntime = __filename.endsWith('.ts');
const baseDir = isTsRuntime ? 'src' : 'dist';
const ext = isTsRuntime ? 'ts' : 'js';

const dataSource = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT ?? 3306),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD ?? '',
  database: process.env.DB_DATABASE,
  synchronize: process.env.DB_SYNCHRONIZE === 'true',
  // Keep query text/parameters out of logs; enable only warn/error when DB_LOGGING=true.
  logging: process.env.DB_LOGGING === 'true' ? ['warn', 'error'] : false,
  entities: [
    resolve(process.cwd(), `${baseDir}/**/*.entity.${ext}`),
    resolve(process.cwd(), `${baseDir}/**/*.orm-entity.${ext}`),
  ],
});

async function run(): Promise<void> {
  const startedAt = Date.now();
  await dataSource.initialize();

  for (const seeder of seeders) {
    console.log(`[seed] ${seeder.name}`);
    await seeder.run(dataSource);
  }

  await dataSource.destroy();
  console.log(`[seed] done in ${Date.now() - startedAt}ms`);
}

run().catch(async (error) => {
  if (dataSource.isInitialized) {
    await dataSource.destroy();
  }

  console.error('[seed] failed', error);
  process.exit(1);
});

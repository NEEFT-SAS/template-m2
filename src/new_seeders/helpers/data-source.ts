import 'reflect-metadata';
import { config as dotenvConfig } from 'dotenv';
import { resolve } from 'path';
import { DataSource } from 'typeorm';

dotenvConfig({ path: resolve(process.cwd(), '.env') });

export function createSeederDataSource(): DataSource {
  const isTsRuntime = __filename.endsWith('.ts');
  const baseDir = isTsRuntime ? 'src' : 'dist';
  const ext = isTsRuntime ? 'ts' : 'js';

  return new DataSource({
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
}

export async function withSeederDataSource<T>(
  run: (dataSource: DataSource) => Promise<T>,
): Promise<T> {
  const dataSource = createSeederDataSource();
  await dataSource.initialize();

  try {
    return await run(dataSource);
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  }
}

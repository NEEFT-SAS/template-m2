import { readFile } from 'fs/promises';
import { join } from 'path';
import { DataSource, EntityTarget, QueryDeepPartialEntity } from 'typeorm';

const DEFAULT_SEED_DATA_DIR = join(process.cwd(), 'src', 'core', 'database', 'seeds', 'data');

export async function loadSeedData<T>(relativePath: string): Promise<T[]> {
  const baseDir = process.env.SEED_DATA_DIR ?? DEFAULT_SEED_DATA_DIR;
  const filePath = join(baseDir, relativePath);
  const raw = await readFile(filePath, 'utf8');
  const parsed = JSON.parse(raw);

  if (!Array.isArray(parsed)) {
    throw new Error(`Seed data must be an array: ${filePath}`);
  }

  return parsed as T[];
}

export async function upsertByColumns<T>(
  dataSource: DataSource,
  entity: EntityTarget<T>,
  rows: QueryDeepPartialEntity<T>[],
  conflictPaths: string[],
): Promise<void> {
  if (!rows.length) return;

  const repo = dataSource.getRepository(entity);
  const metadata = repo.metadata;
  const conflictColumns = conflictPaths.map((path) => {
    const column = metadata.findColumnWithPropertyName(path) ?? metadata.findColumnWithDatabaseName(path);
    if (!column) {
      throw new Error(`Unknown conflict column: ${path} for ${metadata.name}`);
    }
    return column.databaseName;
  });

  const overwriteColumns = metadata.columns
    .filter(
      (column) =>
        !column.isPrimary &&
        !column.isCreateDate &&
        !column.isUpdateDate &&
        !column.isDeleteDate &&
        !column.isVersion &&
        !conflictColumns.includes(column.databaseName),
    )
    .map((column) => column.databaseName);

  if (!overwriteColumns.length) {
    await repo.createQueryBuilder().insert().values(rows).orIgnore().execute();
    return;
  }

  await repo
    .createQueryBuilder()
    .insert()
    .values(rows)
    .orUpdate(overwriteColumns, conflictColumns)
    .updateEntity(false)
    .execute();
}

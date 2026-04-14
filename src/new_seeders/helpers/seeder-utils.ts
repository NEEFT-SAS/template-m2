import {
  DataSource,
  DeepPartial,
  FindOptionsWhere,
  ObjectLiteral,
  Repository,
} from 'typeorm';

export function parseBoolean(value?: string): boolean {
  if (!value) return false;

  const normalized = value.trim().toLowerCase();
  return ['1', 'true', 'yes', 'y', 'on'].includes(normalized);
}

export function parsePositiveInt(
  rawValue: string | undefined,
  fallback: number,
): number {
  const parsed = Number.parseInt(rawValue ?? '', 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }

  return parsed;
}

export async function tableExists(
  dataSource: DataSource,
  tableName: string,
): Promise<boolean> {
  const rows = await dataSource.query(
    'SELECT 1 FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = ? LIMIT 1',
    [tableName],
  );

  return rows.length > 0;
}

export async function seedIfNotExists<T extends ObjectLiteral>(
  repo: Repository<T>,
  findCondition: FindOptionsWhere<T>,
  data: DeepPartial<T>,
): Promise<void> {
  const exists = await repo.findOne({ where: findCondition });
  if (!exists) {
    await repo.save(repo.create(data));
  }
}

export function logSection(title: string): void {
  console.log(`\n[new_seeders] ${title.toUpperCase()}`);
}

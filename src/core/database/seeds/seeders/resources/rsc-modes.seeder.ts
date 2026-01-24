import { DataSource } from 'typeorm';
import { Seeder } from '../seed.types';
import { loadSeedData, upsertByColumns } from '../seed.utils';
import { RscModeEntity } from '@/contexts/resources/infra/persistence/entities/games/base/rsc-modes.entity';

type RscModeSeed = {
  name: string;
  slug: string;
  description?: string | null;
  isRanked?: boolean;
  order?: number;
};

export class RscModesSeeder implements Seeder {
  name = 'rsc-modes';

  async run(dataSource: DataSource): Promise<void> {
    const data = await loadSeedData<RscModeSeed>('resources/rsc-modes.json');
    if (data.length === 0) return;

    await upsertByColumns(dataSource, RscModeEntity, data, ['slug']);
  }
}

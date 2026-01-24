import { DataSource } from 'typeorm';
import { Seeder } from '../seed.types';
import { loadSeedData, upsertByColumns } from '../seed.utils';
import { RscSeasonEntity } from '@/contexts/resources/infra/persistence/entities/games/base/rsc-seasons.entity';

type RscSeasonSeed = {
  code: string;
  name: string;
  startDate?: string | null;
  endDate?: string | null;
};

export class RscSeasonsSeeder implements Seeder {
  name = 'rsc-seasons';

  async run(dataSource: DataSource): Promise<void> {
    const data = await loadSeedData<RscSeasonSeed>('resources/rsc-seasons.json');
    if (data.length === 0) return;

    const normalized = data.map((item) => ({
      ...item,
      startDate: item.startDate ? new Date(item.startDate) : null,
      endDate: item.endDate ? new Date(item.endDate) : null,
    }));

    await upsertByColumns(dataSource, RscSeasonEntity, normalized, ['code']);
  }
}

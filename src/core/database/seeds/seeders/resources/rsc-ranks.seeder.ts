import { DataSource } from 'typeorm';
import { Seeder } from '../seed.types';
import { loadSeedData, upsertByColumns } from '../seed.utils';
import { RscRankEntity } from '@/contexts/resources/infra/persistence/entities/games/base/rsc-ranks.entity';

type RscRankSeed = {
  name: string;
  slug: string;
  order?: number;
  division: string;
  tier?: string | null;
  icon?: string | null;
};

export class RscRanksSeeder implements Seeder {
  name = 'rsc-ranks';

  async run(dataSource: DataSource): Promise<void> {
    const data = await loadSeedData<RscRankSeed>('resources/rsc-ranks.json');
    if (data.length === 0) return;

    await upsertByColumns(dataSource, RscRankEntity, data, ['slug']);
  }
}

import { DataSource } from 'typeorm';
import { Seeder } from '../seed.types';
import { loadSeedData, upsertByColumns } from '../seed.utils';
import { RscPositionEntity } from '@/contexts/resources/infra/persistence/entities/games/base/rsc-positions.entity';

type RscPositionSeed = {
  name: string;
  slug: string;
  icon?: string | null;
  order?: number;
};

export class RscPositionsSeeder implements Seeder {
  name = 'rsc-positions';

  async run(dataSource: DataSource): Promise<void> {
    const data = await loadSeedData<RscPositionSeed>('resources/rsc-positions.json');
    if (data.length === 0) return;

    await upsertByColumns(dataSource, RscPositionEntity, data, ['slug']);
  }
}

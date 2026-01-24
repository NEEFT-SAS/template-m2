import { DataSource } from 'typeorm';
import { Seeder } from '../seed.types';
import { loadSeedData, upsertByColumns } from '../seed.utils';
import { RscPlatformEntity } from '@/contexts/resources/infra/persistence/entities/games/base/rsc-platforms.entity';

type RscPlatformSeed = {
  name: string;
  slug: string;
  icon?: string | null;
};

export class RscPlatformsSeeder implements Seeder {
  name = 'rsc-platforms';

  async run(dataSource: DataSource): Promise<void> {
    const data = await loadSeedData<RscPlatformSeed>('resources/rsc-platforms.json');
    if (data.length === 0) return;

    await upsertByColumns(dataSource, RscPlatformEntity, data, ['slug']);
  }
}

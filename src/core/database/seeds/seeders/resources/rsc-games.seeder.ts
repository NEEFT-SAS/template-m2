import { DataSource } from 'typeorm';
import { Seeder } from '../seed.types';
import { loadSeedData, upsertByColumns } from '../seed.utils';
import { RscGameEntity } from '@/contexts/resources/infra/persistence/entities/games/rsc-games.entity';

type RscGameSeed = {
  name: string;
  shortName?: string | null;
  slug: string;
  genre?: string | null;
  developer?: string | null;
  releaseDate?: string | null;
  edition?: string | null;
  officialLink?: string | null;
  apiLink?: string | null;
  icon?: string | null;
  banner?: string | null;
  description?: string | null;
};

export class RscGamesSeeder implements Seeder {
  name = 'rsc-games';

  async run(dataSource: DataSource): Promise<void> {
    const data = await loadSeedData<RscGameSeed>('resources/rsc-games.json');
    if (data.length === 0) return;

    const normalized = data.map((item) => ({
      ...item,
      releaseDate: item.releaseDate ? new Date(item.releaseDate) : null,
    }));

    await upsertByColumns(dataSource, RscGameEntity, normalized, ['slug']);
  }
}

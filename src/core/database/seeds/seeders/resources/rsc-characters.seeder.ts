import { DataSource } from 'typeorm';
import { Seeder } from '../seed.types';
import { loadSeedData, upsertByColumns } from '../seed.utils';
import { RscCharacterEntity } from '@/contexts/resources/infra/persistence/entities/games/base/rsc-characters.entity';

type RscCharacterSeed = {
  name: string;
  slug: string;
  icon?: string | null;
};

export class RscCharactersSeeder implements Seeder {
  name = 'rsc-characters';

  async run(dataSource: DataSource): Promise<void> {
    const data = await loadSeedData<RscCharacterSeed>('resources/rsc-characters.json');
    if (data.length === 0) return;

    await upsertByColumns(dataSource, RscCharacterEntity, data, ['slug']);
  }
}

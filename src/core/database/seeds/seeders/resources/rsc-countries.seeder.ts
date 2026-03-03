import { DataSource } from 'typeorm';
import { Seeder } from '../seed.types';
import { loadSeedData, upsertByColumns } from '../seed.utils';
import { RscCountryEntity } from '@/contexts/resources/infra/persistence/entities/rsc-countries.entity';

type RscCountrySeed = {
  code: string;
  code3: string;
  name: string;
  i18nName: string;
  flagIcon?: string | null;
  isActive?: boolean;
};

export class RscCountriesSeeder implements Seeder {
  name = 'rsc-countries';

  async run(dataSource: DataSource): Promise<void> {
    const data = await loadSeedData<RscCountrySeed>('resources/rsc-countries.json');
    if (data.length === 0) return;

    await upsertByColumns(dataSource, RscCountryEntity, data, ['code']);
  }
}

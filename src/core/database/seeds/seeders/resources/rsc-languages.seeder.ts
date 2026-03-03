import { DataSource } from 'typeorm';
import { Seeder } from '../seed.types';
import { loadSeedData, upsertByColumns } from '../seed.utils';
import { RscLanguageEntity } from '@/contexts/resources/infra/persistence/entities/rsc-languages.entity';

type RscLanguageSeed = {
  code: string;
  locale?: string | null;
  label: string;
  i18nName: string;
  direction?: 'ltr' | 'rtl';
  flagIcon?: string | null;
  isActive?: boolean;
};

export class RscLanguagesSeeder implements Seeder {
  name = 'rsc-languages';

  async run(dataSource: DataSource): Promise<void> {
    const data = await loadSeedData<RscLanguageSeed>('resources/rsc-languages.json');
    if (data.length === 0) return;

    await upsertByColumns(dataSource, RscLanguageEntity, data, ['code']);
  }
}

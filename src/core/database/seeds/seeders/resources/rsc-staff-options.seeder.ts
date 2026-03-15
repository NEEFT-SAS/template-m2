import { DataSource } from 'typeorm';
import { Seeder } from '../seed.types';
import { loadSeedData, upsertByColumns } from '../seed.utils';
import { RscStaffOptionEntity } from '@/contexts/resources/infra/persistence/entities/staff/rsc-staff-option.entity';

type RscStaffOptionSeed = {
  key: string;
  label: string;
  slug?: string | null;
  icon?: string | null;
  isActive?: boolean;
};

export class RscStaffOptionsSeeder implements Seeder {
  name = 'rsc-staff-options';

  async run(dataSource: DataSource): Promise<void> {
    const data = await loadSeedData<RscStaffOptionSeed>(
      'resources/rsc-staff-options.json',
    );
    if (data.length === 0) return;

    const normalized = data.map((item) => ({
      key: item.key,
      label: item.label,
      slug: item.slug ?? item.key,
      icon: item.icon ?? null,
      isActive: item.isActive ?? true,
    }));

    await upsertByColumns(dataSource, RscStaffOptionEntity, normalized, ['key']);
  }
}

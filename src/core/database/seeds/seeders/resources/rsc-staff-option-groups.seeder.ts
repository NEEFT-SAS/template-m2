import { DataSource } from 'typeorm';
import {
  RscStaffOptionGroupEntity,
  RscStaffOptionGroupSourceType,
} from '@/contexts/resources/infra/persistence/entities/staff/rsc-staff-option-group.entity';
import { Seeder } from '../seed.types';
import { loadSeedData, upsertByColumns } from '../seed.utils';

type RscStaffOptionGroupSeed = {
  key: string;
  label: string;
  sourceType: RscStaffOptionGroupSourceType;
  isActive?: boolean;
};

export class RscStaffOptionGroupsSeeder implements Seeder {
  name = 'rsc-staff-option-groups';

  async run(dataSource: DataSource): Promise<void> {
    const data = await loadSeedData<RscStaffOptionGroupSeed>(
      'resources/rsc-staff-option-groups.json',
    );
    if (data.length === 0) return;

    const normalized = data.map((item) => ({
      key: item.key,
      label: item.label,
      sourceType: item.sourceType,
      isActive: item.isActive ?? true,
    }));

    await upsertByColumns(
      dataSource,
      RscStaffOptionGroupEntity,
      normalized,
      ['key'],
    );
  }
}

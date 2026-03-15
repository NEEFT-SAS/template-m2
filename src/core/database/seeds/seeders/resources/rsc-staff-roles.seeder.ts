import { DataSource } from 'typeorm';
import { RscStaffRoleEntity } from '@/contexts/resources/infra/persistence/entities/staff/rsc-staff-role.entity';
import { Seeder } from '../seed.types';
import { loadSeedData, upsertByColumns } from '../seed.utils';

type RscStaffRoleSeed = {
  key: string;
  slug: string;
  label: string;
  icon?: string | null;
  isActive?: boolean;
};

export class RscStaffRolesSeeder implements Seeder {
  name = 'rsc-staff-roles';

  async run(dataSource: DataSource): Promise<void> {
    const data = await loadSeedData<RscStaffRoleSeed>(
      'resources/rsc-staff-roles.json',
    );
    if (data.length === 0) return;

    const normalized = data.map((item) => ({
      key: item.key,
      slug: item.slug,
      label: item.label,
      icon: item.icon ?? null,
      isActive: item.isActive ?? true,
    }));

    await upsertByColumns(dataSource, RscStaffRoleEntity, normalized, ['key']);
  }
}

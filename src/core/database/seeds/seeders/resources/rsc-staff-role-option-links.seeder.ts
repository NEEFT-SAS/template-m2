import { DataSource } from 'typeorm';
import { Seeder } from '../seed.types';
import { loadSeedData } from '../seed.utils';
import { RscStaffRoleOptionLinkEntity } from '@/contexts/resources/infra/persistence/entities/staff/rsc-staff-role-option-link.entity';
import { RscStaffRoleEntity } from '@/contexts/resources/infra/persistence/entities/staff/rsc-staff-role.entity';
import { RscStaffOptionGroupEntity } from '@/contexts/resources/infra/persistence/entities/staff/rsc-staff-option-group.entity';
import { RscStaffOptionEntity } from '@/contexts/resources/infra/persistence/entities/staff/rsc-staff-option.entity';

type RscStaffRoleOptionLinkSeed = {
  roleKey: string;
  groupKey: string;
  optionKey?: string | null;
};

export class RscStaffRoleOptionLinksSeeder implements Seeder {
  name = 'rsc-staff-role-option-links';

  async run(dataSource: DataSource): Promise<void> {
    const data = await loadSeedData<RscStaffRoleOptionLinkSeed>(
      'resources/rsc-staff-role-option-links.json',
    );
    if (data.length === 0) return;

    const roleRepo = dataSource.getRepository(RscStaffRoleEntity);
    const groupRepo = dataSource.getRepository(RscStaffOptionGroupEntity);
    const optionRepo = dataSource.getRepository(RscStaffOptionEntity);
    const linkRepo = dataSource.getRepository(RscStaffRoleOptionLinkEntity);

    const roles = await roleRepo.find();
    const groups = await groupRepo.find();
    const options = await optionRepo.find();

    const roleIdByKey = new Map(roles.map((role) => [role.key, role.id]));
    const groupIdByKey = new Map(groups.map((group) => [group.key, group.id]));
    const optionIdByKey = new Map(options.map((option) => [option.key, option.id]));

    const normalized = data.map((item) => {
      const roleId = roleIdByKey.get(item.roleKey);
      if (!roleId) {
        throw new Error(`Unknown staff role key: ${item.roleKey}`);
      }

      const groupId = groupIdByKey.get(item.groupKey);
      if (!groupId) {
        throw new Error(`Unknown staff option group key: ${item.groupKey}`);
      }

      let optionId: number | null = null;
      if (item.optionKey !== undefined && item.optionKey !== null) {
        const resolved = optionIdByKey.get(item.optionKey);
        if (!resolved) {
          throw new Error(`Unknown staff option key: ${item.optionKey}`);
        }
        optionId = resolved;
      }

      return {
        roleId,
        groupId,
        optionId,
      };
    });

    await linkRepo.createQueryBuilder().delete().execute();
    await linkRepo.insert(normalized);
  }
}

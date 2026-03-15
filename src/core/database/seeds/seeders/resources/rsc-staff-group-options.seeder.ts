import { DataSource } from 'typeorm';
import { Seeder } from '../seed.types';
import { loadSeedData } from '../seed.utils';
import { RscStaffOptionGroupEntity } from '@/contexts/resources/infra/persistence/entities/staff/rsc-staff-option-group.entity';
import { RscStaffOptionEntity } from '@/contexts/resources/infra/persistence/entities/staff/rsc-staff-option.entity';
import { RscStaffGroupOptionEntity } from '@/contexts/resources/infra/persistence/entities/staff/rsc-staff-group-option.entity';

type RscStaffGroupOptionSeed = {
  groupKey: string;
  optionKey: string;
};

export class RscStaffGroupOptionsSeeder implements Seeder {
  name = 'rsc-staff-group-options';

  async run(dataSource: DataSource): Promise<void> {
    const data = await loadSeedData<RscStaffGroupOptionSeed>(
      'resources/rsc-staff-group-options.json',
    );
    if (data.length === 0) return;

    const groupRepo = dataSource.getRepository(RscStaffOptionGroupEntity);
    const optionRepo = dataSource.getRepository(RscStaffOptionEntity);
    const groupOptionRepo = dataSource.getRepository(RscStaffGroupOptionEntity);

    const groups = await groupRepo.find();
    const options = await optionRepo.find();

    const groupIdByKey = new Map(groups.map((group) => [group.key, group.id]));
    const optionIdByKey = new Map(options.map((option) => [option.key, option.id]));

    const normalized = data.map((item) => {
      const groupId = groupIdByKey.get(item.groupKey);
      if (!groupId) {
        throw new Error(`Unknown staff option group key: ${item.groupKey}`);
      }

      const optionId = optionIdByKey.get(item.optionKey);
      if (!optionId) {
        throw new Error(`Unknown staff option key: ${item.optionKey}`);
      }

      return {
        groupId,
        optionId,
      };
    });

    await groupOptionRepo.createQueryBuilder().delete().execute();
    await groupOptionRepo.insert(normalized);
  }
}

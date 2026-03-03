import { RscSocialPlatformTypeEnum } from '@neeft-sas/shared';
import { DataSource } from 'typeorm';
import { Seeder } from '../seed.types';
import { loadSeedData, upsertByColumns } from '../seed.utils';
import { RscSocialPlatformEntity } from '@/contexts/resources/infra/persistence/entities/rsc-socials-platforms.entity';

type RscSocialPlatformSeed = {
  key: string;
  label: string;
  baseUrl?: string | null;
  type: RscSocialPlatformTypeEnum;
  placeholder?: string | null;
  example?: string | null;
  icon?: string | null;
  isActive?: boolean;
};

export class RscSocialPlatformsSeeder implements Seeder {
  name = 'rsc-social-platforms';

  async run(dataSource: DataSource): Promise<void> {
    const data = await loadSeedData<RscSocialPlatformSeed>('resources/rsc-social-platforms.json');
    if (data.length === 0) return;

    await upsertByColumns(dataSource, RscSocialPlatformEntity, data, ['key']);
  }
}

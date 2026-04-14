import { DataSource } from 'typeorm';
import { RscStaffRolesSeeder } from '@/core/database/seeds/seeders/resources/rsc-staff-roles.seeder';
import { RscStaffOptionGroupsSeeder } from '@/core/database/seeds/seeders/resources/rsc-staff-option-groups.seeder';
import { RscStaffOptionsSeeder } from '@/core/database/seeds/seeders/resources/rsc-staff-options.seeder';
import { RscStaffGroupOptionsSeeder } from '@/core/database/seeds/seeders/resources/rsc-staff-group-options.seeder';
import { RscStaffRoleOptionLinksSeeder } from '@/core/database/seeds/seeders/resources/rsc-staff-role-option-links.seeder';

export async function seedStaffResources(dataSource: DataSource): Promise<void> {
  await new RscStaffRolesSeeder().run(dataSource);
  await new RscStaffOptionGroupsSeeder().run(dataSource);
  await new RscStaffOptionsSeeder().run(dataSource);
  await new RscStaffGroupOptionsSeeder().run(dataSource);
  await new RscStaffRoleOptionLinksSeeder().run(dataSource);
}

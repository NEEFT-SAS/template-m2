import { PlayerStaffRoleResponse } from '@/contexts/players/api/presenters/player-staff-role.response';
import { UserProfileStaffRoleEntity } from '@/contexts/players/infra/entities/profile/user-profile-staff-role.entity';
import { plainToInstance } from 'class-transformer';

type StaffRoleResource = {
  id: string;
  slug: string;
  label: string;
  icon: string | null;
};

export const toPlayerStaffRoleResponse = (
  entity: UserProfileStaffRoleEntity,
  role: StaffRoleResource | null = null,
): PlayerStaffRoleResponse =>
  plainToInstance(
    PlayerStaffRoleResponse,
    {
      id: entity.id,
      roleId: entity.roleKey,
      roleSlug: role?.slug ?? entity.roleKey,
      roleLabel: role?.label ?? entity.roleKey,
      roleIcon: role?.icon ?? null,
      payload: entity.payload ?? null,
    },
    { excludeExtraneousValues: true },
  );

import { Expose } from 'class-transformer';

export class PlayerStaffRoleResponse {
  @Expose()
  id!: number;

  @Expose()
  roleId!: string;

  @Expose()
  roleSlug!: string;

  @Expose()
  roleLabel!: string;

  @Expose()
  roleIcon!: string | null;

  @Expose()
  payload!: Record<string, unknown> | null;
}

import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePlayerStaffRoles20260318000100
  implements MigrationInterface
{
  name = 'CreatePlayerStaffRoles20260318000100';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE player_staff_roles (
        id int NOT NULL AUTO_INCREMENT,
        role_key varchar(80) NOT NULL,
        payload json NULL,
        profile_id char(36) NOT NULL,
        created_at datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        updated_at datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        INDEX idx_player_staff_roles_profile_id (profile_id),
        INDEX idx_player_staff_roles_role_key (role_key),
        UNIQUE INDEX uq_player_staff_roles_profile_role_key (profile_id, role_key),
        PRIMARY KEY (id),
        CONSTRAINT fk_player_staff_roles_profile_id FOREIGN KEY (profile_id) REFERENCES user_profiles(id) ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE player_staff_roles`);
  }
}

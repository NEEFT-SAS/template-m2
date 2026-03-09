import { MigrationInterface, QueryRunner } from 'typeorm';

export class RenameFeedFollowsToSocialFollows20260305000100 implements MigrationInterface {
  name = 'RenameFeedFollowsToSocialFollows20260305000100';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const hasFeedFollows = await this.hasTable(queryRunner, 'feed_follows');
    const hasSocialFollows = await this.hasTable(queryRunner, 'social_follows');

    if (hasFeedFollows && !hasSocialFollows) {
      await queryRunner.query(`RENAME TABLE feed_follows TO social_follows`);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const hasFeedFollows = await this.hasTable(queryRunner, 'feed_follows');
    const hasSocialFollows = await this.hasTable(queryRunner, 'social_follows');

    if (!hasFeedFollows && hasSocialFollows) {
      await queryRunner.query(`RENAME TABLE social_follows TO feed_follows`);
    }
  }

  private async hasTable(queryRunner: QueryRunner, tableName: string): Promise<boolean> {
    const rows = await queryRunner.query(
      `
        SELECT COUNT(*) AS count
        FROM information_schema.TABLES
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = ?
      `,
      [tableName],
    );

    return Number(rows?.[0]?.count ?? 0) > 0;
  }
}

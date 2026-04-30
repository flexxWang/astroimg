import { MigrationInterface, QueryRunner } from 'typeorm';

type StatisticRow = {
  1: number;
};

export class LikeRelationIndexes1775569800000 implements MigrationInterface {
  name = 'LikeRelationIndexes1775569800000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await this.createIndexIfMissing(
      queryRunner,
      'likes',
      'IDX_likes_post_created_at',
      'CREATE INDEX `IDX_likes_post_created_at` ON `likes` (`post_id`, `created_at`)',
    );
    await this.createIndexIfMissing(
      queryRunner,
      'work_likes',
      'IDX_work_likes_work_created_at',
      'CREATE INDEX `IDX_work_likes_work_created_at` ON `work_likes` (`work_id`, `created_at`)',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await this.dropIndexIfExists(
      queryRunner,
      'work_likes',
      'IDX_work_likes_work_created_at',
      'DROP INDEX `IDX_work_likes_work_created_at` ON `work_likes`',
    );
    await this.dropIndexIfExists(
      queryRunner,
      'likes',
      'IDX_likes_post_created_at',
      'DROP INDEX `IDX_likes_post_created_at` ON `likes`',
    );
  }

  private async createIndexIfMissing(
    queryRunner: QueryRunner,
    tableName: string,
    indexName: string,
    sql: string,
  ) {
    const exists = await this.indexExists(queryRunner, tableName, indexName);
    if (!exists) {
      await queryRunner.query(sql);
    }
  }

  private async dropIndexIfExists(
    queryRunner: QueryRunner,
    tableName: string,
    indexName: string,
    sql: string,
  ) {
    const exists = await this.indexExists(queryRunner, tableName, indexName);
    if (exists) {
      await queryRunner.query(sql);
    }
  }

  private async indexExists(
    queryRunner: QueryRunner,
    tableName: string,
    indexName: string,
  ) {
    const { database } = queryRunner.connection.options;
    if (typeof database !== 'string' || database.length === 0) {
      throw new Error('Database name is required to inspect index metadata.');
    }

    const rows: unknown = await queryRunner.query(
      `
        SELECT 1
        FROM INFORMATION_SCHEMA.STATISTICS
        WHERE TABLE_SCHEMA = ?
          AND TABLE_NAME = ?
          AND INDEX_NAME = ?
        LIMIT 1
      `,
      [database, tableName, indexName],
    );

    return Array.isArray(rows) && (rows as StatisticRow[]).length > 0;
  }
}

import { MigrationInterface, QueryRunner } from 'typeorm';

type StatisticRow = {
  1: number;
};

export class ObservabilityAndFeedIndexes1775568600000 implements MigrationInterface {
  name = 'ObservabilityAndFeedIndexes1775568600000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await this.createIndexIfMissing(
      queryRunner,
      'posts',
      'IDX_posts_created_at',
      'CREATE INDEX `IDX_posts_created_at` ON `posts` (`created_at`)',
    );
    await this.createIndexIfMissing(
      queryRunner,
      'posts',
      'IDX_posts_author_created_at',
      'CREATE INDEX `IDX_posts_author_created_at` ON `posts` (`author_id`, `created_at`)',
    );
    await this.createIndexIfMissing(
      queryRunner,
      'comments',
      'IDX_comments_post_created_at',
      'CREATE INDEX `IDX_comments_post_created_at` ON `comments` (`post_id`, `created_at`)',
    );
    await this.createIndexIfMissing(
      queryRunner,
      'works',
      'IDX_works_created_at',
      'CREATE INDEX `IDX_works_created_at` ON `works` (`created_at`)',
    );
    await this.createIndexIfMissing(
      queryRunner,
      'works',
      'IDX_works_author_created_at',
      'CREATE INDEX `IDX_works_author_created_at` ON `works` (`author_id`, `created_at`)',
    );
    await this.createIndexIfMissing(
      queryRunner,
      'work_comments',
      'IDX_work_comments_work_created_at',
      'CREATE INDEX `IDX_work_comments_work_created_at` ON `work_comments` (`work_id`, `created_at`)',
    );
    await this.createIndexIfMissing(
      queryRunner,
      'drafts',
      'IDX_drafts_author_updated_at',
      'CREATE INDEX `IDX_drafts_author_updated_at` ON `drafts` (`author_id`, `updated_at`)',
    );
    await this.createIndexIfMissing(
      queryRunner,
      'follows',
      'IDX_follows_follower_created_at',
      'CREATE INDEX `IDX_follows_follower_created_at` ON `follows` (`follower_id`, `created_at`)',
    );
    await this.createIndexIfMissing(
      queryRunner,
      'follows',
      'IDX_follows_following_created_at',
      'CREATE INDEX `IDX_follows_following_created_at` ON `follows` (`following_id`, `created_at`)',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await this.dropIndexIfExists(
      queryRunner,
      'follows',
      'IDX_follows_following_created_at',
      'DROP INDEX `IDX_follows_following_created_at` ON `follows`',
    );
    await this.dropIndexIfExists(
      queryRunner,
      'follows',
      'IDX_follows_follower_created_at',
      'DROP INDEX `IDX_follows_follower_created_at` ON `follows`',
    );
    await this.dropIndexIfExists(
      queryRunner,
      'drafts',
      'IDX_drafts_author_updated_at',
      'DROP INDEX `IDX_drafts_author_updated_at` ON `drafts`',
    );
    await this.dropIndexIfExists(
      queryRunner,
      'work_comments',
      'IDX_work_comments_work_created_at',
      'DROP INDEX `IDX_work_comments_work_created_at` ON `work_comments`',
    );
    await this.dropIndexIfExists(
      queryRunner,
      'works',
      'IDX_works_author_created_at',
      'DROP INDEX `IDX_works_author_created_at` ON `works`',
    );
    await this.dropIndexIfExists(
      queryRunner,
      'works',
      'IDX_works_created_at',
      'DROP INDEX `IDX_works_created_at` ON `works`',
    );
    await this.dropIndexIfExists(
      queryRunner,
      'comments',
      'IDX_comments_post_created_at',
      'DROP INDEX `IDX_comments_post_created_at` ON `comments`',
    );
    await this.dropIndexIfExists(
      queryRunner,
      'posts',
      'IDX_posts_author_created_at',
      'DROP INDEX `IDX_posts_author_created_at` ON `posts`',
    );
    await this.dropIndexIfExists(
      queryRunner,
      'posts',
      'IDX_posts_created_at',
      'DROP INDEX `IDX_posts_created_at` ON `posts`',
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

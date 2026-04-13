import { MigrationInterface, QueryRunner } from 'typeorm';

export class MessageInfraHardening1775561400000 implements MigrationInterface {
  name = 'MessageInfraHardening1775561400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await this.createIndexIfMissing(
      queryRunner,
      'conversations',
      'UQ_conversations_user_pair',
      'CREATE UNIQUE INDEX `UQ_conversations_user_pair` ON `conversations` (`user_a_id`, `user_b_id`)',
    );
    await this.createIndexIfMissing(
      queryRunner,
      'conversations',
      'IDX_conversations_user_a_updated_at',
      'CREATE INDEX `IDX_conversations_user_a_updated_at` ON `conversations` (`user_a_id`, `updated_at`)',
    );
    await this.createIndexIfMissing(
      queryRunner,
      'conversations',
      'IDX_conversations_user_b_updated_at',
      'CREATE INDEX `IDX_conversations_user_b_updated_at` ON `conversations` (`user_b_id`, `updated_at`)',
    );
    await this.createIndexIfMissing(
      queryRunner,
      'messages',
      'IDX_messages_conversation_created_at',
      'CREATE INDEX `IDX_messages_conversation_created_at` ON `messages` (`conversation_id`, `created_at`)',
    );
    await this.createIndexIfMissing(
      queryRunner,
      'messages',
      'IDX_messages_recipient_read_conversation',
      'CREATE INDEX `IDX_messages_recipient_read_conversation` ON `messages` (`recipient_id`, `read`, `conversation_id`)',
    );
    await this.createIndexIfMissing(
      queryRunner,
      'notifications',
      'IDX_notifications_user_created_at',
      'CREATE INDEX `IDX_notifications_user_created_at` ON `notifications` (`user_id`, `created_at`)',
    );
    await this.createIndexIfMissing(
      queryRunner,
      'notifications',
      'IDX_notifications_user_read_created_at',
      'CREATE INDEX `IDX_notifications_user_read_created_at` ON `notifications` (`user_id`, `read`, `created_at`)',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await this.dropIndexIfExists(
      queryRunner,
      'notifications',
      'IDX_notifications_user_read_created_at',
      'DROP INDEX `IDX_notifications_user_read_created_at` ON `notifications`',
    );
    await this.dropIndexIfExists(
      queryRunner,
      'notifications',
      'IDX_notifications_user_created_at',
      'DROP INDEX `IDX_notifications_user_created_at` ON `notifications`',
    );
    await this.dropIndexIfExists(
      queryRunner,
      'messages',
      'IDX_messages_recipient_read_conversation',
      'DROP INDEX `IDX_messages_recipient_read_conversation` ON `messages`',
    );
    await this.dropIndexIfExists(
      queryRunner,
      'messages',
      'IDX_messages_conversation_created_at',
      'DROP INDEX `IDX_messages_conversation_created_at` ON `messages`',
    );
    await this.dropIndexIfExists(
      queryRunner,
      'conversations',
      'IDX_conversations_user_b_updated_at',
      'DROP INDEX `IDX_conversations_user_b_updated_at` ON `conversations`',
    );
    await this.dropIndexIfExists(
      queryRunner,
      'conversations',
      'IDX_conversations_user_a_updated_at',
      'DROP INDEX `IDX_conversations_user_a_updated_at` ON `conversations`',
    );
    await this.dropIndexIfExists(
      queryRunner,
      'conversations',
      'UQ_conversations_user_pair',
      'DROP INDEX `UQ_conversations_user_pair` ON `conversations`',
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
    const database = queryRunner.connection.options.database;
    const rows = await queryRunner.query(
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

    return Array.isArray(rows) && rows.length > 0;
  }
}

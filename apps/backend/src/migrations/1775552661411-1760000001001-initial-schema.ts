import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1775552661411 implements MigrationInterface {
  name = 'InitialSchema1775552661411';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`work_likes\` (\`id\` varchar(36) NOT NULL, \`work_id\` varchar(255) NOT NULL, \`user_id\` varchar(255) NOT NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), UNIQUE INDEX \`IDX_ef2ef73045df6a442fee6e18c3\` (\`work_id\`, \`user_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`comments\` (\`id\` varchar(36) NOT NULL, \`content\` text NOT NULL, \`author_id\` varchar(255) NOT NULL, \`post_id\` varchar(255) NOT NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`authorId\` varchar(36) NULL, \`postId\` varchar(36) NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`posts\` (\`id\` varchar(36) NOT NULL, \`title\` varchar(200) NOT NULL, \`content\` longtext NOT NULL, \`author_id\` varchar(255) NOT NULL, \`like_count\` int NOT NULL DEFAULT '0', \`comment_count\` int NOT NULL DEFAULT '0', \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`users\` (\`id\` varchar(36) NOT NULL, \`username\` varchar(32) NOT NULL, \`email\` varchar(128) NOT NULL, \`password_hash\` varchar(255) NOT NULL, \`avatar_url\` varchar(255) NULL, \`bio\` text NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), UNIQUE INDEX \`IDX_fe0bb3f6520ee0469504521e71\` (\`username\`), UNIQUE INDEX \`IDX_97672ac88f789774dd47f7c8be\` (\`email\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`work_types\` (\`id\` varchar(36) NOT NULL, \`code\` varchar(64) NOT NULL, \`name\` varchar(64) NOT NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), UNIQUE INDEX \`IDX_94c26230a4dce5cdcd7c1eeb8e\` (\`code\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`work_devices\` (\`id\` varchar(36) NOT NULL, \`code\` varchar(64) NOT NULL, \`name\` varchar(64) NOT NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), UNIQUE INDEX \`IDX_f5f2c778654eca2ab48d0ff9d8\` (\`code\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`works\` (\`id\` varchar(36) NOT NULL, \`title\` varchar(200) NOT NULL, \`description\` text NULL, \`image_url\` varchar(500) NULL, \`image_urls\` json NULL, \`video_url\` varchar(500) NULL, \`type_id\` varchar(255) NULL, \`device_id\` varchar(255) NULL, \`author_id\` varchar(255) NOT NULL, \`like_count\` int NOT NULL DEFAULT '0', \`comment_count\` int NOT NULL DEFAULT '0', \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`work_comments\` (\`id\` varchar(36) NOT NULL, \`content\` text NOT NULL, \`work_id\` varchar(255) NOT NULL, \`author_id\` varchar(255) NOT NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`observation_points\` (\`id\` varchar(36) NOT NULL, \`name\` varchar(120) NOT NULL, \`description\` text NULL, \`latitude\` decimal(10,6) NOT NULL, \`longitude\` decimal(10,6) NOT NULL, \`light_pollution\` int NULL, \`elevation\` int NULL, \`author_id\` varchar(255) NOT NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`notifications\` (\`id\` varchar(36) NOT NULL, \`user_id\` varchar(255) NOT NULL, \`actor_id\` varchar(255) NOT NULL, \`actor_name\` varchar(64) NULL, \`type\` varchar(20) NOT NULL, \`post_id\` varchar(255) NULL, \`read\` tinyint NOT NULL DEFAULT 0, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`messages\` (\`id\` varchar(36) NOT NULL, \`conversation_id\` varchar(255) NOT NULL, \`sender_id\` varchar(255) NOT NULL, \`recipient_id\` varchar(255) NOT NULL, \`content\` text NOT NULL, \`read\` tinyint NOT NULL DEFAULT 0, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`conversations\` (\`id\` varchar(36) NOT NULL, \`user_a_id\` varchar(255) NOT NULL, \`user_b_id\` varchar(255) NOT NULL, \`last_message\` text NULL, \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`likes\` (\`id\` varchar(36) NOT NULL, \`user_id\` varchar(255) NOT NULL, \`post_id\` varchar(255) NOT NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), UNIQUE INDEX \`IDX_723da61de46f65bb3e3096750d\` (\`user_id\`, \`post_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`follows\` (\`id\` varchar(36) NOT NULL, \`follower_id\` varchar(255) NOT NULL, \`following_id\` varchar(255) NOT NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), UNIQUE INDEX \`IDX_8109e59f691f0444b43420f698\` (\`follower_id\`, \`following_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`drafts\` (\`id\` varchar(36) NOT NULL, \`author_id\` varchar(255) NOT NULL, \`title\` varchar(200) NOT NULL DEFAULT '', \`content\` longtext NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`ai_plan_sessions\` (\`id\` varchar(36) NOT NULL, \`user_id\` varchar(255) NOT NULL, \`input_json\` json NOT NULL, \`output_json\` json NOT NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `ALTER TABLE \`comments\` ADD CONSTRAINT \`FK_4548cc4a409b8651ec75f70e280\` FOREIGN KEY (\`authorId\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`comments\` ADD CONSTRAINT \`FK_e44ddaaa6d058cb4092f83ad61f\` FOREIGN KEY (\`postId\`) REFERENCES \`posts\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`posts\` ADD CONSTRAINT \`FK_312c63be865c81b922e39c2475e\` FOREIGN KEY (\`author_id\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`works\` ADD CONSTRAINT \`FK_2e50e8f40f827e9beb237adf900\` FOREIGN KEY (\`type_id\`) REFERENCES \`work_types\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`works\` ADD CONSTRAINT \`FK_fc6c6abf9009a2d57550d35be8e\` FOREIGN KEY (\`device_id\`) REFERENCES \`work_devices\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`works\` ADD CONSTRAINT \`FK_35cb8c54ba6cc9c0b068dff32ee\` FOREIGN KEY (\`author_id\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`work_comments\` ADD CONSTRAINT \`FK_4bdaf507b0278e816cf1633e280\` FOREIGN KEY (\`work_id\`) REFERENCES \`works\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`work_comments\` ADD CONSTRAINT \`FK_ece0298cf6a464338da1737a320\` FOREIGN KEY (\`author_id\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`observation_points\` ADD CONSTRAINT \`FK_e639039bc0a1cbaacb89ae163f4\` FOREIGN KEY (\`author_id\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`ai_plan_sessions\` ADD CONSTRAINT \`FK_0fb9656eab9016c6e7dfa63d76e\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`ai_plan_sessions\` DROP FOREIGN KEY \`FK_0fb9656eab9016c6e7dfa63d76e\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`observation_points\` DROP FOREIGN KEY \`FK_e639039bc0a1cbaacb89ae163f4\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`work_comments\` DROP FOREIGN KEY \`FK_ece0298cf6a464338da1737a320\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`work_comments\` DROP FOREIGN KEY \`FK_4bdaf507b0278e816cf1633e280\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`works\` DROP FOREIGN KEY \`FK_35cb8c54ba6cc9c0b068dff32ee\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`works\` DROP FOREIGN KEY \`FK_fc6c6abf9009a2d57550d35be8e\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`works\` DROP FOREIGN KEY \`FK_2e50e8f40f827e9beb237adf900\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`posts\` DROP FOREIGN KEY \`FK_312c63be865c81b922e39c2475e\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`comments\` DROP FOREIGN KEY \`FK_e44ddaaa6d058cb4092f83ad61f\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`comments\` DROP FOREIGN KEY \`FK_4548cc4a409b8651ec75f70e280\``,
    );
    await queryRunner.query(`DROP TABLE \`ai_plan_sessions\``);
    await queryRunner.query(`DROP TABLE \`drafts\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_8109e59f691f0444b43420f698\` ON \`follows\``,
    );
    await queryRunner.query(`DROP TABLE \`follows\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_723da61de46f65bb3e3096750d\` ON \`likes\``,
    );
    await queryRunner.query(`DROP TABLE \`likes\``);
    await queryRunner.query(`DROP TABLE \`conversations\``);
    await queryRunner.query(`DROP TABLE \`messages\``);
    await queryRunner.query(`DROP TABLE \`notifications\``);
    await queryRunner.query(`DROP TABLE \`observation_points\``);
    await queryRunner.query(`DROP TABLE \`work_comments\``);
    await queryRunner.query(`DROP TABLE \`works\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_f5f2c778654eca2ab48d0ff9d8\` ON \`work_devices\``,
    );
    await queryRunner.query(`DROP TABLE \`work_devices\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_94c26230a4dce5cdcd7c1eeb8e\` ON \`work_types\``,
    );
    await queryRunner.query(`DROP TABLE \`work_types\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_97672ac88f789774dd47f7c8be\` ON \`users\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_fe0bb3f6520ee0469504521e71\` ON \`users\``,
    );
    await queryRunner.query(`DROP TABLE \`users\``);
    await queryRunner.query(`DROP TABLE \`posts\``);
    await queryRunner.query(`DROP TABLE \`comments\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_ef2ef73045df6a442fee6e18c3\` ON \`work_likes\``,
    );
    await queryRunner.query(`DROP TABLE \`work_likes\``);
  }
}

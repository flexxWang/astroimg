import { join } from 'path';
import { registerAs } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { MysqlConnectionOptions } from 'typeorm/driver/mysql/MysqlConnectionOptions';

function buildGlob(pattern: string) {
  const isTsRuntime = __filename.endsWith('.ts');
  const rootDir = isTsRuntime ? 'src' : 'dist';
  const extension = isTsRuntime ? '.ts' : '.js';
  return join(process.cwd(), rootDir, pattern.replace('{.ts,.js}', extension));
}

export function buildDatabaseOptions(
  env: NodeJS.ProcessEnv,
  options?: { autoLoadEntities?: boolean },
): TypeOrmModuleOptions {
  return {
    type: 'mysql',
    host: env.DB_HOST || '127.0.0.1',
    port: Number(env.DB_PORT || 3306),
    username: env.DB_USER || 'root',
    password: env.DB_PASS || '',
    database: env.DB_NAME || 'astroimg',
    autoLoadEntities: options?.autoLoadEntities ?? true,
    synchronize: env.DB_SYNC === 'true',
    logging: env.DB_LOGGING === 'true',
    migrationsRun: env.DB_RUN_MIGRATIONS === 'true',
    migrations: [buildGlob('migrations/*{.ts,.js}')],
  };
}

export function buildDataSourceOptions(
  env: NodeJS.ProcessEnv,
): MysqlConnectionOptions {
  return {
    type: 'mysql',
    host: env.DB_HOST || '127.0.0.1',
    port: Number(env.DB_PORT || 3306),
    username: env.DB_USER || 'root',
    password: env.DB_PASS || '',
    database: env.DB_NAME || 'astroimg',
    logging: env.DB_LOGGING === 'true',
    synchronize: false,
    migrationsRun: false,
    entities: [buildGlob('**/*.entity{.ts,.js}')],
    migrations: [buildGlob('migrations/*{.ts,.js}')],
  };
}

export default registerAs('database', () => buildDatabaseOptions(process.env));

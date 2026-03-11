import { registerAs } from '@nestjs/config';

export default registerAs('database', () => ({
  type: 'mysql' as const,
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || 3306),
  username: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || 'root',
  database: process.env.DB_NAME || 'astroimg',
  autoLoadEntities: true,
  synchronize: process.env.DB_SYNC === 'true',
  logging: process.env.DB_LOGGING === 'true',
}));

import { resolve } from 'node:path';

export function getBackendEnvFilePaths() {
  const nodeEnv = process.env.NODE_ENV || 'development';
  const root = process.cwd();
  const envFileByMode =
    nodeEnv === 'test'
      ? '.env.test'
      : nodeEnv === 'production'
        ? '.env.production'
        : '.env.local';

  return [resolve(root, envFileByMode), resolve(root, '.env')];
}

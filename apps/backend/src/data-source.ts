import 'reflect-metadata';
import { existsSync } from 'node:fs';
import { DataSource } from 'typeorm';
import { buildDataSourceOptions } from './config/database.config';
import { getBackendEnvFilePaths } from './config/env-files';

function loadEnvFiles() {
  const envFiles = getBackendEnvFilePaths();

  for (const path of envFiles) {
    if (existsSync(path)) {
      process.loadEnvFile(path);
    }
  }
}

loadEnvFiles();

export default new DataSource(buildDataSourceOptions(process.env));

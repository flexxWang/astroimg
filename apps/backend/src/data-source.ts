import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { buildDataSourceOptions } from './config/database.config';

export default new DataSource(buildDataSourceOptions(process.env));

import 'dotenv/config';
import { DataSource, DataSourceOptions } from 'typeorm';
import { Address } from '../address/address.entity';
import { Patient } from '../patient/patient.entity';
import { PtLocation } from '../pt-location/pt-location.entity';
import { ZipCode } from '../zip-code/zip-code.entity';

export function databaseOptions(): DataSourceOptions {
  return {
    type: 'postgres',
    host: process.env.DB_HOST ?? 'localhost',
    port: Number(process.env.DB_PORT ?? 5433),
    username: process.env.DB_USER ?? 'postgres',
    password: process.env.DB_PASS ?? process.env.DB_PASSWORD ?? 'postgres',
    database: process.env.DB_NAME ?? 'patient_address',
    entities: [Address, ZipCode, Patient, PtLocation],
    synchronize: process.env.DB_SYNCHRONIZE !== 'false',
    logging: process.env.DB_LOGGING === 'true',
  };
}

export function createDataSource(): DataSource {
  return new DataSource(databaseOptions());
}

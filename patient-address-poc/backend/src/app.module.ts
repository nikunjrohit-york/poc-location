import 'dotenv/config';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AddressModule } from './address/address.module';
import { databaseOptions } from './database/data-source';
import { PatientModule } from './patient/patient.module';
import { PtLocationModule } from './pt-location/pt-location.module';
import { ZipCodeModule } from './zip-code/zip-code.module';

@Module({
  imports: [
    TypeOrmModule.forRoot(databaseOptions()),
    ZipCodeModule,
    AddressModule,
    PtLocationModule,
    PatientModule,
  ],
})
export class AppModule {}

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Address } from '../address/address.entity';
import { PtLocation } from '../pt-location/pt-location.entity';
import { PatientController } from './patient.controller';
import { Patient } from './patient.entity';
import { PatientService } from './patient.service';

@Module({
  imports: [TypeOrmModule.forFeature([Patient, Address, PtLocation])],
  controllers: [PatientController],
  providers: [PatientService],
})
export class PatientModule {}

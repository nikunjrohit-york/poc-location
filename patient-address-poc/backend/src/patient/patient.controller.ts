import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { CreatePatientDto } from './dto/create-patient.dto';
import { Patient } from './patient.entity';
import { PatientService } from './patient.service';

@Controller('patient')
export class PatientController {
  constructor(private readonly patients: PatientService) {}

  @Post()
  create(@Body() dto: CreatePatientDto): Promise<Patient> {
    return this.patients.create(dto);
  }

  @Get()
  findAll(@Query('q') q?: string): Promise<Patient[]> {
    return this.patients.findAll(q);
  }
}

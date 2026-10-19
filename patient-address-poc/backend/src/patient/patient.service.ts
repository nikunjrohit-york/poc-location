import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Address } from '../address/address.entity';
import { blankToNull, escapeLike } from '../common/like';
import { PtLocation } from '../pt-location/pt-location.entity';
import { CreatePatientDto } from './dto/create-patient.dto';
import { Patient } from './patient.entity';

@Injectable()
export class PatientService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Patient)
    private readonly patients: Repository<Patient>,
  ) {}

  async create(dto: CreatePatientDto): Promise<Patient> {
    const hasLat = dto.address.latitude != null;
    const hasLng = dto.address.longitude != null;
    if (hasLat !== hasLng) {
      throw new BadRequestException('latitude and longitude must be provided together');
    }

    return this.dataSource.transaction(async (manager) => {
      let ptLocation: PtLocation | null = null;
      if (dto.ptLocationId != null) {
        ptLocation = await manager.findOne(PtLocation, { where: { id: dto.ptLocationId } });
        if (!ptLocation) {
          throw new BadRequestException('PT location not found');
        }
      }

      const address = manager.create(Address, {
        addressLine1: dto.address.addressLine1.trim(),
        addressLine2: blankToNull(dto.address.addressLine2),
        city: blankToNull(dto.address.city),
        state: blankToNull(dto.address.state),
        postalCode: blankToNull(dto.address.postalCode),
        latitude: dto.address.latitude ?? null,
        longitude: dto.address.longitude ?? null,
      });
      const savedAddress = await manager.save(address);

      const patient = manager.create(Patient, {
        externalPatientId: blankToNull(dto.externalPatientId),
        firstName: dto.firstName.trim(),
        middleName: blankToNull(dto.middleName),
        lastName: dto.lastName.trim(),
        patientName: composePatientName(dto.firstName, dto.middleName, dto.lastName),
        dateOfBirth: dto.dateOfBirth ?? null,
        gender: dto.gender ?? null,
        email: blankToNull(dto.email),
        status: 1,
        address: savedAddress,
        ptLocation,
      });
      const saved = await manager.save(patient);
      saved.patientNumber = `PT-${String(saved.id).padStart(6, '0')}`;
      await manager.save(saved);

      return manager.findOneOrFail(Patient, {
        where: { id: saved.id },
        relations: { address: true, ptLocation: true },
      });
    });
  }

  async findAll(query?: string): Promise<Patient[]> {
    const q = query?.trim() ?? '';
    const base = this.patients
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.address', 'address')
      .leftJoinAndSelect('p.ptLocation', 'ptLocation')
      .orderBy('p.createdAt', 'DESC');

    if (!q) return base.getMany();

    const pattern = `%${escapeLike(q)}%`;
    return base
      .where(
        `(p.patient_name ILIKE :pattern ESCAPE '\\' OR p.first_name ILIKE :pattern ESCAPE '\\' OR p.last_name ILIKE :pattern ESCAPE '\\' OR p.patient_number ILIKE :pattern ESCAPE '\\')`,
        { pattern },
      )
      .getMany();
  }
}

export function composePatientName(
  first?: string | null,
  middle?: string | null,
  last?: string | null,
): string {
  return [first, middle, last]
    .map((part) => part?.trim())
    .filter((part): part is string => Boolean(part))
    .join(' ');
}

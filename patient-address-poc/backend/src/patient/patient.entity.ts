import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  RelationId,
  UpdateDateColumn,
} from 'typeorm';
import { Address } from '../address/address.entity';
import { PtLocation } from '../pt-location/pt-location.entity';

export enum Gender {
  Male = 'male',
  Female = 'female',
  Other = 'other',
}

@Entity('patient')
@Index('idx_patients_email', ['email'])
@Index('idx_patients_dedup', ['lastName', 'firstName', 'dateOfBirth'])
@Index('idx_patients_status', ['status'])
@Index('idx_patients_not_deleted', ['deletedAt'])
@Index('idx_patients_address', ['address'])
export class Patient {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'external_patient_id', type: 'varchar', length: 64, unique: true, nullable: true })
  externalPatientId: string | null;

  @Column({ name: 'patient_number', type: 'varchar', length: 32, unique: true, nullable: true })
  patientNumber: string | null;

  @Column({ name: 'patient_name', type: 'varchar', length: 255 })
  patientName: string;

  @Column({ name: 'first_name', type: 'varchar', length: 100, nullable: true })
  firstName: string | null;

  @Column({ name: 'middle_name', type: 'varchar', length: 100, nullable: true })
  middleName: string | null;

  @Column({ name: 'last_name', type: 'varchar', length: 100, nullable: true })
  lastName: string | null;

  /** SQL DATE stored as YYYY-MM-DD so the calendar day does not shift by timezone. */
  @Column({ name: 'date_of_birth', type: 'date', nullable: true })
  dateOfBirth: string | null;

  @Column({ type: 'enum', enum: Gender, nullable: true })
  gender: Gender | null;

  @ManyToOne(() => Address, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'address_id' })
  address: Address | null;

  @RelationId((patient: Patient) => patient.address)
  addressId: number | null;

  @ManyToOne(() => PtLocation, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'pt_location_id' })
  ptLocation: PtLocation | null;

  @RelationId((patient: Patient) => patient.ptLocation)
  ptLocationId: number | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  email: string | null;

  @Column({ type: 'int', default: 1 })
  status: number;

  @Column({ name: 'ezclaim_synced_at', type: 'timestamp', nullable: true })
  ezclaimSyncedAt: Date | null;

  @Column({ name: 'ezclaim_sync_status', type: 'varchar', length: 64, nullable: true })
  ezclaimSyncStatus: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamp' })
  deletedAt: Date | null;

  @Column({ name: 'created_by', type: 'int', nullable: true })
  createdBy: number | null;

  @Column({ name: 'updated_by', type: 'int', nullable: true })
  updatedBy: number | null;

  @Column({ name: 'deleted_by', type: 'int', nullable: true })
  deletedBy: number | null;
}

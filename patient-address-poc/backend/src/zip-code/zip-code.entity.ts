import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import { decimalTransformer } from '../common/decimal.transformer';

@Entity('zip_code')
export class ZipCode {
  @PrimaryGeneratedColumn()
  id: number;

  @Index('idx_zip_code_zip')
  @Column({ type: 'varchar', length: 10 })
  zip: string;

  @Column({ type: 'varchar', length: 128 })
  city: string;

  @Column({ type: 'varchar', length: 64 })
  state: string;

  @Column({
    type: 'decimal',
    precision: 9,
    scale: 6,
    transformer: decimalTransformer,
  })
  latitude: number;

  @Column({
    type: 'decimal',
    precision: 9,
    scale: 6,
    transformer: decimalTransformer,
  })
  longitude: number;
}

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ZipCode } from '../zip-code/zip-code.entity';
import { ZipCodeResult } from './address.types';

const SEARCH_LIMIT = 10;

@Injectable()
export class AddressService {
  constructor(
    @InjectRepository(ZipCode)
    private readonly zipCodes: Repository<ZipCode>,
  ) {}

  async searchLocation(query: string): Promise<ZipCodeResult[]> {
    const digits = query.trim();
    if (!/^\d{1,5}$/.test(digits)) return [];

    const rows = await this.zipCodes
      .createQueryBuilder('z')
      .where('z.zip LIKE :prefix', { prefix: `${digits}%` })
      .orderBy('z.zip', 'ASC')
      .addOrderBy('z.city', 'ASC')
      .take(SEARCH_LIMIT)
      .getMany();

    return rows.map((row) => this.toResult(row));
  }

  private toResult(row: ZipCode): ZipCodeResult {
    return {
      zip: row.zip,
      city: row.city,
      state: row.state,
      lat: Number(row.latitude),
      lng: Number(row.longitude),
    };
  }
}

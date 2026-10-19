import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { haversineKm, roundKm } from '../address/geo';
import { PtLocation } from './pt-location.entity';
import { PtNearestResult } from './pt-location.types';

@Injectable()
export class PtLocationService {
  constructor(
    @InjectRepository(PtLocation)
    private readonly locations: Repository<PtLocation>,
  ) {}

  async findNearest(lat: number, lng: number, limit: number): Promise<PtNearestResult[]> {
    const rows = await this.locations.find();
    return rows
      .filter((row) => row.latitude != null && row.longitude != null)
      .map((row) => ({
        id: row.id,
        name: row.name,
        addressLine1: row.addressLine1,
        city: row.city,
        state: row.state,
        postalCode: row.postalCode,
        distanceKm: roundKm(haversineKm(lat, lng, Number(row.latitude), Number(row.longitude))),
      }))
      .sort((a, b) => a.distanceKm - b.distanceKm || a.name.localeCompare(b.name))
      .slice(0, limit);
  }
}

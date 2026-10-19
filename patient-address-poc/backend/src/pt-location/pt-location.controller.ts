import { BadRequestException, Controller, Get, Query } from '@nestjs/common';
import { PtLocationService } from './pt-location.service';
import { PtNearestResult } from './pt-location.types';

@Controller('pt')
export class PtLocationController {
  constructor(private readonly locations: PtLocationService) {}

  @Get('nearest')
  nearest(
    @Query('lat') lat?: string,
    @Query('lng') lng?: string,
    @Query('limit') limit?: string,
  ): Promise<PtNearestResult[]> {
    if (lat == null || lng == null || lat === '' || lng === '') {
      throw new BadRequestException('lat and lng are required');
    }

    const latitude = Number(lat);
    const longitude = Number(lng);
    if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
      throw new BadRequestException('lat must be a number from -90 to 90');
    }
    if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
      throw new BadRequestException('lng must be a number from -180 to 180');
    }

    return this.locations.findNearest(latitude, longitude, parseLimit(limit));
  }
}

function parseLimit(value?: string): number {
  if (value == null || value === '') return 5;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 50) {
    throw new BadRequestException('limit must be an integer from 1 to 50');
  }
  return parsed;
}

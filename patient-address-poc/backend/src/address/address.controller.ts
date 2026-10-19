import { Controller, Get, Query } from '@nestjs/common';
import { AddressService } from './address.service';
import { ZipCodeResult } from './address.types';

@Controller('address')
export class AddressController {
  constructor(private readonly addresses: AddressService) {}

  @Get('search')
  search(@Query('q') q = ''): Promise<ZipCodeResult[]> {
    return this.addresses.searchLocation(q);
  }
}

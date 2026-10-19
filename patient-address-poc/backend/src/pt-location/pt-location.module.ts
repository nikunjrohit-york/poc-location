import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PtLocationController } from './pt-location.controller';
import { PtLocation } from './pt-location.entity';
import { PtLocationService } from './pt-location.service';

@Module({
  imports: [TypeOrmModule.forFeature([PtLocation])],
  controllers: [PtLocationController],
  providers: [PtLocationService],
  exports: [TypeOrmModule],
})
export class PtLocationModule {}

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ZipCode } from './zip-code.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ZipCode])],
  exports: [TypeOrmModule],
})
export class ZipCodeModule {}

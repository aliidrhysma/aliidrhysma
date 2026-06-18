import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Coordinate } from './coordinate.entity';
import { CoordinateService } from './coordinate.service';
import { CoordinateController } from './coordinate.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Coordinate])],
  controllers: [CoordinateController],
  providers: [CoordinateService],
  exports: [CoordinateService],
})
export class CoordinateModule {}

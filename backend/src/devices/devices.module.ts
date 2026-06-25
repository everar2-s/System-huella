import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';

import { DevicesController } from './devices.controller';
import { DevicesService } from './devices.service';
import { Device } from './device.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Device]),
    AuthModule,
  ],
  controllers: [DevicesController],
  providers: [DevicesService],
  exports: [DevicesService],
})
export class DevicesModule {}
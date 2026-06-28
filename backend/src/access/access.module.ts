import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AccessController } from './access.controller';
import { AccessService } from './access.service';
import { Fingerprint } from '../fingerprints/fingerprint.entity';
import { Member } from '../members/member.entity';
import { AttendanceModule } from '../attendance/attendance.module';
import { DevicesModule } from '../devices/devices.module';
import { Membership } from '../memberships/membership.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Fingerprint,
      Member,
      Membership,
    ]),
    AttendanceModule,
    DevicesModule,
  ],
  controllers: [AccessController],
  providers: [AccessService],
})
export class AccessModule {}
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { MembershipsController } from './memberships.controller';
import { MembershipsService } from './memberships.service';
import { Membership } from './membership.entity';
import { Member } from '../members/member.entity';
import { AuthModule } from '../auth/auth.module';
import { Fingerprint } from '../fingerprints/fingerprint.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Membership, Member, Fingerprint]),
    AuthModule,
  ],
  controllers: [MembershipsController],
  providers: [MembershipsService],
  exports: [MembershipsService],
})
export class MembershipsModule {}
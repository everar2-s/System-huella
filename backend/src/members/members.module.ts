import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { MembersService } from './members.service';
import { MembersController } from './members.controller';
import { Member } from './member.entity';
import { Fingerprint } from '../fingerprints/fingerprint.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Member, Fingerprint]),
    AuthModule,
  ],
  controllers: [MembersController],
  providers: [MembersService],
  exports: [MembersService],
})
export class MembersModule {}
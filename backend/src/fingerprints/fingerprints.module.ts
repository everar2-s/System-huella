import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { FingerprintsController } from './fingerprints.controller';
import { FingerprintsService } from './fingerprints.service';
import { Fingerprint } from './fingerprint.entity';
import { Member } from '../members/member.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Fingerprint, Member]),
    AuthModule,
  ],
  controllers: [FingerprintsController],
  providers: [FingerprintsService],
  exports: [FingerprintsService],
})
export class FingerprintsModule {}
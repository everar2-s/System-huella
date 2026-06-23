import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { FingerprintsController } from './fingerprints.controller';
import { FingerprintsService } from './fingerprints.service';
import { Fingerprint } from './fingerprint.entity';
import { Member } from '../members/member.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Fingerprint, Member])],
  controllers: [FingerprintsController],
  providers: [FingerprintsService],
})
export class FingerprintsModule {}
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { MembersService } from './members.service';
import { MembersController } from './members.controller';
import { Member } from './member.entity';
import { AuthModule } from '../auth/auth.module';


@Module({
  imports: [
    TypeOrmModule.forFeature([Member]),
    AuthModule,
  ],
  controllers: [MembersController],
  providers: [MembersService],
})
export class MembersModule {}
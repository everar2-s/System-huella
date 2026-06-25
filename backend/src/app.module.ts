import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MembersModule } from './members/members.module';
import { FingerprintsModule } from './fingerprints/fingerprints.module';
import { AccessModule } from './access/access.module';
import { AttendanceModule } from './attendance/attendance.module';
import { MembershipsModule } from './memberships/memberships.module';
import { DevicesModule } from './devices/devices.module';
import { AuthModule } from './auth/auth.module';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),

    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      autoLoadEntities: true,
      synchronize: true,
    }),

    MembersModule,

    FingerprintsModule,

    AccessModule,

    AttendanceModule,

    MembershipsModule,

    DevicesModule,

    AuthModule,
  ],
})
export class AppModule {}
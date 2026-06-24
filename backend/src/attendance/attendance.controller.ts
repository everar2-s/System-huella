import { Controller, Get, Param } from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('attendance')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Get()
  findAll() {
    return this.attendanceService.findAll();
  }

  @Get('member/:memberId')
  findByMember(@Param('memberId') memberId: string) {
    return this.attendanceService.findByMember(Number(memberId));
  }
}
import { Controller, Get, Param } from '@nestjs/common';
import { AttendanceService } from './attendance.service';

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
import {
  Controller,
  Get,
  Param,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';

import { AttendanceService } from './attendance.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('attendance')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Get()
  findAll(@Req() req: any) {
    const userId = this.getUserId(req);
    return this.attendanceService.findAll(userId);
  }

  @Get('member/:memberId')
  findByMember(
    @Param('memberId') memberId: string,
    @Req() req: any,
  ) {
    const userId = this.getUserId(req);

    return this.attendanceService.findByMember(
      Number(memberId),
      userId,
    );
  }

  private getUserId(req: any) {
    const userId = req.user?.userId || req.user?.sub || req.user?.id;

    if (!userId) {
      throw new UnauthorizedException('Usuario no identificado');
    }

    return userId;
  }
}
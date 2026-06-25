import {Body,Controller,Get,Param,Patch,Post,} from '@nestjs/common';
import { MembershipsService } from './memberships.service';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('memberships')
export class MembershipsController {
  constructor(
    private readonly membershipsService: MembershipsService,
  ) {}

  @Post()
  create(
    @Body()
    body: {
      memberId: number;
      type: string;
      startDate: string;
      endDate: string;
      price?: number;
    },
  ) {
    return this.membershipsService.create(body);
  }

  @Get()
  findAll() {
    return this.membershipsService.findAll();
  }

  @Get('member/:memberId')
  findByMember(@Param('memberId') memberId: string) {
    return this.membershipsService.findByMember(Number(memberId));
  }
  @Patch('expire/check')
  expireExpiredMemberships() {
    return this.membershipsService.expireExpiredMemberships();
  }

  @Patch(':id/cancel')
  cancel(@Param('id') id: string) {
    return this.membershipsService.cancel(Number(id));
  }
}
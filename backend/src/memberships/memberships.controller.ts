import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';

import { MembershipsService } from './memberships.service';
import { CreateMembershipDto } from './dto/create-membership.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('memberships')
export class MembershipsController {
  constructor(
    private readonly membershipsService: MembershipsService,
  ) {}

  @Post()
  create(@Body() body: CreateMembershipDto) {
    return this.membershipsService.create(body);
  }

  @Post('renew')
  renew(@Body() body: CreateMembershipDto) {
    return this.membershipsService.renew(body);
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
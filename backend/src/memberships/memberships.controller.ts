import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UnauthorizedException,
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
  create(@Body() body: CreateMembershipDto, @Req() req: any) {
    const userId = this.getUserId(req);
    return this.membershipsService.create(body, userId);
  }

  @Post('renew')
  renew(@Body() body: CreateMembershipDto, @Req() req: any) {
    const userId = this.getUserId(req);
    return this.membershipsService.renew(body, userId);
  }

  @Get()
  findAll(@Req() req: any) {
    const userId = this.getUserId(req);
    return this.membershipsService.findAll(userId);
  }

  @Get('member/:memberId')
  findByMember(
    @Param('memberId') memberId: string,
    @Req() req: any,
  ) {
    const userId = this.getUserId(req);

    return this.membershipsService.findByMember(
      Number(memberId),
      userId,
    );
  }

  @Patch('expire/check')
  expireExpiredMemberships(@Req() req: any) {
    const userId = this.getUserId(req);
    return this.membershipsService.expireExpiredMemberships(userId);
  }

  @Patch(':id/cancel')
  cancel(@Param('id') id: string, @Req() req: any) {
    const userId = this.getUserId(req);
    return this.membershipsService.cancel(Number(id), userId);
  }

  private getUserId(req: any) {
    const userId = req.user?.userId || req.user?.sub || req.user?.id;

    if (!userId) {
      throw new UnauthorizedException('Usuario no identificado');
    }

    return userId;
  }
}
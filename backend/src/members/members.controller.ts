import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';

import { MembersService } from './members.service';
import { CreateMemberDto } from './dto/create-member.dto';
import { UpdateMemberDto } from './dto/update-member.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('members')
export class MembersController {
  constructor(private readonly membersService: MembersService) {}

  @Post()
  create(@Body() body: CreateMemberDto, @Req() req: any) {
    const userId = this.getUserId(req);
    return this.membersService.create(body, userId);
  }

  @Get()
  findAll(@Req() req: any) {
    const userId = this.getUserId(req);
    return this.membersService.findAll(userId);
  }

  @Get(':id')
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: any,
  ) {
    const userId = this.getUserId(req);
    return this.membersService.findOne(id, userId);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateMemberDto,
    @Req() req: any,
  ) {
    const userId = this.getUserId(req);
    return this.membersService.update(id, body, userId);
  }

  @Patch(':id/suspend')
  suspend(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: any,
  ) {
    const userId = this.getUserId(req);
    return this.membersService.suspend(id, userId);
  }

  @Patch(':id/reactivate')
  reactivate(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: any,
  ) {
    const userId = this.getUserId(req);
    return this.membersService.reactivate(id, userId);
  }

  private getUserId(req: any) {
  const userId = req.user?.userId || req.user?.sub || req.user?.id;

  if (!userId) {
    throw new UnauthorizedException('Usuario no identificado');
  }

  return userId;
}
}
import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';

import { MembersService } from './members.service';
import { CreateMemberDto } from './dto/create-member.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('members')
export class MembersController {
  constructor(private readonly membersService: MembersService) {}

  @Post()
  create(@Body() body: CreateMemberDto) {
    return this.membersService.create(body);
  }

  @Get()
  findAll() {
    return this.membersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.membersService.findOne(Number(id));
  }
}
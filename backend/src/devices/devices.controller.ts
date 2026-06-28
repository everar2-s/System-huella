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

import { DevicesService } from './devices.service';
import { CreateDeviceDto } from './dto/create-device.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('devices')
export class DevicesController {
  constructor(private readonly devicesService: DevicesService) {}

  @Post()
  create(@Body() body: CreateDeviceDto, @Req() req: any) {
    const userId = this.getUserId(req);
    return this.devicesService.create(body, userId);
  }

  @Get()
  findAll(@Req() req: any) {
    const userId = this.getUserId(req);
    return this.devicesService.findAll(userId);
  }

  @Get(':id')
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: any,
  ) {
    const userId = this.getUserId(req);
    return this.devicesService.findOne(id, userId);
  }

  @Patch(':id/deactivate')
  deactivate(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: any,
  ) {
    const userId = this.getUserId(req);
    return this.devicesService.deactivate(id, userId);
  }

  private getUserId(req: any) {
    const userId = req.user?.userId || req.user?.sub || req.user?.id;

    if (!userId) {
      throw new UnauthorizedException('Usuario no identificado');
    }

    return userId;
  }
}
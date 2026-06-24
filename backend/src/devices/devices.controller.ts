import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { DevicesService } from './devices.service';

@Controller('devices')
export class DevicesController {
  constructor(private readonly devicesService: DevicesService) {}

  @Post()
  create(
    @Body()
    body: {
      deviceId: string;
      name: string;
      location?: string;
      apiKey: string;
    },
  ) {
    return this.devicesService.create(body);
  }

  @Get()
  findAll() {
    return this.devicesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.devicesService.findOne(Number(id));
  }

  @Patch(':id/deactivate')
  deactivate(@Param('id') id: string) {
    return this.devicesService.deactivate(Number(id));
  }
}
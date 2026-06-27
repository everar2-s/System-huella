import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';

import { FingerprintsService } from './fingerprints.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('fingerprints')
export class FingerprintsController {
  constructor(
    private readonly fingerprintsService: FingerprintsService,
  ) {}

  @Post('enroll')
  enrollFromDevice(
    @Headers('x-api-key') apiKey: string,
    @Body()
    body: {
      memberId: number;
      fingerprintId: number;
      fingerName: string;
      deviceId: string;
    },
  ) {
    return this.fingerprintsService.enrollFromDevice({
      ...body,
      apiKey,
    });
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  create(
    @Body()
    body: {
      memberId: number;
      fingerprintId: number;
      fingerName: string;
    },
  ) {
    return this.fingerprintsService.create(body);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll() {
    return this.fingerprintsService.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.fingerprintsService.findOne(Number(id));
  }

  @Post('verify')
  verify(
    @Body()
    body: {
      fingerprintId: number;
    },
  ) {
    return this.fingerprintsService.verify(body.fingerprintId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.fingerprintsService.remove(Number(id));
  }
}
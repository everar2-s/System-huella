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

import { CreateFingerprintDto } from './dto/create-fingerprint.dto';
import { EnrollFingerprintDto } from './dto/enroll-fingerprint.dto';
import { VerifyFingerprintDto } from './dto/verify-fingerprint.dto';

@Controller('fingerprints')
export class FingerprintsController {
  constructor(
    private readonly fingerprintsService: FingerprintsService,
  ) {}

  @Post('enroll')
  enrollFromDevice(
    @Headers('x-api-key') apiKey: string,
    @Body() body: EnrollFingerprintDto,
  ) {
    return this.fingerprintsService.enrollFromDevice({
      ...body,
      apiKey,
    });
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() body: CreateFingerprintDto) {
    return this.fingerprintsService.create(body);
  }

  @Post('verify')
  verify(@Body() body: VerifyFingerprintDto) {
    return this.fingerprintsService.verify(body.fingerprintId);
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

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.fingerprintsService.remove(Number(id));
  }
}
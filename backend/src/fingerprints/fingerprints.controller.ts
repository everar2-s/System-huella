import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  Post,
  Req,
  UnauthorizedException,
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
  create(@Body() body: CreateFingerprintDto, @Req() req: any) {
    const userId = this.getUserId(req);
    return this.fingerprintsService.create(body, userId);
  }
  @Post('verify')
verify(
  @Headers('x-api-key') apiKey: string,
  @Body() body: VerifyFingerprintDto,
) {
  return this.fingerprintsService.verify({
    fingerprintId: body.fingerprintId,
    deviceId: body.deviceId,
    apiKey,
  });
}

 

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(@Req() req: any) {
    const userId = this.getUserId(req);
    return this.fingerprintsService.findAll(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: any) {
    const userId = this.getUserId(req);
    return this.fingerprintsService.findOne(Number(id), userId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: any) {
    const userId = this.getUserId(req);
    return this.fingerprintsService.remove(Number(id), userId);
  }

  private getUserId(req: any) {
    const userId = req.user?.userId || req.user?.sub || req.user?.id;

    if (!userId) {
      throw new UnauthorizedException('Usuario no identificado');
    }

    return userId;
  }
}
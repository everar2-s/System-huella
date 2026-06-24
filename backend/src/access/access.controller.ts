import { Body, Controller, Headers, Post } from '@nestjs/common';
import { AccessService } from './access.service';

@Controller('access')
export class AccessController {
  constructor(private readonly accessService: AccessService) {}

  @Post('checkin')
  checkIn(
    @Headers('x-api-key') apiKey: string,
    @Body()
    body: {
      fingerprintId: number;
      deviceId?: string;
    },
  ) {
    return this.accessService.checkIn({
      ...body,
      apiKey,
    });
  }

  @Post('checkout')
  checkOut(
    @Headers('x-api-key') apiKey: string,
    @Body()
    body: {
      fingerprintId: number;
      deviceId?: string;
    },
  ) {
    return this.accessService.checkOut({
      ...body,
      apiKey,
    });
  }
}
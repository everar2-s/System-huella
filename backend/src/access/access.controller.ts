import { Body, Controller, Post } from '@nestjs/common';
import { AccessService } from './access.service';

@Controller('access')
export class AccessController {
  constructor(private readonly accessService: AccessService) {}

  @Post('checkin')
  checkIn(
    @Body()
    body: {
      fingerprintId: number;
      deviceId?: string;
    },
  ) {
    return this.accessService.checkIn(body);
  }
  @Post('checkout')
checkOut(
  @Body()
  body: {
    fingerprintId: number;
    deviceId?: string;
  },
) {
  return this.accessService.checkOut(body);
}
}
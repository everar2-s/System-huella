import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
} from '@nestjs/common';

import { FingerprintsService } from './fingerprints.service';

@Controller('fingerprints')
export class FingerprintsController {
  constructor(
    private readonly fingerprintsService: FingerprintsService,
  ) {}

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

  @Get()
  findAll() {
    return this.fingerprintsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.fingerprintsService.findOne(+id);
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

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.fingerprintsService.remove(+id);
  }
}
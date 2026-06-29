import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import type { Response } from 'express';

import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}
  @UseGuards(ThrottlerGuard)
@Throttle({
  default: {
    limit: 3,
    ttl: 60000,
  },
})
  @Post('register')
  register(
    @Body()
    body: {
      fullName: string;
      email: string;
      password: string;
    },
  ) {
    return this.authService.register(body);
  }

  @UseGuards(ThrottlerGuard)
  @Throttle({
    default: {
      limit: 5,
      ttl: 60000,
    },
  })
  @Post('login')
  login(
    @Body()
    body: {
      email: string;
      password: string;
    },
  ) {
    return this.authService.login(body);
  }

  @Get('verify-email')
  async verifyEmail(
    @Query('token') token: string,
    @Res() res: Response,
  ) {
    const frontendUrl =
      process.env.FRONTEND_URL || 'http://localhost:4200';

    try {
      await this.authService.verifyEmail(token);

      return res.redirect(
        `${frontendUrl}/login?verified=true`,
      );
    } catch {
      return res.redirect(
        `${frontendUrl}/login?verified=false`,
      );
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  profile(@Req() req: any) {
    return {
      message: 'Usuario autenticado',
      user: req.user,
    };
  }
}
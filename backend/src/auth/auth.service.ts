import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

import { User } from './user.entity';
import { MailService } from '../mail/mail.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    private readonly jwtService: JwtService,

    private readonly mailService: MailService,
  ) {}

  async register(data: {
    fullName: string;
    email: string;
    password: string;
  }) {
    const fullName = data.fullName?.trim();
    const email = data.email?.trim().toLowerCase();
    const password = data.password;

    if (!fullName) {
      throw new BadRequestException('El nombre completo es obligatorio');
    }

    if (!email) {
      throw new BadRequestException('El correo es obligatorio');
    }

    if (!password || password.length < 6) {
      throw new ForbiddenException(
        'La contraseña debe tener al menos 6 caracteres',
      );
    }

    const existingUser = await this.userRepository.findOne({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException(
        'Ya existe un usuario con ese email',
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const verificationToken = crypto.randomBytes(32).toString('hex');

    const verificationExpires = new Date();
    verificationExpires.setHours(verificationExpires.getHours() + 24);

    const user = this.userRepository.create({
      fullName,
      email,
      passwordHash,
      role: 'admin',
      active: true,
      emailVerified: false,
      emailVerificationToken: verificationToken,
      emailVerificationExpires: verificationExpires,
    });

    const savedUser = await this.userRepository.save(user);

    await this.mailService.sendVerificationEmail(
      savedUser.email,
      verificationToken,
    );

    return {
      message:
        'Usuario registrado correctamente. Revisa tu correo para verificar tu cuenta.',
      user: {
        id: savedUser.id,
        fullName: savedUser.fullName,
        email: savedUser.email,
        role: savedUser.role,
        active: savedUser.active,
        emailVerified: savedUser.emailVerified,
      },
    };
  }

  async verifyEmail(token: string) {
    if (!token) {
      throw new BadRequestException('Token de verificación requerido');
    }

    const user = await this.userRepository.findOne({
      where: {
        emailVerificationToken: token,
      },
    });

    if (!user) {
      throw new NotFoundException('Token de verificación inválido');
    }

    if (
      user.emailVerificationExpires &&
      user.emailVerificationExpires < new Date()
    ) {
      throw new BadRequestException(
        'El enlace de verificación expiró. Regístrate nuevamente.',
      );
    }

    user.emailVerified = true;
    user.emailVerificationToken = null;
    user.emailVerificationExpires = null;

    await this.userRepository.save(user);

    return {
      message: 'Correo verificado correctamente. Ya puedes iniciar sesión.',
    };
  }

  async login(data: { email: string; password: string }) {
    const email = data.email?.trim().toLowerCase();

    const user = await this.userRepository.findOne({
      where: { email },
      select: {
        id: true,
        fullName: true,
        email: true,
        passwordHash: true,
        role: true,
        active: true,
        emailVerified: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    if (!user.active) {
      throw new ForbiddenException('Usuario inactivo');
    }

    const passwordValid = await bcrypt.compare(
      data.password,
      user.passwordHash,
    );

    if (!passwordValid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    if (!user.emailVerified) {
      throw new ForbiddenException(
        'Debes verificar tu correo antes de iniciar sesión',
      );
    }

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = await this.jwtService.signAsync(payload);

    return {
      accessToken,
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
      },
    };
  }
}
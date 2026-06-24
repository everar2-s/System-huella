import {
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

import { User } from './user.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    private readonly jwtService: JwtService,
  ) {}

  async register(data: {
    fullName: string;
    email: string;
    password: string;
  }) {
    const existingUser = await this.userRepository.findOne({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new ConflictException(
        'Ya existe un usuario con ese email',
      );
    }

    if (!data.password || data.password.length < 6) {
      throw new ForbiddenException(
        'La contraseña debe tener al menos 6 caracteres',
      );
    }

    const passwordHash = await bcrypt.hash(data.password, 10);

    const user = this.userRepository.create({
      fullName: data.fullName,
      email: data.email,
      passwordHash,
      role: 'admin',
      active: true,
    });

    const savedUser = await this.userRepository.save(user);

    return {
      message: 'Usuario registrado correctamente',
      user: {
        id: savedUser.id,
        fullName: savedUser.fullName,
        email: savedUser.email,
        role: savedUser.role,
        active: savedUser.active,
      },
    };
  }

  async login(data: { email: string; password: string }) {
    const user = await this.userRepository.findOne({
      where: { email: data.email },
      select: {
        id: true,
        fullName: true,
        email: true,
        passwordHash: true,
        role: true,
        active: true,
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
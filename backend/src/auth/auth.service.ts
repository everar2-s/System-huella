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
import { PendingUser } from './pending-user.entity';
import { MailService } from '../mail/mail.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @InjectRepository(PendingUser)
    private readonly pendingUserRepository: Repository<PendingUser>,

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

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      throw new BadRequestException('Ingresa un correo electrónico válido');
    }

    const strongPasswordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&.#_-])[A-Za-z\d@$!%*?&.#_-]{8,}$/;

    if (!password || !strongPasswordRegex.test(password)) {
      throw new ForbiddenException(
        'La contraseña debe tener mínimo 8 caracteres, una mayúscula, una minúscula, un número y un símbolo',
      );
    }

    const existingUser = await this.userRepository.findOne({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('Ya existe un usuario con ese email');
    }

    const existingPendingUser = await this.pendingUserRepository.findOne({
      where: { email },
    });

    if (existingPendingUser) {
      await this.pendingUserRepository.delete(existingPendingUser.id);
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const verificationToken = crypto.randomBytes(32).toString('hex');

    const verificationExpires = new Date();
    verificationExpires.setHours(verificationExpires.getHours() + 24);

    const pendingUser = this.pendingUserRepository.create({
      fullName,
      email,
      passwordHash,
      role: 'admin',
      verificationToken,
      verificationExpires,
    });

    await this.pendingUserRepository.save(pendingUser);

    await this.mailService.sendVerificationEmail(email, verificationToken);

    return {
      message:
        'Revisa tu correo para confirmar tu cuenta. El usuario se creará hasta que verifiques tu email.',
    };
  }

  async verifyEmail(token: string) {
    if (!token) {
      throw new BadRequestException('Token de verificación requerido');
    }

    const pendingUser = await this.pendingUserRepository.findOne({
      where: {
        verificationToken: token,
      },
    });

    if (!pendingUser) {
      throw new NotFoundException('Token de verificación inválido');
    }

    if (pendingUser.verificationExpires < new Date()) {
      await this.pendingUserRepository.delete(pendingUser.id);

      throw new BadRequestException(
        'El enlace de verificación expiró. Regístrate nuevamente.',
      );
    }

    const existingUser = await this.userRepository.findOne({
      where: { email: pendingUser.email },
    });

    if (existingUser) {
      await this.pendingUserRepository.delete(pendingUser.id);

      throw new ConflictException(
        'Ya existe un usuario registrado con ese email',
      );
    }

    const user = this.userRepository.create({
      fullName: pendingUser.fullName,
      email: pendingUser.email,
      passwordHash: pendingUser.passwordHash,
      role: pendingUser.role,
      active: true,
      emailVerified: true,
      emailVerificationToken: null,
      emailVerificationExpires: null,
    });

    const savedUser = await this.userRepository.save(user);

    await this.pendingUserRepository.delete(pendingUser.id);

    return {
      message: 'Correo verificado correctamente. Tu cuenta ha sido creada.',
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

  async login(data: { email: string; password: string }) {
    const email = data.email?.trim().toLowerCase();

    if (!email || !data.password) {
      throw new BadRequestException('Correo y contraseña son obligatorios');
    }

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
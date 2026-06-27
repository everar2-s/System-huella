import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Member } from './member.entity';
import { CreateMemberDto } from './dto/create-member.dto';

@Injectable()
export class MembersService {
  constructor(
    @InjectRepository(Member)
    private readonly memberRepository: Repository<Member>,
  ) {}

  async create(data: CreateMemberDto) {
    const fullName = data.fullName?.trim();

    if (!fullName) {
      throw new BadRequestException(
        'El nombre completo es obligatorio',
      );
    }

    const email = data.email?.trim().toLowerCase() || undefined;
    const phone = data.phone?.trim() || undefined;

    if (email) {
      const existingEmail = await this.memberRepository.findOne({
        where: { email },
      });

      if (existingEmail) {
        throw new ConflictException(
          'Ya existe un socio registrado con ese email',
        );
      }
    }

    if (phone) {
      const existingPhone = await this.memberRepository.findOne({
        where: { phone },
      });

      if (existingPhone) {
        throw new ConflictException(
          'Ya existe un socio registrado con ese teléfono',
        );
      }
    }

    const today = new Date().toISOString().slice(0, 10);

    const end = new Date();
    end.setMonth(end.getMonth() + 1);

    const member = this.memberRepository.create({
      fullName: fullName,
      phone: phone,
      email: email,
      status: 'pendiente_huella',
      membershipStart: data.membershipStart || today,
      membershipEnd:
        data.membershipEnd || end.toISOString().slice(0, 10),
    });

    return this.memberRepository.save(member);
  }

  findAll() {
    return this.memberRepository.find({
      order: {
        id: 'DESC',
      },
    });
  }

  async findOne(id: number) {
    const member = await this.memberRepository.findOne({
      where: { id },
    });

    if (!member) {
      throw new NotFoundException('Socio no encontrado');
    }

    return member;
  }
}
import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Member } from './member.entity';

@Injectable()
export class MembersService {
  constructor(
    @InjectRepository(Member)
    private readonly memberRepository: Repository<Member>,
  ) {}

 async create(data: Partial<Member>) {
  if (data.email) {
    const existingEmail = await this.memberRepository.findOne({
      where: { email: data.email },
    });

    if (existingEmail) {
      throw new ConflictException(
        'Ya existe un socio registrado con ese email',
      );
    }
  }

  if (data.phone) {
    const existingPhone = await this.memberRepository.findOne({
      where: { phone: data.phone },
    });

    if (existingPhone) {
      throw new ConflictException(
        'Ya existe un socio registrado con ese teléfono',
      );
    }
  }

  const member = this.memberRepository.create(data);
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
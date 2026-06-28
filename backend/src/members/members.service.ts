import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';

import { Member } from './member.entity';
import { Fingerprint } from '../fingerprints/fingerprint.entity';
import { CreateMemberDto } from './dto/create-member.dto';
import { UpdateMemberDto } from './dto/update-member.dto';

@Injectable()
export class MembersService {
  constructor(
    @InjectRepository(Member)
    private readonly memberRepository: Repository<Member>,

    @InjectRepository(Fingerprint)
    private readonly fingerprintRepository: Repository<Fingerprint>,
  ) {}

  async create(data: CreateMemberDto, userId: number) {
    if (!userId) {
      throw new BadRequestException('Usuario no identificado');
    }

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
        where: {
          email,
          createdById: userId,
        },
      });

      if (existingEmail) {
        throw new ConflictException(
          'Ya tienes un socio registrado con ese email',
        );
      }
    }

    if (phone) {
      const existingPhone = await this.memberRepository.findOne({
        where: {
          phone,
          createdById: userId,
        },
      });

      if (existingPhone) {
        throw new ConflictException(
          'Ya tienes un socio registrado con ese teléfono',
        );
      }
    }

    const today = new Date().toISOString().slice(0, 10);

    const end = new Date();
    end.setMonth(end.getMonth() + 1);

    const member = this.memberRepository.create({
      fullName,
      phone,
      email,
      status: 'pendiente_huella',
      membershipStart: data.membershipStart || today,
      membershipEnd:
        data.membershipEnd || end.toISOString().slice(0, 10),
      createdById: userId,
    });

    return this.memberRepository.save(member);
  }

  findAll(userId: number) {
    return this.memberRepository.find({
      where: {
        createdById: userId,
      },
      order: {
        id: 'ASC',
      },
    });
  }

  async findOne(id: number, userId: number) {
    const member = await this.memberRepository.findOne({
      where: {
        id,
        createdById: userId,
      },
    });

    if (!member) {
      throw new NotFoundException('Socio no encontrado');
    }

    return member;
  }

  async update(id: number, data: UpdateMemberDto, userId: number) {
    const member = await this.findOne(id, userId);

    const fullName = data.fullName?.trim();
    const phone = data.phone?.trim();
    const email = data.email?.trim().toLowerCase();

    if (data.fullName !== undefined && !fullName) {
      throw new BadRequestException(
        'El nombre completo no puede estar vacío',
      );
    }

    if (email) {
      const existingEmail = await this.memberRepository.findOne({
        where: {
          email,
          createdById: userId,
          id: Not(id),
        },
      });

      if (existingEmail) {
        throw new ConflictException(
          'Ya tienes otro socio con ese email',
        );
      }
    }

    if (phone) {
      const existingPhone = await this.memberRepository.findOne({
        where: {
          phone,
          createdById: userId,
          id: Not(id),
        },
      });

      if (existingPhone) {
        throw new ConflictException(
          'Ya tienes otro socio con ese teléfono',
        );
      }
    }

    if (fullName !== undefined) {
      member.fullName = fullName;
    }

    if (phone !== undefined) {
      member.phone = phone;
    }

    if (email !== undefined) {
      member.email = email;
    }

    const savedMember = await this.memberRepository.save(member);

    return {
      message: 'Socio actualizado correctamente',
      member: savedMember,
    };
  }

  async suspend(id: number, userId: number) {
    const member = await this.findOne(id, userId);

    member.status = 'suspendido';
    await this.memberRepository.save(member);

    await this.fingerprintRepository.update(
      {
        memberId: member.id,
      },
      {
        active: false,
      },
    );

    return {
      message: 'Socio suspendido correctamente',
      member: {
        id: member.id,
        fullName: member.fullName,
        status: member.status,
      },
    };
  }

  async reactivate(id: number, userId: number) {
    const member = await this.findOne(id, userId);

    const today = new Date().toISOString().slice(0, 10);

    if (member.membershipEnd < today) {
      member.status = 'vencido';
      await this.memberRepository.save(member);

      await this.fingerprintRepository.update(
        {
          memberId: member.id,
        },
        {
          active: false,
        },
      );

      throw new BadRequestException(
        'No se puede reactivar. La membresía está vencida',
      );
    }

    const fingerprint = await this.fingerprintRepository.findOne({
      where: {
        memberId: member.id,
      },
    });

    if (!fingerprint) {
      member.status = 'pendiente_huella';
      await this.memberRepository.save(member);

      return {
        message:
          'Socio reactivado parcialmente. Falta registrar huella',
        member: {
          id: member.id,
          fullName: member.fullName,
          status: member.status,
        },
      };
    }

    fingerprint.active = true;
    await this.fingerprintRepository.save(fingerprint);

    member.status = 'activo';
    await this.memberRepository.save(member);

    return {
      message: 'Socio reactivado correctamente',
      member: {
        id: member.id,
        fullName: member.fullName,
        status: member.status,
      },
    };
  }
}
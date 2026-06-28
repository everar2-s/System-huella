import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, LessThan, Repository } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';

import { Membership } from './membership.entity';
import { Member } from '../members/member.entity';
import { Fingerprint } from '../fingerprints/fingerprint.entity';
import { CreateMembershipDto } from './dto/create-membership.dto';

@Injectable()
export class MembershipsService {
  constructor(
    @InjectRepository(Membership)
    private readonly membershipRepository: Repository<Membership>,

    @InjectRepository(Member)
    private readonly memberRepository: Repository<Member>,

    @InjectRepository(Fingerprint)
    private readonly fingerprintRepository: Repository<Fingerprint>,
  ) {}

  async create(data: CreateMembershipDto, userId: number) {
    this.validateUser(userId);
    this.validateDates(data.startDate, data.endDate);

    const member = await this.memberRepository.findOne({
      where: {
        id: data.memberId,
        createdById: userId,
      },
    });

    if (!member) {
      throw new NotFoundException('El socio no existe');
    }

    const currentMembership = await this.membershipRepository.findOne({
      where: {
        memberId: data.memberId,
        createdById: userId,
        status: In(['activa', 'suspendida']),
      },
    });

    if (currentMembership) {
      throw new ConflictException(
        'Este socio ya tiene una membresía activa o suspendida. Usa renovar.',
      );
    }

    return this.createActiveMembership(member, data, userId);
  }

  async renew(data: CreateMembershipDto, userId: number) {
    this.validateUser(userId);
    this.validateDates(data.startDate, data.endDate);

    const member = await this.memberRepository.findOne({
      where: {
        id: data.memberId,
        createdById: userId,
      },
    });

    if (!member) {
      throw new NotFoundException('El socio no existe');
    }

    const currentMemberships = await this.membershipRepository.find({
      where: {
        memberId: data.memberId,
        createdById: userId,
        status: In(['activa', 'suspendida']),
      },
    });

    if (!currentMemberships.length) {
      throw new NotFoundException(
        'Este socio no tiene una membresía activa o suspendida para renovar',
      );
    }

    for (const membership of currentMemberships) {
      membership.status = 'cancelada';
      await this.membershipRepository.save(membership);
    }

    const newMembership = await this.createActiveMembership(
      member,
      data,
      userId,
    );

    return {
      message: 'Membresía renovada correctamente',
      previousMembershipsCancelled: currentMemberships.length,
      membership: newMembership,
    };
  }

  async findAll(userId: number) {
    this.validateUser(userId);

    await this.expireExpiredMemberships(userId);

    return this.membershipRepository.find({
      where: {
        createdById: userId,
      },
      relations: {
        member: true,
      },
      order: {
        id: 'ASC',
      },
    });
  }

  async findByMember(memberId: number, userId: number) {
    this.validateUser(userId);

    const member = await this.memberRepository.findOne({
      where: {
        id: memberId,
        createdById: userId,
      },
    });

    if (!member) {
      throw new NotFoundException('El socio no existe');
    }

    return this.membershipRepository.find({
      where: {
        memberId,
        createdById: userId,
      },
      relations: {
        member: true,
      },
      order: {
        id: 'DESC',
      },
    });
  }

  async cancel(id: number, userId: number) {
    this.validateUser(userId);

    const membership = await this.membershipRepository.findOne({
      where: {
        id,
        createdById: userId,
      },
      relations: {
        member: true,
      },
    });

    if (!membership) {
      throw new NotFoundException('Membresía no encontrada');
    }

    membership.status = 'cancelada';
    await this.membershipRepository.save(membership);

    if (membership.member) {
      membership.member.status = 'inactivo';
      await this.memberRepository.save(membership.member);

      await this.fingerprintRepository.update(
        { memberId: membership.member.id },
        { active: false },
      );
    }

    return {
      message: 'Membresía cancelada correctamente',
      membership,
    };
  }

  async expireExpiredMemberships(userId?: number) {
    const today = new Date().toISOString().split('T')[0];

    const where: any = {
      status: 'activa',
      endDate: LessThan(today),
    };

    if (userId) {
      where.createdById = userId;
    }

    const expiredMemberships = await this.membershipRepository.find({
      where,
      relations: {
        member: true,
      },
    });

    for (const membership of expiredMemberships) {
      membership.status = 'suspendida';
      await this.membershipRepository.save(membership);

      if (membership.member) {
        membership.member.status = 'suspendido';
        await this.memberRepository.save(membership.member);

        await this.fingerprintRepository.update(
          { memberId: membership.member.id },
          { active: false },
        );
      }
    }

    return {
      message: 'Membresías suspendidas por vencimiento actualizadas',
      total: expiredMemberships.length,
    };
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleExpiredMemberships() {
    await this.expireExpiredMemberships();
  }

  private validateUser(userId: number) {
    if (!userId) {
      throw new BadRequestException('Usuario no identificado');
    }
  }

  private validateDates(startDate: string, endDate: string) {
    if (endDate < startDate) {
      throw new BadRequestException(
        'La fecha de fin no puede ser menor que la fecha de inicio',
      );
    }
  }

  private async createActiveMembership(
    member: Member,
    data: CreateMembershipDto,
    userId: number,
  ) {
    const hasFingerprint = await this.fingerprintRepository.findOne({
      where: {
        memberId: member.id,
      },
    });

    const membership = this.membershipRepository.create({
      memberId: data.memberId,
      type: data.type,
      startDate: data.startDate,
      endDate: data.endDate,
      price: data.price ?? 0,
      status: 'activa',
      member,
      createdById: userId,
    });

    const savedMembership =
      await this.membershipRepository.save(membership);

    member.membershipStart = data.startDate;
    member.membershipEnd = data.endDate;

    if (hasFingerprint) {
      member.status = 'activo';

      await this.fingerprintRepository.update(
        { memberId: member.id },
        { active: true },
      );
    } else {
      member.status = 'pendiente_huella';
    }

    await this.memberRepository.save(member);

    return savedMembership;
  }
}
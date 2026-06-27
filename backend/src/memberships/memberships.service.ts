import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';
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

  async create(data: CreateMembershipDto) {
    const startDate = data.startDate;
    const endDate = data.endDate;

    if (endDate < startDate) {
      throw new BadRequestException(
        'La fecha de fin no puede ser menor que la fecha de inicio',
      );
    }

    const member = await this.memberRepository.findOne({
      where: { id: data.memberId },
    });

    if (!member) {
      throw new NotFoundException('El socio no existe');
    }

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

  findAll() {
    return this.membershipRepository.find({
      relations: {
        member: true,
      },
      order: {
        id: 'DESC',
      },
    });
  }

  findByMember(memberId: number) {
    return this.membershipRepository.find({
      where: {
        memberId,
      },
      relations: {
        member: true,
      },
      order: {
        id: 'DESC',
      },
    });
  }

  async cancel(id: number) {
    const membership = await this.membershipRepository.findOne({
      where: { id },
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

  async expireExpiredMemberships() {
    const today = new Date().toISOString().split('T')[0];

    const expiredMemberships = await this.membershipRepository.find({
      where: {
        status: 'activa',
        endDate: LessThan(today),
      },
      relations: {
        member: true,
      },
    });

    for (const membership of expiredMemberships) {
      membership.status = 'vencida';
      await this.membershipRepository.save(membership);

      if (membership.member) {
        membership.member.status = 'vencido';
        await this.memberRepository.save(membership.member);

        await this.fingerprintRepository.update(
          { memberId: membership.member.id },
          { active: false },
        );
      }
    }

    return {
      message: 'Membresías vencidas actualizadas',
      total: expiredMemberships.length,
    };
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleExpiredMemberships() {
    await this.expireExpiredMemberships();
  }
}
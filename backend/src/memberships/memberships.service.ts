import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Membership } from './membership.entity';
import { Member } from '../members/member.entity';

@Injectable()
export class MembershipsService {
  constructor(
    @InjectRepository(Membership)
    private readonly membershipRepository: Repository<Membership>,

    @InjectRepository(Member)
    private readonly memberRepository: Repository<Member>,
  ) {}

  async create(data: {
    memberId: number;
    type: string;
    startDate: string;
    endDate: string;
    price?: number;
  }) {
    const member = await this.memberRepository.findOne({
      where: { id: data.memberId },
    });

    if (!member) {
      throw new NotFoundException('El socio no existe');
    }

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
    member.status = 'activo';

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

    return {
      message: 'Membresía cancelada correctamente',
      membership,
    };
  }
}
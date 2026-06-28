import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { AttendanceLog } from './attendance-log.entity';
import { Member } from '../members/member.entity';

@Injectable()
export class AttendanceService {
  constructor(
    @InjectRepository(AttendanceLog)
    private readonly attendanceRepository: Repository<AttendanceLog>,
  ) {}

  findLastSuccessfulByMember(memberId: number, userId: number) {
    this.validateUser(userId);

    return this.attendanceRepository.findOne({
      where: {
        memberId,
        createdById: userId,
        accessGranted: true,
      },
      order: {
        createdAt: 'DESC',
      },
    });
  }

  async create(
    data: {
      member?: Member;
      memberId?: number;
      fingerprintId?: number;
      deviceId?: string;
      type: string;
      accessGranted: boolean;
      message: string;
    },
    userId: number,
  ) {
    this.validateUser(userId);

    const log = new AttendanceLog();

    log.member = data.member;
    log.memberId = data.member?.id ?? data.memberId;
    log.fingerprintId = data.fingerprintId;
    log.deviceId = data.deviceId;
    log.type = data.type;
    log.accessGranted = data.accessGranted;
    log.message = data.message;
    log.createdById = userId;

    return this.attendanceRepository.save(log);
  }

  findAll(userId: number) {
    this.validateUser(userId);

    return this.attendanceRepository.find({
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

  findByMember(memberId: number, userId: number) {
    this.validateUser(userId);

    return this.attendanceRepository.find({
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

  private validateUser(userId: number) {
    if (!userId) {
      throw new BadRequestException('Usuario no identificado');
    }
  }
}
import { Injectable } from '@nestjs/common';
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

  async create(data: {
    member?: Member;
    memberId?: number;
    fingerprintId?: number;
    deviceId?: string;
    type: string;
    accessGranted: boolean;
    message: string;
  }) {
    const log = new AttendanceLog();

    log.member = data.member;
    log.memberId = data.member?.id ?? data.memberId;
    log.fingerprintId = data.fingerprintId;
    log.deviceId = data.deviceId;
    log.type = data.type;
    log.accessGranted = data.accessGranted;
    log.message = data.message;

    return this.attendanceRepository.save(log);
  }

  findAll() {
    return this.attendanceRepository.find({
      relations: {
        member: true,
      },
      order: {
        id: 'DESC',
      },
    });
  }

  findByMember(memberId: number) {
    return this.attendanceRepository.find({
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
}
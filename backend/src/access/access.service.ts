import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Fingerprint } from '../fingerprints/fingerprint.entity';
import { Member } from '../members/member.entity';
import { AttendanceService } from '../attendance/attendance.service';

@Injectable()
export class AccessService {
  constructor(
    @InjectRepository(Fingerprint)
    private readonly fingerprintRepository: Repository<Fingerprint>,

    @InjectRepository(Member)
    private readonly memberRepository: Repository<Member>,

  private readonly attendanceService: AttendanceService,
  ) {}

 async checkIn(data: { fingerprintId: number; deviceId?: string }) {
  const fingerprint = await this.fingerprintRepository.findOne({
    where: {
      fingerprintId: data.fingerprintId,
      active: true,
    },
    relations: {
      member: true,
    },
  });

  if (!fingerprint) {
    await this.attendanceService.create({
      fingerprintId: data.fingerprintId,
      deviceId: data.deviceId,
      type: 'entrada',
      accessGranted: false,
      message: 'Huella no registrada',
    });

    return {
      access: false,
      message: 'Huella no registrada',
    };
  }

  const member = fingerprint.member;

  if (!member) {
    await this.attendanceService.create({
      fingerprintId: data.fingerprintId,
      deviceId: data.deviceId,
      type: 'entrada',
      accessGranted: false,
      message: 'La huella no está vinculada a ningún socio',
    });

    return {
      access: false,
      message: 'La huella no está vinculada a ningún socio',
    };
  }

  if (member.status === 'suspendido') {
    await this.attendanceService.create({
      member,
      fingerprintId: data.fingerprintId,
      deviceId: data.deviceId,
      type: 'entrada',
      accessGranted: false,
      message: 'Socio suspendido',
    });

    return {
      access: false,
      message: 'Socio suspendido',
      member,
    };
  }

  if (member.status === 'inactivo') {
    await this.attendanceService.create({
      member,
      fingerprintId: data.fingerprintId,
      deviceId: data.deviceId,
      type: 'entrada',
      accessGranted: false,
      message: 'Socio inactivo',
    });

    return {
      access: false,
      message: 'Socio inactivo',
      member,
    };
  }

  const today = new Date().toISOString().split('T')[0];

  if (member.membershipEnd < today) {
    member.status = 'vencido';
    await this.memberRepository.save(member);

    await this.attendanceService.create({
      member,
      fingerprintId: data.fingerprintId,
      deviceId: data.deviceId,
      type: 'entrada',
      accessGranted: false,
      message: 'Membresía vencida',
    });

    return {
      access: false,
      message: 'Membresía vencida',
      member,
    };
  }

  member.status = 'activo';
  await this.memberRepository.save(member);

  await this.attendanceService.create({
    member,
    fingerprintId: data.fingerprintId,
    deviceId: data.deviceId,
    type: 'entrada',
    accessGranted: true,
    message: 'Acceso permitido',
  });

  return {
    access: true,
    message: 'Acceso permitido',
    member: {
      id: member.id,
      fullName: member.fullName,
      phone: member.phone,
      email: member.email,
      status: member.status,
      membershipStart: member.membershipStart,
      membershipEnd: member.membershipEnd,
    },
    deviceId: data.deviceId ?? null,
    type: 'entrada',
  };
}
  async checkOut(data: { fingerprintId: number; deviceId?: string }) {
  const fingerprint = await this.fingerprintRepository.findOne({
    where: {
      fingerprintId: data.fingerprintId,
      active: true,
    },
    relations: {
      member: true,
    },
  });

  if (!fingerprint) {
    await this.attendanceService.create({
      fingerprintId: data.fingerprintId,
      deviceId: data.deviceId,
      type: 'salida',
      accessGranted: false,
      message: 'Huella no registrada',
    });

    return {
      access: false,
      message: 'Huella no registrada',
    };
  }

  const member = fingerprint.member;

  await this.attendanceService.create({
    member,
    fingerprintId: data.fingerprintId,
    deviceId: data.deviceId,
    type: 'salida',
    accessGranted: true,
    message: 'Salida registrada',
  });

  return {
    access: true,
    message: 'Salida registrada',
    member: {
      id: member.id,
      fullName: member.fullName,
      status: member.status,
    },
    deviceId: data.deviceId ?? null,
    type: 'salida',
  };
}}
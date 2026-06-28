import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Fingerprint } from '../fingerprints/fingerprint.entity';
import { Member } from '../members/member.entity';
import { Membership } from '../memberships/membership.entity';
import { AttendanceService } from '../attendance/attendance.service';
import { DevicesService } from '../devices/devices.service';

@Injectable()
export class AccessService {
  constructor(
    @InjectRepository(Fingerprint)
    private readonly fingerprintRepository: Repository<Fingerprint>,

    @InjectRepository(Member)
    private readonly memberRepository: Repository<Member>,

    @InjectRepository(Membership)
    private readonly membershipRepository: Repository<Membership>,

    private readonly attendanceService: AttendanceService,

    private readonly devicesService: DevicesService,
  ) {}

  private async validateDevice(deviceId?: string, apiKey?: string) {
    if (!deviceId) {
      return {
        valid: false,
        message: 'deviceId es requerido',
      };
    }

    if (!apiKey) {
      return {
        valid: false,
        message: 'apiKey es requerida',
      };
    }

    const device = await this.devicesService.findByDeviceId(deviceId);

    if (!device) {
      return {
        valid: false,
        message: 'Dispositivo no registrado',
      };
    }

    if (device.status !== 'activo') {
      return {
        valid: false,
        message: 'Dispositivo inactivo',
      };
    }

    if (device.apiKey !== apiKey) {
      return {
        valid: false,
        message: 'apiKey inválida',
      };
    }

    return {
      valid: true,
      message: 'Dispositivo autorizado',
    };
  }

  private async validateMembershipForAccess(member: Member) {
    const today = new Date().toISOString().split('T')[0];

    const activeMembership = await this.membershipRepository.findOne({
      where: {
        memberId: member.id,
        status: 'activa',
      },
      order: {
        id: 'DESC',
      },
    });

    if (activeMembership === null) {
      const suspendedMembership = await this.membershipRepository.findOne({
        where: {
          memberId: member.id,
          status: 'suspendida',
        },
        order: {
          id: 'DESC',
        },
      });

      if (suspendedMembership) {
        member.status = 'suspendido';
        await this.memberRepository.save(member);
      }

      return {
        valid: false,
        message: 'Necesitas renovar tu membresía para acceder',
      };
    }

    const membershipEndDate = activeMembership.endDate;

    if (membershipEndDate < today) {
      activeMembership.status = 'suspendida';
      await this.membershipRepository.save(activeMembership);

      member.status = 'suspendido';
      await this.memberRepository.save(member);

      return {
        valid: false,
        message: 'Necesitas renovar tu membresía para acceder',
      };
    }

    return {
      valid: true,
      message: 'Membresía vigente',
    };
  }

  async checkIn(data: {
    fingerprintId: number;
    deviceId?: string;
    apiKey?: string;
  }) {
    const deviceValidation = await this.validateDevice(
      data.deviceId,
      data.apiKey,
    );

    if (!deviceValidation.valid) {
      await this.attendanceService.create({
        fingerprintId: data.fingerprintId,
        deviceId: data.deviceId,
        type: 'entrada',
        accessGranted: false,
        message: deviceValidation.message,
      });

      return {
        access: false,
        message: deviceValidation.message,
      };
    }

    const fingerprint = await this.fingerprintRepository.findOne({
      where: {
        fingerprintId: data.fingerprintId,
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

    const membershipValidation =
      await this.validateMembershipForAccess(member);

    if (!membershipValidation.valid) {
      await this.attendanceService.create({
        member,
        fingerprintId: data.fingerprintId,
        deviceId: data.deviceId,
        type: 'entrada',
        accessGranted: false,
        message: membershipValidation.message,
      });

      return {
        access: false,
        message: membershipValidation.message,
        member: {
          id: member.id,
          fullName: member.fullName,
          status: member.status,
          membershipStart: member.membershipStart,
          membershipEnd: member.membershipEnd,
        },
        deviceId: data.deviceId ?? null,
        type: 'entrada',
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

    if (!fingerprint.active) {
      await this.attendanceService.create({
        member,
        fingerprintId: data.fingerprintId,
        deviceId: data.deviceId,
        type: 'entrada',
        accessGranted: false,
        message: 'Huella inactiva',
      });

      return {
        access: false,
        message: 'Huella inactiva',
      };
    }

    const lastLog =
      await this.attendanceService.findLastSuccessfulByMember(member.id);

    if (lastLog && lastLog.type === 'entrada') {
      await this.attendanceService.create({
        member,
        fingerprintId: data.fingerprintId,
        deviceId: data.deviceId,
        type: 'entrada',
        accessGranted: false,
        message: 'Ya tienes una entrada activa',
      });

      return {
        access: false,
        message: 'Ya tienes una entrada activa',
        member: {
          id: member.id,
          fullName: member.fullName,
          status: member.status,
        },
        deviceId: data.deviceId ?? null,
        type: 'entrada',
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

  async checkOut(data: {
    fingerprintId: number;
    deviceId?: string;
    apiKey?: string;
  }) {
    const deviceValidation = await this.validateDevice(
      data.deviceId,
      data.apiKey,
    );

    if (!deviceValidation.valid) {
      await this.attendanceService.create({
        fingerprintId: data.fingerprintId,
        deviceId: data.deviceId,
        type: 'salida',
        accessGranted: false,
        message: deviceValidation.message,
      });

      return {
        access: false,
        message: deviceValidation.message,
      };
    }

    const fingerprint = await this.fingerprintRepository.findOne({
      where: {
        fingerprintId: data.fingerprintId,
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

    if (!member) {
      await this.attendanceService.create({
        fingerprintId: data.fingerprintId,
        deviceId: data.deviceId,
        type: 'salida',
        accessGranted: false,
        message: 'La huella no está vinculada a ningún socio',
      });

      return {
        access: false,
        message: 'La huella no está vinculada a ningún socio',
      };
    }

    const lastLog =
      await this.attendanceService.findLastSuccessfulByMember(member.id);

    if (!lastLog || lastLog.type !== 'entrada') {
      await this.attendanceService.create({
        member,
        fingerprintId: data.fingerprintId,
        deviceId: data.deviceId,
        type: 'salida',
        accessGranted: false,
        message: 'No puedes marcar salida sin una entrada activa',
      });

      return {
        access: false,
        message: 'No puedes marcar salida sin una entrada activa',
        member: {
          id: member.id,
          fullName: member.fullName,
          status: member.status,
        },
        deviceId: data.deviceId ?? null,
        type: 'salida',
      };
    }

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
  }
}
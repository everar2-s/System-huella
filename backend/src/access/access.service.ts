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
        userId: null,
      };
    }

    const device = await this.devicesService.findByDeviceId(deviceId);

    if (!device) {
      return {
        valid: false,
        message: 'Dispositivo no registrado',
        userId: null,
      };
    }

    if (!device.createdById) {
      return {
        valid: false,
        message: 'Dispositivo sin usuario asignado',
        userId: null,
      };
    }

    if (!apiKey) {
      return {
        valid: false,
        message: 'apiKey es requerida',
        userId: device.createdById,
      };
    }

    if (device.status !== 'activo') {
      return {
        valid: false,
        message: 'Dispositivo inactivo',
        userId: device.createdById,
      };
    }

    if (device.apiKey !== apiKey) {
      return {
        valid: false,
        message: 'apiKey inválida',
        userId: device.createdById,
      };
    }

    return {
      valid: true,
      message: 'Dispositivo autorizado',
      userId: device.createdById,
    };
  }

  private async createAttendance(
    data: {
      member?: Member;
      memberId?: number;
      fingerprintId?: number;
      deviceId?: string;
      type: string;
      accessGranted: boolean;
      message: string;
    },
    userId: number | null,
  ) {
    if (!userId) {
      return null;
    }

    return this.attendanceService.create(data, userId);
  }

  private async validateMembershipForAccess(
    member: Member,
    userId: number,
  ) {
    const today = new Date().toISOString().split('T')[0];

    const activeMembership = await this.membershipRepository.findOne({
      where: {
        memberId: member.id,
        createdById: userId,
        status: 'activa',
      },
      order: {
        id: 'DESC',
      },
    });

    if (!activeMembership) {
      const suspendedMembership = await this.membershipRepository.findOne({
        where: {
          memberId: member.id,
          createdById: userId,
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

    if (activeMembership.endDate < today) {
      activeMembership.status = 'suspendida';
      await this.membershipRepository.save(activeMembership);

      member.status = 'suspendido';
      await this.memberRepository.save(member);

      await this.fingerprintRepository.update(
        {
          memberId: member.id,
          createdById: userId,
        },
        {
          active: false,
        },
      );

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
      await this.createAttendance(
        {
          fingerprintId: data.fingerprintId,
          deviceId: data.deviceId,
          type: 'entrada',
          accessGranted: false,
          message: deviceValidation.message,
        },
        deviceValidation.userId,
      );

      return {
        access: false,
        message: deviceValidation.message,
      };
    }

    const userId = deviceValidation.userId;

    if (!userId) {
      return {
        access: false,
        message: 'Usuario del dispositivo no identificado',
      };
    }

    const fingerprint = await this.fingerprintRepository.findOne({
      where: {
        fingerprintId: data.fingerprintId,
        createdById: userId,
      },
      relations: {
        member: true,
      },
    });

    if (!fingerprint) {
      await this.createAttendance(
        {
          fingerprintId: data.fingerprintId,
          deviceId: data.deviceId,
          type: 'entrada',
          accessGranted: false,
          message: 'Huella no registrada',
        },
        userId,
      );

      return {
        access: false,
        message: 'Huella no registrada',
      };
    }

    const member = fingerprint.member;

    if (!member) {
      await this.createAttendance(
        {
          fingerprintId: data.fingerprintId,
          deviceId: data.deviceId,
          type: 'entrada',
          accessGranted: false,
          message: 'La huella no está vinculada a ningún socio',
        },
        userId,
      );

      return {
        access: false,
        message: 'La huella no está vinculada a ningún socio',
      };
    }

    if (member.createdById !== userId) {
      await this.createAttendance(
        {
          member,
          fingerprintId: data.fingerprintId,
          deviceId: data.deviceId,
          type: 'entrada',
          accessGranted: false,
          message: 'El socio no pertenece a este dispositivo',
        },
        userId,
      );

      return {
        access: false,
        message: 'El socio no pertenece a este dispositivo',
      };
    }

    const membershipValidation =
      await this.validateMembershipForAccess(member, userId);

    if (!membershipValidation.valid) {
      await this.createAttendance(
        {
          member,
          fingerprintId: data.fingerprintId,
          deviceId: data.deviceId,
          type: 'entrada',
          accessGranted: false,
          message: membershipValidation.message,
        },
        userId,
      );

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
      await this.createAttendance(
        {
          member,
          fingerprintId: data.fingerprintId,
          deviceId: data.deviceId,
          type: 'entrada',
          accessGranted: false,
          message: 'Socio suspendido',
        },
        userId,
      );

      return {
        access: false,
        message: 'Socio suspendido',
        member,
      };
    }

    if (member.status === 'inactivo') {
      await this.createAttendance(
        {
          member,
          fingerprintId: data.fingerprintId,
          deviceId: data.deviceId,
          type: 'entrada',
          accessGranted: false,
          message: 'Socio inactivo',
        },
        userId,
      );

      return {
        access: false,
        message: 'Socio inactivo',
        member,
      };
    }

    if (!fingerprint.active) {
      await this.createAttendance(
        {
          member,
          fingerprintId: data.fingerprintId,
          deviceId: data.deviceId,
          type: 'entrada',
          accessGranted: false,
          message: 'Huella inactiva',
        },
        userId,
      );

      return {
        access: false,
        message: 'Huella inactiva',
      };
    }

    const lastLog =
      await this.attendanceService.findLastSuccessfulByMember(
        member.id,
        userId,
      );

    if (lastLog && lastLog.type === 'entrada') {
      await this.createAttendance(
        {
          member,
          fingerprintId: data.fingerprintId,
          deviceId: data.deviceId,
          type: 'entrada',
          accessGranted: false,
          message: 'Ya tienes una entrada activa',
        },
        userId,
      );

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

    await this.createAttendance(
      {
        member,
        fingerprintId: data.fingerprintId,
        deviceId: data.deviceId,
        type: 'entrada',
        accessGranted: true,
        message: 'Acceso permitido',
      },
      userId,
    );

    return {
  access: true,
  message: 'Acceso permitido',
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
      await this.createAttendance(
        {
          fingerprintId: data.fingerprintId,
          deviceId: data.deviceId,
          type: 'salida',
          accessGranted: false,
          message: deviceValidation.message,
        },
        deviceValidation.userId,
      );

      return {
        access: false,
        message: deviceValidation.message,
      };
    }

    const userId = deviceValidation.userId;

    if (!userId) {
      return {
        access: false,
        message: 'Usuario del dispositivo no identificado',
      };
    }

    const fingerprint = await this.fingerprintRepository.findOne({
      where: {
        fingerprintId: data.fingerprintId,
        createdById: userId,
      },
      relations: {
        member: true,
      },
    });

    if (!fingerprint) {
      await this.createAttendance(
        {
          fingerprintId: data.fingerprintId,
          deviceId: data.deviceId,
          type: 'salida',
          accessGranted: false,
          message: 'Huella no registrada',
        },
        userId,
      );

      return {
        access: false,
        message: 'Huella no registrada',
      };
    }

    const member = fingerprint.member;

    if (!member) {
      await this.createAttendance(
        {
          fingerprintId: data.fingerprintId,
          deviceId: data.deviceId,
          type: 'salida',
          accessGranted: false,
          message: 'La huella no está vinculada a ningún socio',
        },
        userId,
      );

      return {
        access: false,
        message: 'La huella no está vinculada a ningún socio',
      };
    }

    if (member.createdById !== userId) {
      await this.createAttendance(
        {
          member,
          fingerprintId: data.fingerprintId,
          deviceId: data.deviceId,
          type: 'salida',
          accessGranted: false,
          message: 'El socio no pertenece a este dispositivo',
        },
        userId,
      );

      return {
        access: false,
        message: 'El socio no pertenece a este dispositivo',
      };
    }

    const lastLog =
      await this.attendanceService.findLastSuccessfulByMember(
        member.id,
        userId,
      );

    if (!lastLog || lastLog.type !== 'entrada') {
      await this.createAttendance(
        {
          member,
          fingerprintId: data.fingerprintId,
          deviceId: data.deviceId,
          type: 'salida',
          accessGranted: false,
          message: 'No puedes marcar salida sin una entrada activa',
        },
        userId,
      );

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

    await this.createAttendance(
      {
        member,
        fingerprintId: data.fingerprintId,
        deviceId: data.deviceId,
        type: 'salida',
        accessGranted: true,
        message: 'Salida registrada',
      },
      userId,
    );

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
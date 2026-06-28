import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Fingerprint } from './fingerprint.entity';
import { Member } from '../members/member.entity';
import { Device } from '../devices/device.entity';

@Injectable()
export class FingerprintsService {
  constructor(
    @InjectRepository(Fingerprint)
    private readonly fingerprintRepository: Repository<Fingerprint>,

    @InjectRepository(Member)
    private readonly memberRepository: Repository<Member>,

    @InjectRepository(Device)
    private readonly deviceRepository: Repository<Device>,
  ) {}

  async create(
    data: {
      memberId: number;
      fingerprintId: number;
      fingerName: string;
    },
    userId: number,
  ) {
    this.validateUser(userId);

    const member = await this.memberRepository.findOne({
      where: {
        id: data.memberId,
        createdById: userId,
      },
    });

    if (!member) {
      throw new NotFoundException('El miembro no existe');
    }

    const memberAlreadyHasFingerprint =
      await this.fingerprintRepository.findOne({
        where: {
          memberId: data.memberId,
          createdById: userId,
        },
      });

    if (memberAlreadyHasFingerprint) {
      throw new ConflictException(
        'Este socio ya tiene una huella registrada',
      );
    }

    const existingFingerprint =
      await this.fingerprintRepository.findOne({
        where: {
          fingerprintId: data.fingerprintId,
          createdById: userId,
        },
      });

    if (existingFingerprint) {
      throw new ConflictException(
        'Ese fingerprintId ya está registrado en tu cuenta',
      );
    }

    const fingerprint = this.fingerprintRepository.create({
      memberId: data.memberId,
      fingerprintId: data.fingerprintId,
      fingerName: data.fingerName,
      active: true,
      member,
      createdById: userId,
    });

    const savedFingerprint =
      await this.fingerprintRepository.save(fingerprint);

    member.status = 'activo';
    await this.memberRepository.save(member);

    return savedFingerprint;
  }

  async enrollFromDevice(data: {
    memberId: number;
    fingerprintId: number;
    fingerName: string;
    deviceId: string;
    apiKey?: string;
  }) {
    if (!data.apiKey) {
      throw new UnauthorizedException('apiKey es requerida');
    }

    if (!data.deviceId) {
      throw new UnauthorizedException('deviceId es requerido');
    }

    const device = await this.deviceRepository.findOne({
      where: {
        deviceId: data.deviceId,
        apiKey: data.apiKey,
        status: 'activo',
      },
    });

    if (!device) {
      throw new UnauthorizedException(
        'Dispositivo no autorizado o apiKey inválida',
      );
    }

    if (!device.createdById) {
      throw new UnauthorizedException(
        'El dispositivo no tiene usuario asignado',
      );
    }

    const userId = device.createdById;

    const member = await this.memberRepository.findOne({
      where: {
        id: data.memberId,
        createdById: userId,
      },
    });

    if (!member) {
      throw new NotFoundException(
        'El socio no existe o no pertenece a este dispositivo',
      );
    }

    const memberAlreadyHasFingerprint =
      await this.fingerprintRepository.findOne({
        where: {
          memberId: data.memberId,
          createdById: userId,
        },
      });

    if (memberAlreadyHasFingerprint) {
      throw new ConflictException(
        'Este socio ya tiene una huella registrada',
      );
    }

    const existingFingerprint =
      await this.fingerprintRepository.findOne({
        where: {
          fingerprintId: data.fingerprintId,
          createdById: userId,
        },
      });

    if (existingFingerprint) {
      throw new ConflictException(
        'Ese fingerprintId ya está registrado en esta cuenta',
      );
    }

    const fingerprint = this.fingerprintRepository.create({
      memberId: data.memberId,
      fingerprintId: data.fingerprintId,
      fingerName: data.fingerName,
      active: true,
      member,
      createdById: userId,
    });

    const savedFingerprint =
      await this.fingerprintRepository.save(fingerprint);

    member.status = 'activo';
    await this.memberRepository.save(member);

    return {
      message: 'Huella registrada desde ESP32 correctamente',
      fingerprint: savedFingerprint,
      member: {
        id: member.id,
        fullName: member.fullName,
        status: member.status,
      },
      deviceId: data.deviceId,
    };
  }

  findAll(userId: number) {
    this.validateUser(userId);

    return this.fingerprintRepository.find({
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

  async findOne(id: number, userId: number) {
    this.validateUser(userId);

    const fingerprint = await this.fingerprintRepository.findOne({
      where: {
        id,
        createdById: userId,
      },
      relations: {
        member: true,
      },
    });

    if (!fingerprint) {
      throw new NotFoundException('Huella no encontrada');
    }

    return fingerprint;
  }

  async verify(data: {
    fingerprintId: number;
    deviceId: string;
    apiKey?: string;
  }) {
    if (!data.apiKey) {
      throw new UnauthorizedException('apiKey es requerida');
    }

    if (!data.deviceId) {
      throw new UnauthorizedException('deviceId es requerido');
    }

    const device = await this.deviceRepository.findOne({
      where: {
        deviceId: data.deviceId,
        apiKey: data.apiKey,
        status: 'activo',
      },
    });

    if (!device) {
      throw new UnauthorizedException(
        'Dispositivo no autorizado o apiKey inválida',
      );
    }

    if (!device.createdById) {
      throw new UnauthorizedException(
        'El dispositivo no tiene usuario asignado',
      );
    }

    const fingerprint = await this.fingerprintRepository.findOne({
      where: {
        fingerprintId: data.fingerprintId,
        createdById: device.createdById,
      },
      relations: {
        member: true,
      },
    });

    if (!fingerprint) {
      return {
        access: false,
        message: 'Huella no registrada',
      };
    }

    if (!fingerprint.active) {
      return {
        access: false,
        message: 'Huella inactiva',
      };
    }

    if (!fingerprint.member) {
      return {
        access: false,
        message: 'La huella no está vinculada a ningún socio',
      };
    }

    return {
      access: true,
      message: 'Huella reconocida',
      member: {
        id: fingerprint.member.id,
        fullName: fingerprint.member.fullName,
        status: fingerprint.member.status,
        membershipStart: fingerprint.member.membershipStart,
        membershipEnd: fingerprint.member.membershipEnd,
      },
      deviceId: data.deviceId,
    };
  }

  async remove(id: number, userId: number) {
    const fingerprint = await this.findOne(id, userId);

    const member = fingerprint.member;

    await this.fingerprintRepository.remove(fingerprint);

    if (member) {
      member.status = 'pendiente_huella';
      await this.memberRepository.save(member);
    }

    return {
      message: 'Huella eliminada correctamente',
      member: member
        ? {
            id: member.id,
            fullName: member.fullName,
            status: member.status,
          }
        : null,
    };
  }

  private validateUser(userId: number) {
    if (!userId) {
      throw new BadRequestException('Usuario no identificado');
    }
  }
}
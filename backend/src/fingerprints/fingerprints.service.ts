import {
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

  async create(data: {
    memberId: number;
    fingerprintId: number;
    fingerName: string;
  }) {
    const member = await this.memberRepository.findOne({
      where: { id: data.memberId },
    });

    if (!member) {
      throw new NotFoundException('El miembro no existe');
    }

    const memberAlreadyHasFingerprint =
      await this.fingerprintRepository.findOne({
        where: { memberId: data.memberId },
      });

    if (memberAlreadyHasFingerprint) {
      throw new ConflictException(
        'Este socio ya tiene una huella registrada',
      );
    }

    const existingFingerprint =
      await this.fingerprintRepository.findOne({
        where: { fingerprintId: data.fingerprintId },
      });

    if (existingFingerprint) {
      throw new ConflictException(
        'Ese fingerprintId ya está registrado',
      );
    }

    const fingerprint = this.fingerprintRepository.create({
      memberId: data.memberId,
      fingerprintId: data.fingerprintId,
      fingerName: data.fingerName,
      active: true,
      member,
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

    const member = await this.memberRepository.findOne({
      where: { id: data.memberId },
    });

    if (!member) {
      throw new NotFoundException('El socio no existe');
    }

    const memberAlreadyHasFingerprint =
      await this.fingerprintRepository.findOne({
        where: { memberId: data.memberId },
      });

    if (memberAlreadyHasFingerprint) {
      throw new ConflictException(
        'Este socio ya tiene una huella registrada',
      );
    }

    const existingFingerprint =
      await this.fingerprintRepository.findOne({
        where: { fingerprintId: data.fingerprintId },
      });

    if (existingFingerprint) {
      throw new ConflictException(
        'Ese fingerprintId ya está registrado',
      );
    }

    const fingerprint = this.fingerprintRepository.create({
      memberId: data.memberId,
      fingerprintId: data.fingerprintId,
      fingerName: data.fingerName,
      active: true,
      member,
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

  findAll() {
    return this.fingerprintRepository.find({
      relations: {
        member: true,
      },
      order: {
        id: 'DESC',
      },
    });
  }

  async findOne(id: number) {
    const fingerprint = await this.fingerprintRepository.findOne({
      where: { id },
      relations: {
        member: true,
      },
    });

    if (!fingerprint) {
      throw new NotFoundException('Huella no encontrada');
    }

    return fingerprint;
  }

  async verify(fingerprintId: number) {
    const fingerprint = await this.fingerprintRepository.findOne({
      where: {
        fingerprintId,
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

    return {
      access: true,
      message: 'Huella reconocida',
      member: fingerprint.member,
    };
  }

  async remove(id: number) {
  const fingerprint = await this.findOne(id);

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
}
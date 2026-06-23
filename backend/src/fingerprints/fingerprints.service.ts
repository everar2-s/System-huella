import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Fingerprint } from './fingerprint.entity';
import { Member } from '../members/member.entity';

@Injectable()
export class FingerprintsService {
  constructor(
    @InjectRepository(Fingerprint)
    private readonly fingerprintRepository: Repository<Fingerprint>,

    @InjectRepository(Member)
    private readonly memberRepository: Repository<Member>,
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

    const existingFingerprint = await this.fingerprintRepository.findOne({
      where: { fingerprintId: data.fingerprintId },
    });

    if (existingFingerprint) {
      throw new ConflictException(
        'Ese fingerprintId ya está registrado',
      );
    }
member.status = 'Huella registrada';
await this.memberRepository.save(member);

const fingerprint = this.fingerprintRepository.create({
  memberId: data.memberId,
  fingerprintId: data.fingerprintId,
  fingerName: data.fingerName,
  member,
});

return this.fingerprintRepository.save(fingerprint);
  }

  findAll() {
    return this.fingerprintRepository.find({
      relations: {
        member: true,
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
        active: true,
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

    return {
      access: true,
      message: 'Huella reconocida',
      member: fingerprint.member,
    };
  }

  async remove(id: number) {
    const fingerprint = await this.findOne(id);

    await this.fingerprintRepository.remove(fingerprint);

    return {
      message: 'Huella eliminada correctamente',
    };
  }
}
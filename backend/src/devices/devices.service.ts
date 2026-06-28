import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Device } from './device.entity';
import { CreateDeviceDto } from './dto/create-device.dto';

@Injectable()
export class DevicesService {
  constructor(
    @InjectRepository(Device)
    private readonly deviceRepository: Repository<Device>,
  ) {}

  async create(data: CreateDeviceDto, userId: number) {
    this.validateUser(userId);

    const deviceId = data.deviceId.trim();
    const name = data.name.trim();
    const location = data.location?.trim() || undefined;
    const apiKey = data.apiKey.trim();

    const existingDevice = await this.deviceRepository.findOne({
      where: {
        deviceId,
      },
    });

    if (existingDevice) {
      throw new ConflictException(
        'Ya existe un dispositivo con ese deviceId',
      );
    }

    const device = this.deviceRepository.create({
      deviceId,
      name,
      location,
      apiKey,
      status: 'activo',
      createdById: userId,
    });

    return this.deviceRepository.save(device);
  }

  findAll(userId: number) {
    this.validateUser(userId);

    return this.deviceRepository.find({
      where: {
        createdById: userId,
      },
      order: {
        id: 'ASC',
      },
    });
  }

  async findOne(id: number, userId: number) {
    this.validateUser(userId);

    const device = await this.deviceRepository.findOne({
      where: {
        id,
        createdById: userId,
      },
    });

    if (!device) {
      throw new NotFoundException('Dispositivo no encontrado');
    }

    return device;
  }

  async findByDeviceId(deviceId: string) {
    return this.deviceRepository.findOne({
      where: {
        deviceId,
      },
    });
  }

  async deactivate(id: number, userId: number) {
    const device = await this.findOne(id, userId);

    device.status = 'inactivo';

    await this.deviceRepository.save(device);

    return {
      message: 'Dispositivo desactivado correctamente',
      device,
    };
  }

  private validateUser(userId: number) {
    if (!userId) {
      throw new BadRequestException('Usuario no identificado');
    }
  }
}
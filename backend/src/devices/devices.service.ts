import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Device } from './device.entity';

@Injectable()
export class DevicesService {
  constructor(
    @InjectRepository(Device)
    private readonly deviceRepository: Repository<Device>,
  ) {}

  async create(data: {
    deviceId: string;
    name: string;
    location?: string;
    apiKey: string;
  }) {
    const existingDevice = await this.deviceRepository.findOne({
      where: { deviceId: data.deviceId },
    });

    if (existingDevice) {
      throw new ConflictException('Ese dispositivo ya existe');
    }

    const device = this.deviceRepository.create({
      deviceId: data.deviceId,
      name: data.name,
      location: data.location,
      apiKey: data.apiKey,
      status: 'activo',
    });

    return this.deviceRepository.save(device);
  }

  findAll() {
    return this.deviceRepository.find({
      order: {
        id: 'DESC',
      },
    });
  }

  async findOne(id: number) {
    const device = await this.deviceRepository.findOne({
      where: { id },
    });

    if (!device) {
      throw new NotFoundException('Dispositivo no encontrado');
    }

    return device;
  }

  async findByDeviceId(deviceId: string) {
    const device = await this.deviceRepository.findOne({
      where: { deviceId },
    });

    if (!device) {
      throw new NotFoundException('Dispositivo no encontrado');
    }

    return device;
  }

  async deactivate(id: number) {
    const device = await this.findOne(id);

    device.status = 'inactivo';

    await this.deviceRepository.save(device);

    return {
      message: 'Dispositivo desactivado correctamente',
      device,
    };
  }
}
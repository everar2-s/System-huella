import {
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

  async create(data: CreateDeviceDto) {
    const deviceId = data.deviceId.trim();
    const name = data.name.trim();
    const location = data.location?.trim() || undefined;
    const apiKey = data.apiKey.trim();

    const existingDevice = await this.deviceRepository.findOne({
      where: { deviceId },
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
    return this.deviceRepository.findOne({
      where: {
        deviceId,
      },
    });
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
import { Transform } from 'class-transformer';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MinLength,
} from 'class-validator';

export class CreateDeviceDto {
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString({ message: 'El deviceId debe ser texto' })
  @IsNotEmpty({ message: 'El deviceId es obligatorio' })
  @Matches(/\S/, {
    message: 'El deviceId no puede estar vacío',
  })
  deviceId!: string;

  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString({ message: 'El nombre del dispositivo debe ser texto' })
  @IsNotEmpty({ message: 'El nombre del dispositivo es obligatorio' })
  @Matches(/\S/, {
    message: 'El nombre del dispositivo no puede estar vacío',
  })
  name!: string;

  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsOptional()
  @IsString({ message: 'La ubicación debe ser texto' })
  location?: string;

  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString({ message: 'La apiKey debe ser texto' })
  @IsNotEmpty({ message: 'La apiKey es obligatoria' })
  @MinLength(6, {
    message: 'La apiKey debe tener al menos 6 caracteres',
  })
  apiKey!: string;
}
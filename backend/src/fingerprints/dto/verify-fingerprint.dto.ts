import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsString, Min } from 'class-validator';

export class VerifyFingerprintDto {
  @Type(() => Number)
  @IsInt({ message: 'El fingerprintId debe ser un número entero' })
  @Min(1, { message: 'El fingerprintId debe ser mayor a 0' })
  fingerprintId!: number;

  @IsString({ message: 'El deviceId debe ser texto' })
  @IsNotEmpty({ message: 'El deviceId es obligatorio' })
  deviceId!: string;
}
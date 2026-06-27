import { Type } from 'class-transformer';
import { IsInt, Min } from 'class-validator';

export class VerifyFingerprintDto {
  @Type(() => Number)
  @IsInt({ message: 'El fingerprintId debe ser un número entero' })
  @Min(1, { message: 'El fingerprintId debe ser mayor a 0' })
  fingerprintId!: number;
}
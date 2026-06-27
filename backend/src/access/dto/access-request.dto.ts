import { Transform, Type } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsString,
  Matches,
  Min,
} from 'class-validator';

export class AccessRequestDto {
  @Type(() => Number)
  @IsInt({ message: 'El fingerprintId debe ser un número entero' })
  @Min(1, { message: 'El fingerprintId debe ser mayor a 0' })
  fingerprintId!: number;

  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString({ message: 'El deviceId debe ser texto' })
  @IsNotEmpty({ message: 'El deviceId es obligatorio' })
  @Matches(/\S/, {
    message: 'El deviceId no puede estar vacío',
  })
  deviceId!: string;
}
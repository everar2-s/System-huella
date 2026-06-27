import { Type } from 'class-transformer';
import {
  IsDateString,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  Min,
} from 'class-validator';

export class CreateMembershipDto {
  @Type(() => Number)
  @IsInt({ message: 'El memberId debe ser un número entero' })
  @Min(1, { message: 'El memberId debe ser mayor a 0' })
  memberId!: number;

  @IsIn(['diaria', 'semanal', 'mensual', 'anual'], {
    message:
      'El tipo de membresía debe ser diaria, semanal, mensual o anual',
  })
  type!: string;

  @IsDateString({}, { message: 'La fecha de inicio no es válida' })
  startDate!: string;

  @IsDateString({}, { message: 'La fecha de fin no es válida' })
  endDate!: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'El precio debe ser un número' })
  @Min(0, { message: 'El precio no puede ser negativo' })
  price?: number;
}
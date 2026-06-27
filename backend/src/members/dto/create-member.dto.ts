import { Transform } from 'class-transformer';
import {
  IsDateString,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator';

export class CreateMemberDto {
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString({ message: 'El nombre completo debe ser texto' })
  @IsNotEmpty({ message: 'El nombre completo es obligatorio' })
  @Matches(/\S/, {
    message: 'El nombre completo no puede estar vacío',
  })
  fullName!: string;

  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsOptional()
  @IsString({ message: 'El teléfono debe ser texto' })
  phone?: string;

  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsOptional()
  @IsEmail({}, { message: 'El email no tiene un formato válido' })
  email?: string;

  @IsOptional()
  @IsDateString({}, { message: 'La fecha de inicio no es válida' })
  membershipStart?: string;

  @IsOptional()
  @IsDateString({}, { message: 'La fecha de fin no es válida' })
  membershipEnd?: string;
}
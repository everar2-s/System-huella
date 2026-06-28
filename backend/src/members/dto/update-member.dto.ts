import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator';

export class UpdateMemberDto {
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsOptional()
  @IsString({ message: 'El nombre completo debe ser texto' })
  @Matches(/\S/, {
    message: 'El nombre completo no puede estar vacío',
  })
  fullName?: string;

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
  //@IsEmail({}, { message: 'El email no tiene un formato válido' })
  email?: string;
}
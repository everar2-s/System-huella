import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  constructor(private readonly configService: ConfigService) {}

  private createTransporter() {
    return nodemailer.createTransport({
      host: this.configService.get<string>('MAIL_HOST'),
      port: Number(this.configService.get<string>('MAIL_PORT')),
      secure: false,
      auth: {
        user: this.configService.get<string>('MAIL_USER'),
        pass: this.configService.get<string>('MAIL_PASS'),
      },
    });
  }

  async sendVerificationEmail(email: string, token: string) {
    const apiUrl =
      this.configService.get<string>('API_URL') ||
      'http://localhost:3000';

    const from = this.configService.get<string>('MAIL_FROM');

    const verificationUrl = `${apiUrl}/auth/verify-email?token=${token}`;

    const transporter = this.createTransporter();

    await transporter.sendMail({
  from,
  to: email,
  subject: 'Activa tu cuenta - Gym Access',
  text: `
Hola.

Gracias por registrarte en Gym Access.

Para verificar tu cuenta, abre este enlace:

${verificationUrl}

Este enlace expira en 24 horas.

Si tú no solicitaste esta cuenta, ignora este correo.
  `,
  html: `
    <div style="font-family: Arial, sans-serif; background:#f3f4f6; padding:30px;">
      <div style="max-width:560px; margin:auto; background:#ffffff; border-radius:16px; overflow:hidden;">
        <div style="background:#111827; padding:28px; text-align:center;">
          <h1 style="color:#ffffff; margin:0;">Gym Access</h1>
          <p style="color:#d1d5db;">Sistema de control de acceso</p>
        </div>

        <div style="padding:30px;">
          <h2>Verifica tu correo electrónico</h2>

          <p>
            Gracias por registrarte en <strong>Gym Access</strong>.
            Para activar tu cuenta, confirma que este correo te pertenece.
          </p>

          <div style="text-align:center; margin:30px 0;">
            <a
              href="${verificationUrl}"
              style="
                background:#2563eb;
                color:#ffffff;
                padding:14px 24px;
                border-radius:10px;
                text-decoration:none;
                font-weight:bold;
              "
            >
              Verificar mi cuenta
            </a>
          </div>
          <p style="color:#6b7280; font-size:13px;">
            Si tú no creaste esta cuenta, puedes ignorar este correo.
          </p>
        </div>
      </div>
    </div>
  `,
});

  }
}
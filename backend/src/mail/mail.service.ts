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
  html: `
    <div style="
      margin:0;
      padding:0;
      background:#f3f4f6;
      font-family:Arial, Helvetica, sans-serif;
    ">
      <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 0;">
        <tr>
          <td align="center">
            <table width="100%" cellpadding="0" cellspacing="0" style="
              max-width:560px;
              background:#ffffff;
              border-radius:16px;
              overflow:hidden;
              box-shadow:0 10px 30px rgba(0,0,0,0.08);
            ">
              <tr>
                <td style="
                  background:#111827;
                  padding:28px;
                  text-align:center;
                ">
                  <h1 style="
                    margin:0;
                    color:#ffffff;
                    font-size:26px;
                    letter-spacing:0.5px;
                  ">
                    Gym Access
                  </h1>

                  <p style="
                    margin:8px 0 0;
                    color:#d1d5db;
                    font-size:14px;
                  ">
                    Sistema de control de acceso para gimnasio
                  </p>
                </td>
              </tr>

              <tr>
                <td style="padding:32px 28px;">
                  <h2 style="
                    margin:0 0 12px;
                    color:#111827;
                    font-size:22px;
                  ">
                    Verifica tu correo electrónico
                  </h2>

                  <p style="
                    margin:0 0 18px;
                    color:#4b5563;
                    font-size:15px;
                    line-height:1.6;
                  ">
                    Gracias por registrarte en <strong>Gym Access</strong>.
                    Para activar tu cuenta y poder iniciar sesión, confirma que este correo te pertenece.
                  </p>

                  <div style="text-align:center; margin:30px 0;">
                    <a href="${verificationUrl}" style="
                      display:inline-block;
                      background:#2563eb;
                      color:#ffffff;
                      padding:14px 24px;
                      border-radius:10px;
                      text-decoration:none;
                      font-size:15px;
                      font-weight:bold;
                    ">
                      Verificar mi cuenta
                    </a>
                  </div>

                  <p style="
                    margin:0 0 16px;
                    color:#6b7280;
                    font-size:14px;
                    line-height:1.6;
                  ">
                    Este enlace expirará en <strong>24 horas</strong>.
                    Si el botón no funciona, copia y pega este enlace en tu navegador:
                  </p>

                  <p style="
                    margin:0;
                    padding:12px;
                    background:#f9fafb;
                    border:1px solid #e5e7eb;
                    border-radius:8px;
                    color:#2563eb;
                    font-size:13px;
                    line-height:1.5;
                    word-break:break-all;
                  ">
                    ${verificationUrl}
                  </p>

                  <hr style="
                    border:none;
                    border-top:1px solid #e5e7eb;
                    margin:28px 0;
                  " />

                  <p style="
                    margin:0;
                    color:#9ca3af;
                    font-size:13px;
                    line-height:1.5;
                  ">
                    Si tú no creaste esta cuenta, puedes ignorar este correo.
                    Nadie podrá iniciar sesión sin verificar el correo electrónico.
                  </p>
                </td>
              </tr>

              <tr>
                <td style="
                  background:#f9fafb;
                  padding:18px;
                  text-align:center;
                  color:#9ca3af;
                  font-size:12px;
                ">
                  © ${new Date().getFullYear()} Gym Access. Todos los derechos reservados.
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </div>
  `,
});

  }
}
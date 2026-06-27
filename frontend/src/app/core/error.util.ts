import { HttpErrorResponse } from '@angular/common/http';

export function getErrorMessage(error: unknown): string {
  if (error instanceof HttpErrorResponse) {
    const message = error.error?.message;

    if (Array.isArray(message)) {
      return message.join(', ');
    }

    if (typeof message === 'string') {
      return message;
    }

    if (error.status === 0) {
      return 'No se pudo conectar con el backend. Revisa CORS, puerto o servidor.';
    }

    return `Error ${error.status}: ${error.statusText}`;
  }

  return 'Ocurrió un error inesperado.';
}

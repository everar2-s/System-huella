# Gym Access Frontend

Frontend Angular para el sistema de gimnasio con NestJS, PostgreSQL y ESP32.

## Requisitos

- Node.js instalado
- Angular CLI instalado
- Backend NestJS corriendo

## Instalación

```bash
npm install
```

## Configurar URL del backend

Abre:

```text
src/environments/environment.ts
```

Si tu backend corre en puerto 3000:

```ts
apiUrl: 'http://localhost:3000'
```

Si tu backend corre en puerto 3001:

```ts
apiUrl: 'http://localhost:3001'
```

## Ejecutar

```bash
npm start
```

Abre:

```text
http://localhost:4200
```

## Primer uso

1. Entra a Crear administrador.
2. Crea el usuario administrador.
3. Inicia sesión.
4. Registra socios.
5. Registra huellas.
6. Registra dispositivos.
7. Prueba entrada y salida.

## CORS en backend

En NestJS, tu `src/main.ts` debe permitir Angular:

```ts
app.enableCors({
  origin: ['http://localhost:4200', 'http://127.0.0.1:4200'],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key'],
});
```

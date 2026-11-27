# nemkit-notify-api

API de notificaciones **por email** como servicio (NaaS), construida sobre `nemkit`.

## Principios

- **Foundation transversal en `nemkit`**: autenticación JWT, refresh tokens, usuarios, tokens, feedback, empleados y límites se consumen desde `nemkit` (`createFoundation`). Este proyecto solo inyecta su `.env`, logger, planes y métricas. El foundation se monta bajo `/api/v1/notify/foundation`.
- **Tenant = `foundation_users`**: el dueño de la cuenta es la empresa. Todas las colecciones llevan `userId`. El estado de la empresa es el `recordStatus` del usuario dueño (`active` / `inactive` / `archived` / `deleted`).
- **Envío directo**: no hay cola, worker ni reintentos. La petición se recibe y se entrega enseguida con Mailjet.
- **Sin topics ni suscriptores**: el cliente envía a uno o varios correos directamente.
- **API Key en claro** y visible en cualquier momento. El API público solo valida el header `api-key`.

## Módulos

| Módulo | Responsabilidad |
| --- | --- |
| `nemkit` foundation | Auth, usuarios, tokens, empleados, feedback, límites y panel `sys`, provistos por el paquete `nemkit`. |
| `notify/api-keys` | CRUD de API Keys por empresa. |
| `notify/notifications` | Envío directo, historial y métricas de email (`notify_deliveries`). |
| `notify/stats` | Resumen y serie temporal de email. |

## API

### Pública (header `api-key`)

```
POST /api/v1/notify/notifications/email
```

### Portal de empresa (JWT)

```
GET/POST /api/v1/notify/company/api-keys
DELETE   /api/v1/notify/company/api-keys/:id
GET      /api/v1/notify/company/notifications
GET      /api/v1/notify/company/notifications/:id
GET      /api/v1/notify/company/stats/summary
GET      /api/v1/notify/company/stats/timeseries?days=30
GET      /api/v1/notify/company/stats/channels
```

### Foundation (JWT, provisto por `nemkit`)

Perfil, autenticación, límites, feedback y panel de plataforma viven en el
módulo transversal `nemkit`, montado bajo `/api/v1/notify/foundation`.

```
POST   /api/v1/notify/foundation/auth/users/login
POST   /api/v1/notify/foundation/auth/users/register
POST   /api/v1/notify/foundation/auth/employees/login
GET/PUT /api/v1/notify/foundation/users/profile
GET/PUT /api/v1/notify/foundation/employees/profile
GET    /api/v1/notify/foundation/limits
GET    /api/v1/notify/foundation/limits/plans
POST   /api/v1/notify/foundation/feedback
```

### Superadmin (JWT `SUPERADMIN`)

```
GET   /api/v1/notify/foundation/sys/overview
GET   /api/v1/notify/foundation/sys/companies
GET   /api/v1/notify/foundation/sys/companies/:id
GET   /api/v1/notify/foundation/sys/companies/:id/consumption
PATCH /api/v1/notify/foundation/sys/companies/:id/status   { "status": "active" | "inactive" | "archived" }
DELETE /api/v1/notify/foundation/sys/companies/:id
GET   /api/v1/notify/foundation/sys/users
```

### Email directo (MVP, sin plantillas)

El cliente envía el asunto, el texto y el HTML final. `to` acepta un correo o
un arreglo de correos (máximo 20 por petición).

```bash
curl -X POST http://localhost:4001/api/v1/notify/notifications/email \
  -H "api-key: nk_live_..." \
  -H "Content-Type: application/json" \
  -d '{
    "to": ["cliente@example.com", "otro@example.com"],
    "subject": "Tu código de verificación es 482910",
    "text": "Tu código OTP es: 482910. Expira en 5 minutos.",
    "html": "<h3>Tu código de verificación</h3><p>Usa este código: <strong>482910</strong></p>"
  }'
```

Respuesta:

```json
{
  "success": true,
  "data": {
    "status": "sent",
    "recipients": 2,
    "sent": 2,
    "failed": 0,
    "deliveries": [
      { "destination": "cliente@example.com", "status": "sent", "providerMessageId": "..." }
    ],
    "spamWarning": "El correo puede llegar a la carpeta de spam...",
    "warnings": ["..."],
    "usage": { "used": 2, "max": 1000, "remaining": 998, "period": "2026-11" }
  }
}
```

- **Spam:** los correos pueden llegar a spam. La respuesta incluye
  `spamWarning`; pide al destinatario revisar spam y marcar el remitente como
  seguro.
- **Remitente:** lo define el servidor con `MAILJET_FROM_EMAIL` /
  `MAILJET_FROM_NAME`; el cliente no puede falsificarlo.
- **Errores:** `PLAN_LIMIT_REACHED` (409), `EMAIL_NOT_CONFIGURED` (503),
  `EMAIL_SEND_FAILED` (502).
- **Parcial:** si algunos correos fallan, responde `200` con
  `status: "partial"` y el detalle en `deliveries`.

## Plan

Solo existe el plan `free`, definido en `src/config/plans.js`:

| Límite | free |
| --- | --- |
| API keys | 3 (total) |
| Notificaciones | 1.000/mes |

En `foundation_users` únicamente se guarda `limitUsage.plan.code`. El uso
mensual se reinicia de forma perezosa con el corte de `America/Bogota`.

## Ejecución local

```bash
cp .env.example .env
# Configura MAILJET_API_KEY, MAILJET_API_SECRET, MAILJET_FROM_EMAIL y MAILJET_FROM_NAME
npm install
npm run dev
```

Al arrancar, el seed garantiza una API key interna si `DEFAULT_API_KEY` está
definida. Si la key no existe, crea la empresa interna con
`DEFAULT_API_KEY_EMAIL` / `DEFAULT_API_KEY_PASSWORD` y la asocia. Es idempotente:
en arranques posteriores solo asegura que siga activa y con el nombre
`DEFAULT_API_KEY_NAME`.

# nemkit-notify-api

API de notificaciones **por email** como servicio (NaaS), construida sobre `nemkit`.

## Principios

- **Foundation copiado** de `nemkit-inventory-api`: autenticación JWT, refresh tokens, usuarios, tokens, feedback, empleados, límites, logger, conexión Mongo y manejo de errores. No se sincroniza automáticamente: es copia y pega (ver `FOUNDATION.md`).
- **Tenant = `users`**: el dueño de la cuenta es la empresa. Todas las colecciones llevan `userId`. El estado de la empresa es el `recordStatus` del usuario dueño (`active` / `inactive` / `archived` / `deleted`).
- **Sin Redis ni BullMQ**: la cola es `createQueue` de `nemkit` (en memoria, mismo proceso). MongoDB es la fuente de verdad del estado de cada entrega y se re-encola lo pendiente al arrancar.
- **Sin reintentos ni idempotencia**: una entrega tiene estado terminal (`queued` → `sent` | `failed`).
- **API Key en claro** y visible en cualquier momento. El API público solo valida el header `api-key`.

## Módulos

| Módulo | Responsabilidad |
| --- | --- |
| `foundation/*` | Copia del foundation de inventario (`auth-users`, `users`, `tokens`, `users-profile`, `employees*`, `feedback`, `sys-*`, `limits`). |
| `notify/api-keys` | CRUD de API Keys por empresa. |
| `notify/topics` | Temas de suscripción y conteo de suscriptores. |
| `notify/subscribers` | Suscriptores con email y `topicIds[]`. |
| `notify/notifications` | Entregas de email (`notify_deliveries`): historial, métricas y estado. |
| `notify/engine` | Dispatcher, processor, cola y cliente Mailjet. |
| `notify/stats` | Resumen y serie temporal de email. |

## API

### Pública (header `api-key`)

```
POST   /api/v1/notify/subscribers
PUT    /api/v1/notify/subscribers/:id
DELETE /api/v1/notify/subscribers/:id
GET    /api/v1/notify/subscribers/:id
POST   /api/v1/notify/subscribers/:id/topics
DELETE /api/v1/notify/subscribers/:id/topics/:topicId
POST   /api/v1/notify/notifications/email
POST   /api/v1/notify/notifications/send       (email)
POST   /api/v1/notify/notifications/broadcast  (email)
GET    /api/v1/notify/notifications/:id
```

### Portal de empresa (JWT)

```
GET/PUT  /api/v1/notify/company/profile
GET/POST /api/v1/notify/company/api-keys
DELETE   /api/v1/notify/company/api-keys/:id
GET/POST /api/v1/notify/company/topics
GET/PUT/DELETE /api/v1/notify/company/topics/:id
GET/POST /api/v1/notify/company/subscribers
GET/PUT/DELETE /api/v1/notify/company/subscribers/:id
GET      /api/v1/notify/company/notifications
GET      /api/v1/notify/company/notifications/:id
GET      /api/v1/notify/company/stats/summary
GET      /api/v1/notify/company/stats/timeseries?days=30
GET      /api/v1/notify/company/stats/channels
```

### Superadmin (JWT `SUPERADMIN`)

```
GET   /api/v1/notify/sys/overview
GET   /api/v1/notify/sys/companies
GET   /api/v1/notify/sys/companies/:id
GET   /api/v1/notify/sys/companies/:id/consumption
PATCH /api/v1/notify/sys/companies/:id/status   { "status": "active" | "inactive" | "archived" }
DELETE /api/v1/notify/sys/companies/:id
GET   /api/v1/notify/sys/users
```

### Email directo (MVP, sin plantillas)

El cliente envía el asunto, el texto y el HTML final. No hay plantillas ni
variables del sistema.

```bash
curl -X POST http://localhost:4001/api/v1/notify/notifications/email \
  -H "api-key: nk_live_..." \
  -H "Content-Type: application/json" \
  -d '{
    "to": "cliente@example.com",
    "toName": "Cliente",
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
    "id": 123,
    "status": "sent",
    "channel": "email",
    "destination": "cliente@example.com",
    "provider": "mailjet",
    "providerMessageId": "...",
    "spamWarning": "El correo puede llegar a la carpeta de spam...",
    "warnings": ["..."],
    "usage": { "used": 1, "max": 1000, "remaining": 999, "period": "2026-11" }
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

## Plan

Solo existe el plan `free`, definido en
`src/modules/foundation/limits/limits.constants.js`:

| Límite | free |
| --- | --- |
| Temas | 10 (total) |
| Suscriptores | 1.000 (total) |
| API keys | 3 (total) |
| Notificaciones | 1.000/mes |
| Destinatarios por broadcast | 1.000 |

En `foundation_users` únicamente se guarda `limitUsage.plan.code`. El uso
mensual se reinicia de forma perezosa con el corte de `America/Bogota`.


## Ejecución local

```bash
cp .env.example .env
# Configura MAILJET_API_KEY, MAILJET_API_SECRET, MAILJET_FROM_EMAIL y MAILJET_FROM_NAME
npm install
npm run dev
```

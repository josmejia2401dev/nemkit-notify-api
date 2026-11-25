# nemkit-notify-api

API de notificaciones multicanal (Email, SMS, WebPush) como servicio (NaaS), construida sobre `nemkit`.

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
| `notify/subscribers` | Suscriptores con `topicIds[]` y suscripciones WebPush. |
| `notify/notifications` | Entregas (`notify_deliveries`): historial, métricas y estado. |
| `notify/engine` | Dispatcher, processor, cola y estrategias por canal. |
| `notify/stats` | Resumen y serie temporal por canal. |

## API

### Pública (header `api-key`)

```
POST   /api/v1/notify/subscribers
PUT    /api/v1/notify/subscribers/:id
DELETE /api/v1/notify/subscribers/:id
GET    /api/v1/notify/subscribers/:id
POST   /api/v1/notify/subscribers/:id/topics
DELETE /api/v1/notify/subscribers/:id/topics/:topicId
POST   /api/v1/notify/notifications/send
POST   /api/v1/notify/notifications/broadcast
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
GET      /api/v1/notify/company/webpush/public-key
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

## Plan

Solo existe el plan `free`, definido en `src/modules/foundation/limits/limits.constants.js`. En `foundation_users` únicamente se guarda `limitUsage.plan.code`.

## Ejecución local

```bash
cp .env.example .env
npm install
npm run dev
```

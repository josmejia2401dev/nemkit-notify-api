# Foundation

Este proyecto **no comparte código** con `nemkit-inventory-api`: el foundation se
copia y pega. Cualquier cambio transversal debe replicarse a mano.

## Origen

- Repositorio: `nemkit-inventory-api`
- Fecha de copia: 2026-11-13
- Base: `nemkit` (`git+https://github.com/josmejia2401dev/nemkit.git#7291c6b9`)

## Copiado sin cambios

```
src/config/{db,logger,mongo-query,storage}.js
src/middlewares/{auth,authorize,employees,sys,users}.middleware.js
src/modules/foundation/{auth-employees,auth-users,employees,employees-profile,feedback,
                        sys-employees,sys-users,tokens,users,users-profile,query.utils}
src/routes/{auth,employees,users}.routes.js
src/seeds/admin-seed.js
src/scripts/migrations/
src/app.js
```

## Adaptado para notify

| Archivo | Cambio |
| --- | --- |
| `src/config/env.js` | Puerto 4001, CORS 4300, variables de mail/SMS/VAPID/cola |
| `src/config/sync-indexes.js` | Modelos de `notify_*` en lugar de inventario |
| `src/modules/foundation/limits/*` | Plan único `free` con límites de notify |
| `src/modules/foundation/sys-overview/*` | Métricas de notificaciones |
| `src/modules/foundation/sys-companies/*` | Estado, baja lógica y consumo |
| `src/routes/index.js` | Composición pública / foundation / empresa |
| `src/server.js` | Arranque del worker de entregas |

## Eliminado

```
src/modules/inventory/
src/routes/inventory.routes.js
src/middlewares/inventory.middleware.js
```

## Nuevo dominio

```
src/modules/notify/
src/middlewares/api-key.middleware.js
src/routes/{public,company}.routes.js
```

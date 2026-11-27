# Foundation

El foundation (auth, usuarios, tokens, empleados, feedback, límites y panel
`sys`) ya **no vive en este repositorio**: se consume desde el paquete
`nemkit` mediante `createFoundation`.

## Configuración

`src/config/foundation.js` construye el módulo con las dependencias del
proyecto:

```js
const foundation = createFoundation({
  env,        // .env de nemkit-notify-api
  logger,
  plans,      // catálogo de planes de Notify
  counters,   // conteo de API keys para los límites
  metrics,    // resumen de notificaciones para /sys
});
```

`nemkit` no arranca servidor, no conecta Mongo y no lee `.env`: todo se inyecta
desde aquí.

## Montaje

```js
router.use('/', publicRoutes);
router.use('/foundation', foundation.router);
router.use('/company', companyRoutes);
```

Con `API_PREFIX=/api/v1/notify`, las rutas quedan en
`/api/v1/notify/foundation/...`.

## Modelos

Las colecciones conservan el prefijo `foundation_`:

- `foundation_users`
- `foundation_tokens`
- `foundation_employees`
- `foundation_feedback`

## Dominio propio de Notify

```
src/modules/notify/
src/middlewares/api-key.middleware.js
src/routes/{public,company}.routes.js
src/config/plans.js
```

El perfil de empresa ya no se sirve en `/company/profile`; ahora es
`/foundation/users/profile`.

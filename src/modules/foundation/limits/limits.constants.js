"use strict";

/** Periodicidad de un límite: tope de existencia o consumo mensual. */
const LIMIT_PERIOD = Object.freeze({
  TOTAL: "total",
  MONTH: "month",
});

/** Zona horaria que define el corte del mes para los límites mensuales. */
const BUSINESS_TIMEZONE = "America/Bogota";

/**
 * Catálogo único de planes. Precio, límites y topes viven SOLO aquí: el usuario
 * guarda únicamente el código del plan en `limitUsage.plan.code`, de modo que
 * cualquier cambio se refleja sin migrar datos (igual que en inventario).
 */
const PLANS = Object.freeze({
  free: Object.freeze({
    code: "free",
    name: "Gratuito",
    price: 0,
    currency: "COP",
    limits: Object.freeze({
      topics: Object.freeze({ max: 10, period: LIMIT_PERIOD.TOTAL }),
      subscribers: Object.freeze({ max: 1000, period: LIMIT_PERIOD.TOTAL }),
      apiKeys: Object.freeze({ max: 3, period: LIMIT_PERIOD.TOTAL }),
      notifications: Object.freeze({ max: 1000, period: LIMIT_PERIOD.MONTH }),
    }),
    // Topes por petición: no se acumulan, se validan en el momento.
    caps: Object.freeze({
      broadcastRecipients: 1000,
    }),
  }),
});

/** Plan por defecto y fallback para documentos sin `limitUsage`. */
const DEFAULT_PLAN = "free";

const LIMIT_LABELS = Object.freeze({
  topics: "temas",
  subscribers: "suscriptores",
  apiKeys: "API keys",
  notifications: "notificaciones",
});

module.exports = {
  LIMIT_PERIOD,
  BUSINESS_TIMEZONE,
  PLANS,
  DEFAULT_PLAN,
  LIMIT_LABELS,
};

'use strict';

const { foundation: nemkitFoundation } = require('nemkit');

const { LIMIT_PERIOD } = nemkitFoundation.constants;

/**
 * Catálogo de planes de Notify. Vive en el proyecto implementador: nemkit solo
 * aporta la mecánica de límites y el proyecto define precios y topes.
 */
const PLANS = Object.freeze({
  free: Object.freeze({
    code: 'free',
    name: 'Gratuito',
    price: 0,
    currency: 'COP',
    limits: Object.freeze({
      apiKeys: Object.freeze({ max: 3, period: LIMIT_PERIOD.TOTAL }),
      notifications: Object.freeze({ max: 1000, period: LIMIT_PERIOD.MONTH }),
    }),
    caps: Object.freeze({}),
  }),
});

module.exports = { PLANS };

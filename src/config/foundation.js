'use strict';

const { createFoundation } = require('nemkit');
const { env } = require('./env');
const logger = require('./logger');
const { PLANS } = require('./plans');
const ApiKey = require('../modules/notify/api-keys/api-keys.model');
const { notificationsService } = require('../modules/notify/notifications/notifications.service');

/**
 * Foundation transversal provista por nemkit, configurada con las dependencias
 * de este proyecto: su `.env`, su logger, su catálogo de planes y sus métricas
 * de dominio.
 */
const foundation = createFoundation({
  env,
  logger,
  plans: PLANS,
  counters: {
    apiKeys: (userId) => ApiKey.countDocuments({ userId, recordStatus: 'active' }),
  },
  metrics: {
    globalSummary: async () => ({ notifications: await notificationsService.globalSummary() }),
    companySummary: (userId) => notificationsService.summary(userId),
  },
});

module.exports = { foundation };

'use strict';

const logger = require('./logger');

/**
 * Sincroniza los índices declarados en los esquemas con la base de datos.
 * Idempotente. Si una colección tiene datos que violan un índice único nuevo
 * (p. ej. emails duplicados preexistentes), la sincronización de ese modelo
 * falla con un aviso claro, sin tumbar el arranque del servidor.
 */
async function syncIndexes() {
  const models = [
    require('../modules/foundation/users/users.model'),
    require('../modules/foundation/tokens/tokens.model'),
    require('../modules/foundation/employees/employees.model'),
    require('../modules/foundation/feedback/feedback.model'),
    require('../modules/notify/api-keys/api-keys.model'),
    require('../modules/notify/topics/topics.model'),
    require('../modules/notify/subscribers/subscribers.model'),
    require('../modules/notify/notifications/notifications.model'),
  ];

  for (const model of models) {
    try {
      await model.syncIndexes();
    } catch (error) {
      logger.warn(`Index sync failed for ${model.modelName}. Check for data that violates a unique index (e.g. duplicate emails).`, {
        error: error.message,
      });
    }
  }
}

module.exports = { syncIndexes };

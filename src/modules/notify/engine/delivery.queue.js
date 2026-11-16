'use strict';

const { createQueue } = require('nemkit');
const { env } = require('../../../config/env');

/**
 * Cola en memoria de `nemkit`. Mongo guarda el estado de cada entrega, así que
 * la cola solo transporta el id. Sin reintentos: el processor nunca relanza.
 */
const deliveryQueue = createQueue('notify-deliveries', {
  concurrency: env.NOTIFY_QUEUE_CONCURRENCY,
  jobTimeoutMs: env.NOTIFY_JOB_TIMEOUT_MS,
  // Sin reintentos: el estado terminal de cada entrega lo escribe el processor.
  maxRetries: 0,
});

module.exports = { deliveryQueue };

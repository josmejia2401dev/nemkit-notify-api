'use strict';

const logger = require('../../config/logger');
const { deliveryQueue } = require('./engine/delivery.queue');
const { deliveryProcessor } = require('./engine/delivery.processor');
const { notificationsService } = require('./notifications/notifications.service');

/**
 * Arranca el procesamiento de entregas en el mismo proceso del API. Antes de
 * registrar el handler se re-encolan las entregas que quedaron `queued` en un
 * arranque anterior: Mongo es la fuente de verdad, no la cola.
 */
async function startNotifyWorker() {
  deliveryQueue.process((job) => deliveryProcessor.process(job.data.deliveryId));

  try {
    const pending = await notificationsService.pendingIds(500);
    if (pending.length) {
      deliveryQueue.addBulk(pending.map((item) => ({ data: { deliveryId: item.id } })));
      logger.info(`Re-enqueued ${pending.length} pending notification deliveries`);
    }
  } catch (error) {
    logger.warn('Could not re-enqueue pending deliveries', { error: error.message });
  }
}

module.exports = { startNotifyWorker };

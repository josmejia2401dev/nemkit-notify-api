'use strict';

const logger = require('../../../config/logger');
const { DELIVERY_STATUS } = require('../notify.constants');
const { notificationsService } = require('../notifications/notifications.service');
const { subscribersService } = require('../subscribers/subscribers.service');
const { getStrategy } = require('./strategies');

class DeliveryProcessor {
  /**
   * Procesa una entrega. Captura cualquier error y lo persiste: el job de la
   * cola siempre completa, por lo que no existen reintentos ni dead-letter.
   */
  async process(deliveryId) {
    let delivery = null;

    try {
      delivery = await notificationsService.findById(deliveryId);
      if (!delivery || delivery.status !== DELIVERY_STATUS.QUEUED) return;

      const strategy = getStrategy(delivery.channel);
      if (!strategy) {
        throw Object.assign(new Error(`Unsupported channel: ${delivery.channel}`), {
          code: 'UNSUPPORTED_CHANNEL',
        });
      }

      const subscriber = await subscribersService.findById(delivery.subscriberId);
      if (!subscriber) {
        throw Object.assign(new Error('Subscriber not found'), { code: 'SUBSCRIBER_NOT_FOUND' });
      }

      const result = await strategy.send({ delivery, subscriber });
      await notificationsService.markSent(delivery.id, result);
    } catch (error) {
      logger.warn('Notification delivery failed', {
        deliveryId,
        channel: delivery?.channel,
        code: error?.code,
        error: error?.message,
      });
      // Si falla la escritura del estado, se registra y se descarta el job.
      await notificationsService.markFailed(deliveryId, error).catch(() => null);
    }
  }
}

module.exports = { DeliveryProcessor, deliveryProcessor: new DeliveryProcessor() };

'use strict';

const logger = require('../../../config/logger');
const { DELIVERY_STATUS } = require('../notify.constants');
const { notificationsService } = require('../notifications/notifications.service');
const { subscribersService } = require('../subscribers/subscribers.service');
const { emailStrategy } = require('./strategies');

class DeliveryProcessor {
  /**
   * Procesa una entrega de email. Captura cualquier error y lo persiste: el job
   * de la cola siempre completa, por lo que no existen reintentos.
   */
  async process(deliveryId) {
    let delivery = null;

    try {
      delivery = await notificationsService.findById(deliveryId);
      if (!delivery || delivery.status !== DELIVERY_STATUS.QUEUED) return;

      const subscriber = await subscribersService.findById(delivery.subscriberId);
      if (!subscriber) {
        throw Object.assign(new Error('Subscriber not found'), { code: 'SUBSCRIBER_NOT_FOUND' });
      }

      const result = await emailStrategy.send({ delivery, subscriber });
      await notificationsService.markSent(delivery.id, result);
    } catch (error) {
      logger.warn('Notification delivery failed', {
        deliveryId,
        code: error?.code,
        error: error?.message,
      });
      await notificationsService.markFailed(deliveryId, error).catch(() => null);
    }
  }
}

module.exports = { DeliveryProcessor, deliveryProcessor: new DeliveryProcessor() };

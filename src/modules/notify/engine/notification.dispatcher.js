'use strict';

const { HttpError, UniqueNumberUtil } = require('nemkit');
const { CHANNELS, CHANNEL, DELIVERY_STATUS } = require('../notify.constants');
const { subscribersService } = require('../subscribers/subscribers.service');
const { topicsService } = require('../topics/topics.service');
const { notificationsService } = require('../notifications/notifications.service');
const { limitsService } = require('../../foundation/limits/limits.service');
const { deliveryQueue } = require('./delivery.queue');

/** Destino visible de cada canal; vacío si el suscriptor no lo tiene cargado. */
const DESTINATIONS = Object.freeze({
  [CHANNEL.EMAIL]: (subscriber) => String(subscriber?.email ?? '').trim(),
  [CHANNEL.SMS]: (subscriber) => String(subscriber?.phone ?? '').trim(),
  [CHANNEL.WEBPUSH]: (subscriber) => (subscriber?.webpush?.length ? 'webpush' : ''),
});

function normalizeChannels(value) {
  if (!Array.isArray(value) || value.length === 0) {
    throw HttpError.badRequest('channels must contain at least one channel');
  }
  const invalid = value.filter((channel) => !CHANNELS.includes(channel));
  if (invalid.length) {
    throw HttpError.badRequest(`Unsupported channels: ${invalid.join(', ')}`);
  }
  return [...new Set(value)];
}

function buildDocument({ userId, channel, destination, subscriber, topicId, batchId, payload }) {
  return {
    userId,
    channel,
    subscriberId: subscriber.id,
    topicId: topicId ?? null,
    batchId: batchId ?? null,
    destination,
    title: payload.title,
    body: payload.body,
    data: payload.data ?? {},
    status: DELIVERY_STATUS.QUEUED,
  };
}

class NotificationDispatcher {
  /** Envío directo a un suscriptor, un documento por canal solicitado. */
  async send(userId, payload, actorId) {
    const channels = normalizeChannels(payload.channels);
    const subscriber = await subscribersService.get(userId, payload.subscriberId);

    const documents = channels.map((channel) => {
      const destination = DESTINATIONS[channel](subscriber);
      if (!destination) {
        throw new HttpError(400, `Subscriber has no ${channel} contact`, {
          code: 'MISSING_CHANNEL_CONTACT',
        });
      }
      return buildDocument({
        userId,
        channel,
        destination,
        subscriber,
        payload,
      });
    });

    await limitsService.assertCanConsume(userId, 'notifications', documents.length);
    return this.#queue(userId, documents, actorId, documents.length);
  }

  /** Envío masivo a los suscriptores de un tema, acotado por el tope del plan. */
  async broadcast(userId, payload, actorId) {
    const channels = normalizeChannels(payload.channels);
    const topic = await topicsService.assertOwned(userId, payload.topicId);

    const usage = await limitsService.getLimitUsage(userId);
    const maxRecipients = usage.caps.broadcastRecipients ?? 0;

    const subscribers = await subscribersService.listByTopic(
      userId,
      topic.id,
      maxRecipients ? maxRecipients + 1 : undefined,
    );
    if (maxRecipients && subscribers.length > maxRecipients) {
      await limitsService.assertCanBroadcast(userId, subscribers.length);
    }

    const batchId = `batch_${UniqueNumberUtil.generateRaw()}`;
    const documents = [];
    for (const subscriber of subscribers) {
      for (const channel of channels) {
        const destination = DESTINATIONS[channel](subscriber);
        if (!destination) continue;
        documents.push(
          buildDocument({
            userId,
            channel,
            destination,
            subscriber,
            topicId: topic.id,
            batchId,
            payload,
          }),
        );
      }
    }

    if (!documents.length) {
      throw HttpError.badRequest('No subscribers with the requested channels in this topic');
    }

    await limitsService.assertCanConsume(userId, 'notifications', documents.length);
    return this.#queue(userId, documents, actorId, subscribers.length, batchId);
  }

  async #queue(userId, documents, actorId, recipients, batchId = null) {
    const created = await notificationsService.enqueue(documents, actorId);
    deliveryQueue.addBulk(created.map((item) => ({ data: { deliveryId: item.id } })));
    await limitsService.recordUsage(userId, 'notifications', documents.length);

    return {
      batchId,
      recipients,
      deliveryIds: created.map((item) => item.id),
      status: DELIVERY_STATUS.QUEUED,
    };
  }
}

module.exports = { NotificationDispatcher, notificationDispatcher: new NotificationDispatcher() };

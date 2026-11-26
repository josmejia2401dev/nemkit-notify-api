'use strict';

const { HttpError, UniqueNumberUtil } = require('nemkit');
const { CHANNEL, DELIVERY_STATUS } = require('../notify.constants');
const { subscribersService } = require('../subscribers/subscribers.service');
const { topicsService } = require('../topics/topics.service');
const { notificationsService } = require('../notifications/notifications.service');
const { limitsService } = require('../../foundation/limits/limits.service');
const { deliveryQueue } = require('./delivery.queue');
const { sendEmail, mailjetConfigured, EMAIL_SPAM_WARNING } = require('./email.service');

function buildDocument({ userId, destination, subscriber, topicId, batchId, payload }) {
  return {
    userId,
    channel: CHANNEL.EMAIL,
    subscriberId: subscriber.id,
    topicId: topicId ?? null,
    batchId: batchId ?? null,
    destination,
    title: payload.title,
    body: payload.body,
    data: {
      ...(payload.data ?? {}),
      ...(payload.html ? { html: payload.html } : {}),
    },
    status: DELIVERY_STATUS.QUEUED,
  };
}

class NotificationDispatcher {
  /** Envío directo a un suscriptor por email. */
  async send(userId, payload, actorId) {
    const subscriber = await subscribersService.get(userId, payload.subscriberId);
    const destination = String(subscriber?.email ?? '').trim();
    if (!destination) {
      throw new HttpError(400, 'Subscriber has no email', {
        code: 'MISSING_CHANNEL_CONTACT',
      });
    }

    const documents = [buildDocument({
      userId,
      destination,
      subscriber,
      payload,
    })];

    await limitsService.assertCanConsume(userId, 'notifications', documents.length);
    return this.#queue(userId, documents, actorId, documents.length);
  }

  /** Envío masivo a los suscriptores con email de un tema. */
  async broadcast(userId, payload, actorId) {
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
      const destination = String(subscriber?.email ?? '').trim();
      if (!destination) continue;
      documents.push(
        buildDocument({
          userId,
          destination,
          subscriber,
          topicId: topic.id,
          batchId,
          payload,
        }),
      );
    }

    if (!documents.length) {
      throw HttpError.badRequest('No subscribers with email in this topic');
    }

    await limitsService.assertCanConsume(userId, 'notifications', documents.length);
    return this.#queue(userId, documents, actorId, documents.length, batchId);
  }

  /**
   * Envío directo de un correo tal como lo entrega el cliente, sin plantillas.
   * Se registra en el historial y consume el límite mensual de notificaciones.
   */
  async sendEmail(userId, payload, actorId) {
    if (!mailjetConfigured()) {
      throw new HttpError(503, 'Email channel is not configured', {
        code: 'EMAIL_NOT_CONFIGURED',
      });
    }

    await limitsService.assertCanConsume(userId, 'notifications', 1);

    const [notification] = await notificationsService.enqueue([
      {
        userId,
        channel: CHANNEL.EMAIL,
        subscriberId: null,
        topicId: null,
        batchId: null,
        destination: payload.to,
        title: payload.subject,
        body: payload.text,
        data: {
          html: payload.html ?? null,
          toName: payload.toName ?? null,
          source: 'api',
        },
        status: DELIVERY_STATUS.QUEUED,
      },
    ], actorId);

    let result;
    try {
      result = await sendEmail({
        to: payload.to,
        toName: payload.toName,
        subject: payload.subject,
        text: payload.text,
        html: payload.html,
      });
    } catch (error) {
      await notificationsService.markFailed(notification.id, error).catch(() => null);
      throw new HttpError(502, `Email could not be sent: ${error.message}`, {
        code: error.code ?? 'EMAIL_SEND_FAILED',
      });
    }

    await notificationsService.markSent(notification.id, result).catch(() => null);
    await limitsService.recordUsage(userId, 'notifications', 1).catch(() => null);
    const usage = await limitsService.getLimitUsage(userId).catch(() => null);
    const notifications = usage?.limits?.notifications ?? null;

    return {
      id: notification.id,
      status: DELIVERY_STATUS.SENT,
      channel: CHANNEL.EMAIL,
      destination: payload.to,
      provider: result.provider,
      providerMessageId: result.providerMessageId,
      spamWarning: EMAIL_SPAM_WARNING,
      warnings: [EMAIL_SPAM_WARNING],
      usage: notifications
        ? {
          used: notifications.used,
          max: notifications.max,
          remaining: notifications.remaining,
          period: usage?.period ?? null,
          limitPeriod: notifications.period,
        }
        : null,
    };
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

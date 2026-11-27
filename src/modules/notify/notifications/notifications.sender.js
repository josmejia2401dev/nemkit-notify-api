'use strict';

const { HttpError } = require('nemkit');
const { foundation } = require('../../../config/foundation');
const { notificationsService } = require('./notifications.service');
const { sendEmail, mailjetConfigured, EMAIL_SPAM_WARNING } = require('./email.service');

/**
 * Envío directo de email: recibe la petición y entrega enseguida, sin cola ni
 * reintentos. Cada destinatario genera su propia fila de historial.
 */
class NotificationSender {
  async sendEmail(userId, payload, actorId) {
    if (!mailjetConfigured()) {
      throw new HttpError(503, 'Email channel is not configured', {
        code: 'EMAIL_NOT_CONFIGURED',
      });
    }

    const recipients = payload.to;
    const { limits: limitsService } = foundation.services;
    await limitsService.assertCanConsume(userId, 'notifications', recipients.length);

    const deliveries = [];
    let sent = 0;

    for (const destination of recipients) {
      const content = {
        destination,
        subject: payload.subject,
        text: payload.text,
        html: payload.html,
      };

      try {
        const result = await sendEmail({
          to: destination,
          subject: payload.subject,
          text: payload.text,
          html: payload.html,
        });

        sent += 1;
        deliveries.push({
          destination,
          status: 'sent',
          providerMessageId: result.providerMessageId ?? null,
        });
        await notificationsService
          .recordSent(userId, { ...content, ...result }, actorId)
          .catch(() => null);
      } catch (error) {
        deliveries.push({
          destination,
          status: 'failed',
          error: {
            code: error?.code ?? 'EMAIL_SEND_FAILED',
            message: error?.message ?? 'Email could not be sent',
          },
        });
        await notificationsService
          .recordFailed(userId, content, error, actorId)
          .catch(() => null);
      }
    }

    const failed = deliveries.length - sent;
    if (sent === 0) {
      throw new HttpError(502, 'Email could not be sent', {
        code: 'EMAIL_SEND_FAILED',
      });
    }

    await limitsService.recordUsage(userId, 'notifications', sent).catch(() => null);
    const usage = await limitsService.getLimitUsage(userId).catch(() => null);
    const notifications = usage?.limits?.notifications ?? null;

    return {
      status: failed > 0 ? 'partial' : 'sent',
      recipients: recipients.length,
      sent,
      failed,
      deliveries,
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
}

module.exports = { NotificationSender, notificationSender: new NotificationSender() };

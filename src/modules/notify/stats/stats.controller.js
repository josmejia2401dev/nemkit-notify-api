'use strict';

const { success } = require('nemkit');
const { env } = require('../../../config/env');
const { notificationsService } = require('../notifications/notifications.service');

class StatsController {
  /** GET /company/stats/summary — enviados/fallidos/cola por canal. */
  async summary(req, res, next) {
    try {
      return success(res, await notificationsService.summary(req.user.id));
    } catch (error) {
      next(error);
    }
  }

  /** GET /company/stats/timeseries?days=30 — serie diaria por canal y estado. */
  async timeseries(req, res, next) {
    try {
      return success(res, await notificationsService.timeseries(req.user.id, req.query.days));
    } catch (error) {
      next(error);
    }
  }

  /** GET /company/stats/channels — disponibilidad real de cada canal. */
  async channels(_req, res, next) {
    try {
      return success(res, {
        email: Boolean(env.MAIL_HOST),
        sms: Boolean(
          env.SMS_ENABLED
          && env.TWILIO_ACCOUNT_SID
          && env.TWILIO_AUTH_TOKEN
          && env.TWILIO_FROM,
        ),
        webpush: Boolean(env.VAPID_PUBLIC_KEY && env.VAPID_PRIVATE_KEY),
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = { StatsController, statsController: new StatsController() };

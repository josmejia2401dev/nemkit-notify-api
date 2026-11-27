'use strict';

const { success } = require('nemkit');
const { notificationsService } = require('../notifications/notifications.service');
const { mailjetConfigured } = require('../notifications/email.service');

class StatsController {
  /** GET /company/stats/summary — enviados y fallidos. */
  async summary(req, res, next) {
    try {
      return success(res, await notificationsService.summary(req.user.id));
    } catch (error) {
      next(error);
    }
  }

  /** GET /company/stats/timeseries?days=30 — serie diaria por estado. */
  async timeseries(req, res, next) {
    try {
      return success(res, await notificationsService.timeseries(req.user.id, req.query.days));
    } catch (error) {
      next(error);
    }
  }

  /** GET /company/stats/channels — disponibilidad del canal email. */
  async channels(_req, res, next) {
    try {
      return success(res, { email: mailjetConfigured() });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = { StatsController, statsController: new StatsController() };

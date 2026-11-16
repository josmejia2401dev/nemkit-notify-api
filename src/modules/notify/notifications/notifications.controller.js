'use strict';

const { success, paginated } = require('nemkit');
const { notificationsService } = require('./notifications.service');
const { notificationDispatcher } = require('../engine/notification.dispatcher');
const { listQuerySchema, notificationIdSchema, sendSchema, broadcastSchema } = require('./notifications.validator');

function check(schema, data, req, res) {
  const result = schema.check(data ?? {}, req);
  if (result.errorResponse) {
    res.status(400).json(result.errorResponse);
    return null;
  }
  return result.sanitized;
}

class NotificationsController {
  /** GET /company/notifications — historial del tenant. */
  async list(req, res, next) {
    try {
      const query = check(listQuerySchema, req.query, req, res);
      if (!query) return;
      const result = await notificationsService.list(req.user.id, query);
      return paginated(res, result.data, result.pagination);
    } catch (error) {
      next(error);
    }
  }

  /** GET /company/notifications/:id */
  async get(req, res, next) {
    try {
      const params = check(notificationIdSchema, req.params, req, res);
      if (!params) return;
      return success(res, await notificationsService.get(req.user.id, params.id));
    } catch (error) {
      next(error);
    }
  }

  /** POST /notifications/send — API pública. */
  async send(req, res, next) {
    try {
      const body = check(sendSchema, req.body, req, res);
      if (!body) return;
      const result = await notificationDispatcher.send(req.tenant.userId, body, req.tenant.apiKeyId);
      return success(res, result, 'Notification queued', 202);
    } catch (error) {
      next(error);
    }
  }

  /** POST /notifications/broadcast — API pública. */
  async broadcast(req, res, next) {
    try {
      const body = check(broadcastSchema, req.body, req, res);
      if (!body) return;
      const result = await notificationDispatcher.broadcast(req.tenant.userId, body, req.tenant.apiKeyId);
      return success(res, result, 'Broadcast queued', 202);
    } catch (error) {
      next(error);
    }
  }

  /** GET /notifications/:id — API pública (estado de la entrega). */
  async status(req, res, next) {
    try {
      const params = check(notificationIdSchema, req.params, req, res);
      if (!params) return;
      return success(res, await notificationsService.get(req.tenant.userId, params.id));
    } catch (error) {
      next(error);
    }
  }
}

module.exports = { NotificationsController, notificationsController: new NotificationsController() };

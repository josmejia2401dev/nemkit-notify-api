'use strict';

const { success, paginated } = require('nemkit');
const { notificationsService } = require('./notifications.service');
const { notificationSender } = require('./notifications.sender');
const {
  listQuerySchema,
  notificationIdSchema,
  sendEmailSchema,
  normalizeRecipients,
} = require('./notifications.validator');

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

  /** POST /notifications/email — API pública de email, uno o varios correos. */
  async sendEmail(req, res, next) {
    try {
      const to = normalizeRecipients(req.body?.to);
      const body = check(sendEmailSchema, req.body, req, res);
      if (!body) return;

      const result = await notificationSender.sendEmail(
        req.tenant.userId,
        { ...body, to },
        req.tenant.apiKeyId,
      );
      res.setHeader('X-Notify-Warning', result.spamWarning);
      return success(res, result, 'Email sent', 200);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = { NotificationsController, notificationsController: new NotificationsController() };

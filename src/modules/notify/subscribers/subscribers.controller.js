'use strict';

const { success, created, paginated } = require('nemkit');
const { subscribersService } = require('./subscribers.service');
const {
  listQuerySchema,
  subscriberIdSchema,
  subscriberCreateSchema,
  subscriberUpdateSchema,
  subscribeSchema,
  topicParamSchema,
} = require('./subscribers.validator');

function check(schema, data, req, res) {
  const result = schema.check(data ?? {}, req);
  if (result.errorResponse) {
    res.status(400).json(result.errorResponse);
    return null;
  }
  return result.sanitized;
}

/**
 * Tenant efectivo: el portal usa el `userId` de la sesión y la API pública el
 * `userId` dueño de la API Key. Ambas rutas comparten este controlador.
 */
function tenantId(req) {
  return req.tenant?.userId ?? req.user.id;
}

function actorId(req) {
  return req.tenant?.apiKeyId ?? req.user.actorId ?? req.user.id;
}

class SubscribersController {
  async list(req, res, next) {
    try {
      const query = check(listQuerySchema, req.query, req, res);
      if (!query) return;
      const result = await subscribersService.list(tenantId(req), query);
      return paginated(res, result.data, result.pagination);
    } catch (error) {
      next(error);
    }
  }

  async get(req, res, next) {
    try {
      const params = check(subscriberIdSchema, req.params, req, res);
      if (!params) return;
      return success(res, await subscribersService.get(tenantId(req), params.id));
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const body = check(subscriberCreateSchema, req.body, req, res);
      if (!body) return;
      const subscriber = await subscribersService.create(tenantId(req), body, actorId(req));
      return created(res, subscriber, 'Subscriber created');
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const params = check(subscriberIdSchema, req.params, req, res);
      if (!params) return;
      const body = check(subscriberUpdateSchema, req.body, req, res);
      if (!body) return;
      const subscriber = await subscribersService.update(tenantId(req), params.id, body, actorId(req));
      return success(res, subscriber, 'Subscriber updated');
    } catch (error) {
      next(error);
    }
  }

  async remove(req, res, next) {
    try {
      const params = check(subscriberIdSchema, req.params, req, res);
      if (!params) return;
      await subscribersService.remove(tenantId(req), params.id, actorId(req));
      return success(res, { id: params.id }, 'Subscriber deleted');
    } catch (error) {
      next(error);
    }
  }

  async subscribe(req, res, next) {
    try {
      const params = check(subscriberIdSchema, req.params, req, res);
      if (!params) return;
      const body = check(subscribeSchema, req.body, req, res);
      if (!body) return;
      const subscriber = await subscribersService.subscribe(
        tenantId(req),
        params.id,
        body.topicIds,
        actorId(req),
      );
      return success(res, subscriber, 'Subscribed');
    } catch (error) {
      next(error);
    }
  }

  async unsubscribe(req, res, next) {
    try {
      const params = check(topicParamSchema, req.params, req, res);
      if (!params) return;
      const subscriber = await subscribersService.unsubscribe(
        tenantId(req),
        params.id,
        params.topicId,
        actorId(req),
      );
      return success(res, subscriber, 'Unsubscribed');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = { SubscribersController, subscribersController: new SubscribersController() };

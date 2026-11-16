'use strict';

const { success, created, paginated } = require('nemkit');
const { apiKeysService } = require('./api-keys.service');
const { listQuerySchema, apiKeyIdSchema, apiKeyCreateSchema } = require('./api-keys.validator');

function check(schema, data, req, res) {
  const result = schema.check(data ?? {}, req);
  if (result.errorResponse) {
    res.status(400).json(result.errorResponse);
    return null;
  }
  return result.sanitized;
}

class ApiKeysController {
  async list(req, res, next) {
    try {
      const query = check(listQuerySchema, req.query, req, res);
      if (!query) return;
      const result = await apiKeysService.list(req.user.id, query);
      return paginated(res, result.data, result.pagination);
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const body = check(apiKeyCreateSchema, req.body, req, res);
      if (!body) return;
      const apiKey = await apiKeysService.create(req.user.id, body, req.user.actorId ?? req.user.id);
      return created(res, apiKey, 'API key creada');
    } catch (error) {
      next(error);
    }
  }

  async revoke(req, res, next) {
    try {
      const params = check(apiKeyIdSchema, req.params, req, res);
      if (!params) return;
      await apiKeysService.revoke(req.user.id, params.id, req.user.actorId ?? req.user.id);
      return success(res, { id: params.id }, 'API key revocada');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = { ApiKeysController, apiKeysController: new ApiKeysController() };

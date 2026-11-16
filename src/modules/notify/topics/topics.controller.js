'use strict';

const { success, created, paginated } = require('nemkit');
const { topicsService } = require('./topics.service');
const { listQuerySchema, topicIdSchema, topicCreateSchema, topicUpdateSchema } = require('./topics.validator');

function check(schema, data, req, res) {
  const result = schema.check(data ?? {}, req);
  if (result.errorResponse) {
    res.status(400).json(result.errorResponse);
    return null;
  }
  return result.sanitized;
}

class TopicsController {
  async list(req, res, next) {
    try {
      const query = check(listQuerySchema, req.query, req, res);
      if (!query) return;
      const result = await topicsService.list(req.user.id, query);
      return paginated(res, result.data, result.pagination);
    } catch (error) {
      next(error);
    }
  }

  async get(req, res, next) {
    try {
      const params = check(topicIdSchema, req.params, req, res);
      if (!params) return;
      return success(res, await topicsService.get(req.user.id, params.id));
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const body = check(topicCreateSchema, req.body, req, res);
      if (!body) return;
      const topic = await topicsService.create(req.user.id, body, req.user.actorId ?? req.user.id);
      return created(res, topic, 'Tema creado');
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const params = check(topicIdSchema, req.params, req, res);
      if (!params) return;
      const body = check(topicUpdateSchema, req.body, req, res);
      if (!body) return;
      const topic = await topicsService.update(req.user.id, params.id, body, req.user.actorId ?? req.user.id);
      return success(res, topic, 'Tema actualizado');
    } catch (error) {
      next(error);
    }
  }

  async remove(req, res, next) {
    try {
      const params = check(topicIdSchema, req.params, req, res);
      if (!params) return;
      await topicsService.remove(req.user.id, params.id, req.user.actorId ?? req.user.id);
      return success(res, { id: params.id }, 'Tema eliminado');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = { TopicsController, topicsController: new TopicsController() };

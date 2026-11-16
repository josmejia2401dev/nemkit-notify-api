'use strict';

const { BaseService, HttpError } = require('nemkit');
const { TopicsRepository } = require('./topics.repository');
const { paginationOptions } = require('../../foundation/query.utils');
const { limitsService } = require('../../foundation/limits/limits.service');

/** Slug determinista y seguro para URL a partir del nombre. */
function toSlug(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

class TopicsService extends BaseService {
  constructor() {
    super(new TopicsRepository());
    this.notFoundMessage = 'Topic not found';
  }

  async list(userId, query = {}) {
    const { page, limit, search } = paginationOptions(query);
    const result = await this.filterAndPaginate(
      { userId },
      {
        page,
        limit,
        sort: { createdAt: -1 },
        search: search ? { value: search, fields: ['name', 'slug'] } : null,
      },
    );
    const counts = await this.repository.countSubscribersByTopic(
      userId,
      result.data.map((topic) => topic.id),
    );
    return {
      data: result.data.map((topic) => ({
        ...topic,
        subscriberCount: counts.get(topic.id) ?? 0,
      })),
      pagination: result.pagination,
    };
  }

  async get(userId, id) {
    const topic = await this.findOne({ _id: id, userId });
    if (!topic) throw HttpError.notFound('Topic not found');
    const counts = await this.repository.countSubscribersByTopic(userId, [topic.id]);
    return { ...topic, subscriberCount: counts.get(topic.id) ?? 0 };
  }

  async create(userId, data, actorId) {
    await limitsService.assertCanCreate(userId, 'topics');
    const name = String(data.name ?? '').trim();
    const slug = toSlug(data.slug || name);
    if (!slug) throw HttpError.badRequest('slug is required');
    try {
      return await super.create({ userId, name, slug, description: data.description ?? '' }, actorId);
    } catch (error) {
      if (error?.code === 11000) throw HttpError.conflict('A topic with this slug already exists');
      throw error;
    }
  }

  async update(userId, id, data, actorId) {
    const topic = await this.findOne({ _id: id, userId });
    if (!topic) throw HttpError.notFound('Topic not found');

    const update = {};
    if (data.name !== undefined) update.name = String(data.name).trim();
    if (data.description !== undefined) update.description = data.description;
    if (data.slug !== undefined) update.slug = toSlug(data.slug);
    if (update.slug === '') throw HttpError.badRequest('slug is required');

    try {
      return await this.updateById(id, update, actorId);
    } catch (error) {
      if (error?.code === 11000) throw HttpError.conflict('A topic with this slug already exists');
      throw error;
    }
  }

  /** Baja lógica: el historial de envíos se conserva intacto. */
  async remove(userId, id, actorId) {
    const topic = await this.findOne({ _id: id, userId });
    if (!topic) throw HttpError.notFound('Topic not found');
    return this.softDelete(id, actorId);
  }

  /** Verifica pertenencia al tenant; devuelve el documento o lanza 404. */
  async assertOwned(userId, id) {
    const topic = await this.findOne({ _id: id, userId });
    if (!topic) throw HttpError.notFound('Topic not found');
    return topic;
  }
}

module.exports = { TopicsService, topicsService: new TopicsService() };

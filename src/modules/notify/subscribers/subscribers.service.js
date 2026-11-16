'use strict';

const { BaseService, HttpError } = require('nemkit');
const { SubscribersRepository } = require('./subscribers.repository');
const { paginationOptions } = require('../../foundation/query.utils');
const { limitsService } = require('../../foundation/limits/limits.service');
const { topicsService } = require('../topics/topics.service');

/** Normaliza la suscripción WebPush: acepta un objeto o un arreglo. */
function normalizeWebpush(value) {
  if (value == null) return undefined;
  if (Array.isArray(value)) return value;
  return [value];
}

/** Verifica que el suscriptor tenga al menos un canal de contacto utilizable. */
function assertHasContact(data) {
  const hasEmail = Boolean(String(data.email ?? '').trim());
  const hasPhone = Boolean(String(data.phone ?? '').trim());
  const hasWebpush = Array.isArray(data.webpush) && data.webpush.length > 0;
  if (!hasEmail && !hasPhone && !hasWebpush) {
    throw HttpError.badRequest('At least one contact channel is required (email, phone or webpush)');
  }
}

class SubscribersService extends BaseService {
  constructor() {
    super(new SubscribersRepository());
    this.notFoundMessage = 'Subscriber not found';
  }

  list(userId, query = {}) {
    const { page, limit, search } = paginationOptions(query);
    const filter = { userId };
    if (query.topicId !== undefined) filter.topicIds = Number(query.topicId);
    return this.filterAndPaginate(filter, {
      page,
      limit,
      sort: { createdAt: -1 },
      search: search ? { value: search, fields: ['externalId', 'email', 'phone'] } : null,
    });
  }

  async get(userId, id) {
    const subscriber = await this.findOne({ _id: id, userId });
    if (!subscriber) throw HttpError.notFound('Subscriber not found');
    return subscriber;
  }

  async create(userId, data, actorId) {
    await limitsService.assertCanCreate(userId, 'subscribers');
    const payload = {
      userId,
      externalId: String(data.externalId ?? '').trim(),
      email: String(data.email ?? '').trim(),
      phone: String(data.phone ?? '').trim(),
      locale: data.locale ?? 'es',
      attributes: data.attributes ?? {},
      webpush: normalizeWebpush(data.webpush) ?? [],
      topicIds: [],
    };
    assertHasContact(payload);
    try {
      return await super.create(payload, actorId);
    } catch (error) {
      if (error?.code === 11000) throw HttpError.conflict('A subscriber with this externalId already exists');
      throw error;
    }
  }

  async update(userId, id, data, actorId) {
    await this.get(userId, id);

    const update = {};
    if (data.externalId !== undefined) update.externalId = String(data.externalId).trim();
    if (data.email !== undefined) update.email = String(data.email).trim();
    if (data.phone !== undefined) update.phone = String(data.phone).trim();
    if (data.locale !== undefined) update.locale = data.locale;
    if (data.attributes !== undefined) update.attributes = data.attributes;
    if (data.webpush !== undefined) update.webpush = normalizeWebpush(data.webpush);

    try {
      return await this.updateById(id, update, actorId);
    } catch (error) {
      if (error?.code === 11000) throw HttpError.conflict('A subscriber with this externalId already exists');
      throw error;
    }
  }

  async remove(userId, id, actorId) {
    await this.get(userId, id);
    return this.softDelete(id, actorId);
  }

  async findByExternalId(userId, externalId) {
    const subscriber = await this.findOne({ userId, externalId: String(externalId ?? '').trim() });
    if (!subscriber) throw HttpError.notFound('Subscriber not found');
    return subscriber;
  }

  /** Suscribe a uno o varios temas validando que pertenezcan a la empresa. */
  async subscribe(userId, id, topicIds, actorId) {
    await this.get(userId, id);

    const unique = [...new Set((topicIds ?? []).map(Number))];
    if (!unique.length) throw HttpError.badRequest('topicIds must contain at least one topic');
    await Promise.all(unique.map((topicId) => topicsService.assertOwned(userId, topicId)));

    const updated = await this.repository.addTopics(id, unique, actorId);
    if (!updated) throw HttpError.notFound('Subscriber not found');
    return updated;
  }

  async unsubscribe(userId, id, topicId, actorId) {
    await this.get(userId, id);
    await topicsService.assertOwned(userId, topicId);

    const updated = await this.repository.removeTopic(id, topicId, actorId);
    if (!updated) throw HttpError.notFound('Subscriber not found');
    return updated;
  }

  /** Destinatarios de un broadcast, acotados al máximo del plan. */
  listByTopic(userId, topicId, limit) {
    return this.repository.listByTopic(userId, topicId, limit);
  }
}

module.exports = { SubscribersService, subscribersService: new SubscribersService() };

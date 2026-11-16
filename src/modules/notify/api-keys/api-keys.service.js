'use strict';

const crypto = require('crypto');
const { BaseService, HttpError } = require('nemkit');
const { ApiKeysRepository } = require('./api-keys.repository');
const { paginationOptions } = require('../../foundation/query.utils');
const { limitsService } = require('../../foundation/limits/limits.service');

class ApiKeysService extends BaseService {
  constructor() {
    super(new ApiKeysRepository());
    this.notFoundMessage = 'API key not found';
  }

  list(userId, query = {}) {
    const { page, limit, search } = paginationOptions(query);
    return this.filterAndPaginate(
      { userId },
      {
        page,
        limit,
        sort: { createdAt: -1 },
        search: search ? { value: search, fields: ['name'] } : null,
      },
    );
  }

  async create(userId, data, actorId) {
    await limitsService.assertCanCreate(userId, 'apiKeys');
    return super.create(
      {
        userId,
        name: String(data.name ?? '').trim(),
        key: `nk_live_${crypto.randomBytes(24).toString('hex')}`,
        lastUsedAt: null,
      },
      actorId,
    );
  }

  async revoke(userId, id, actorId) {
    const record = await this.findOne({ _id: id, userId });
    if (!record) throw HttpError.notFound('API key not found');
    return this.softDelete(id, actorId);
  }

  findActiveByKey(key) {
    return this.repository.findActiveByKey(String(key ?? '').trim());
  }

  /** Registro best-effort del último uso; nunca bloquea la petición. */
  touch(id) {
    return this.updateById(id, { lastUsedAt: new Date() }).catch(() => null);
  }
}

module.exports = { ApiKeysService, apiKeysService: new ApiKeysService() };

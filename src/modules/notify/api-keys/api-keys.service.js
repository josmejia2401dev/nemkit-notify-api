'use strict';

const crypto = require('crypto');
const { BaseService, HttpError } = require('nemkit');
const { ApiKeysRepository } = require('./api-keys.repository');
const { invalidateApiKey } = require('../cache/cache-keys');
const { foundation } = require('../../../config/foundation');
const { paginationOptions } = foundation;
const { limits: limitsService } = foundation.services;

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
    const revoked = await this.softDelete(id, actorId);
    await invalidateApiKey(record.key);
    return revoked;
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

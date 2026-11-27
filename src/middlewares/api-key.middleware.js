'use strict';

const { HttpError, RECORD_STATUS } = require('nemkit');
const { apiKeysService } = require('../modules/notify/api-keys/api-keys.service');
const { foundation } = require('../config/foundation');
const { users: usersService } = foundation.services;

/**
 * Autenticación del API público por header `api-key`. Simple por diseño:
 * la clave debe existir y estar activa; la empresa debe estar activa.
 */
async function apiKeyAuth(req, _res, next) {
  try {
    const key = String(req.header('api-key') ?? '').trim();
    if (!key) throw HttpError.unauthorized('api-key header is required');

    const record = await apiKeysService.findActiveByKey(key);
    if (!record) throw HttpError.unauthorized('Invalid api-key');

    const owner = await usersService.findById(record.userId);
    if (!owner || owner.recordStatus !== RECORD_STATUS.ACTIVE) {
      throw HttpError.forbidden('Company is not active');
    }

    req.tenant = { userId: record.userId, apiKeyId: record.id };
    apiKeysService.touch(record.id);
    return next();
  } catch (error) {
    return next(error);
  }
}

module.exports = { apiKeyAuth };

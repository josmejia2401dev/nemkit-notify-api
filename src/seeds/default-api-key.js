'use strict';

const { RECORD_STATUS, UniqueNumberUtil } = require('nemkit');
const { foundation } = require('../config/foundation');
const { env } = require('../config/env');
const logger = require('../config/logger');
const ApiKey = require('../modules/notify/api-keys/api-keys.model');

/**
 * Garantiza una API key interna por defecto.
 *
 * - Si la key ya existe, solo asegura que esté activa y con el nombre default.
 * - Si no existe, crea (o reutiliza) la empresa interna del `.env` y la asocia.
 *
 * Idempotente: se ejecuta en cada arranque después del seed del admin.
 */
async function seedDefaultApiKey() {
  const key = String(env.DEFAULT_API_KEY ?? '').trim();
  const name = String(env.DEFAULT_API_KEY_NAME ?? 'default').trim() || 'default';
  if (!key) {
    logger.info('Default API key seed skipped: DEFAULT_API_KEY is empty.');
    return null;
  }

  const existing = await ApiKey.findOne({
    key,
    recordStatus: { $ne: RECORD_STATUS.DELETED },
  });

  if (existing) {
    const update = {};
    if (existing.recordStatus !== RECORD_STATUS.ACTIVE) update.recordStatus = RECORD_STATUS.ACTIVE;
    if (existing.name !== name) update.name = name;
    if (Object.keys(update).length) {
      await ApiKey.updateOne({ _id: existing._id }, { $set: update });
      logger.info('Default API key reactivated/normalized.', { name });
    } else {
      logger.info('Default API key already present.', { name });
    }
    return existing;
  }

  const company = await ensureDefaultCompany();
  if (!company) return null;

  const userId = company._id ?? company.id;
  const created = await ApiKey.create({
    _id: UniqueNumberUtil.generateRaw(),
    userId,
    name,
    key,
    lastUsedAt: null,
    createdBy: userId,
    updatedBy: userId,
  });

  logger.info('Default API key created for internal company.', { name, company: company.companyName });
  return created;
}

async function ensureDefaultCompany() {
  const email = String(env.DEFAULT_API_KEY_EMAIL ?? '').trim().toLowerCase();
  const password = String(env.DEFAULT_API_KEY_PASSWORD ?? '');
  const companyName = String(env.DEFAULT_API_KEY_COMPANY ?? 'Nemkit Internal').trim() || 'Nemkit Internal';

  if (!email || !password) {
    logger.warn('Default API key seed skipped: DEFAULT_API_KEY_EMAIL/PASSWORD are missing.');
    return null;
  }

  const user = await foundation.models.User.findOne({
    email,
    recordStatus: { $ne: RECORD_STATUS.DELETED },
  }).lean();

  if (user) {
    if ((user.roles ?? []).includes('SUPERADMIN')) {
      logger.warn('Default API key seed skipped: the configured email belongs to a SUPERADMIN, not a company.', { email });
      return null;
    }
    if (user.recordStatus !== RECORD_STATUS.ACTIVE || user.emailVerified !== true) {
      await foundation.models.User.updateOne(
        { _id: user._id },
        { $set: { recordStatus: RECORD_STATUS.ACTIVE, emailVerified: true, updatedBy: user._id } },
      );
    }
    return user;
  }

  try {
    const created = await foundation.services.users.create({
      fullName: companyName,
      companyName,
      email,
      password,
      businessType: 'retail',
    });
    await foundation.models.User.updateOne(
      { _id: created.id ?? created._id },
      { $set: { emailVerified: true, 'security.mustChangePassword': false } },
    );
    logger.info('Internal company created for default API key.', { email });
    return created;
  } catch (error) {
    logger.warn('Could not create internal company for default API key.', { error: error.message });
    return null;
  }
}

module.exports = { seedDefaultApiKey };

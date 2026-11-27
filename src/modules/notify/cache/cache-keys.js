'use strict';

const { sha256 } = require('nemkit');
const { cache } = require('../../../config/cache');

const cacheKeys = {
  apiKey: (keyHash) => `apikey:${keyHash}`,
};

async function invalidateApiKey(key) {
  const value = String(key ?? '').trim();
  if (!value) return;
  await cache.del(cacheKeys.apiKey(sha256(value))).catch(() => undefined);
}

module.exports = { cacheKeys, invalidateApiKey };

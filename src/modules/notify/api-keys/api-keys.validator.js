'use strict';

const { createValidator } = require('nemkit');

const listQuerySchema = createValidator({
  page: { type: 'number', toNumber: true, min: 1 },
  limit: { type: 'number', toNumber: true, min: 1, max: 100 },
  search: { type: 'string', trim: true, maxLength: 100 },
});

const apiKeyIdSchema = createValidator({
  id: { type: 'number', required: true, toNumber: true, min: 1 },
});

const apiKeyCreateSchema = createValidator({
  name: { type: 'string', required: true, trim: true, minLength: 2, maxLength: 60 },
});

module.exports = { listQuerySchema, apiKeyIdSchema, apiKeyCreateSchema };

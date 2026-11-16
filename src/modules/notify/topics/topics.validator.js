'use strict';

const { createValidator } = require('nemkit');

const listQuerySchema = createValidator({
  page: { type: 'number', toNumber: true, min: 1 },
  limit: { type: 'number', toNumber: true, min: 1, max: 100 },
  search: { type: 'string', trim: true, maxLength: 100 },
});

const topicIdSchema = createValidator({
  id: { type: 'number', required: true, toNumber: true, min: 1 },
});

const topicCreateSchema = createValidator({
  name: { type: 'string', required: true, trim: true, minLength: 2, maxLength: 60 },
  slug: { type: 'string', trim: true, maxLength: 60 },
  description: { type: 'string', trim: true, maxLength: 200 },
});

const topicUpdateSchema = createValidator({
  name: { type: 'string', trim: true, minLength: 2, maxLength: 60 },
  slug: { type: 'string', trim: true, minLength: 2, maxLength: 60 },
  description: { type: 'string', trim: true, maxLength: 200 },
});

module.exports = { listQuerySchema, topicIdSchema, topicCreateSchema, topicUpdateSchema };

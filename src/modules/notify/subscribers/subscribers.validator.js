'use strict';

const { createValidator } = require('nemkit');

const listQuerySchema = createValidator({
  page: { type: 'number', toNumber: true, min: 1 },
  limit: { type: 'number', toNumber: true, min: 1, max: 100 },
  search: { type: 'string', trim: true, maxLength: 100 },
  topicId: { type: 'number', toNumber: true, min: 1 },
});

const subscriberIdSchema = createValidator({
  id: { type: 'number', required: true, toNumber: true, min: 1 },
});

const subscriberCreateSchema = createValidator({
  externalId: { type: 'string', required: true, trim: true, minLength: 1, maxLength: 100 },
  email: { type: 'email', required: true, trim: true, maxLength: 254 },
  locale: { type: 'string', trim: true, maxLength: 10 },
  attributes: { type: 'object' },
});

const subscriberUpdateSchema = createValidator({
  externalId: { type: 'string', trim: true, minLength: 1, maxLength: 100 },
  email: { type: 'email', trim: true, maxLength: 254 },
  locale: { type: 'string', trim: true, maxLength: 10 },
  attributes: { type: 'object' },
});

const subscribeSchema = createValidator({
  topicIds: { type: 'array', required: true },
});

const topicParamSchema = createValidator({
  id: { type: 'number', required: true, toNumber: true, min: 1 },
  topicId: { type: 'number', required: true, toNumber: true, min: 1 },
});

module.exports = {
  listQuerySchema,
  subscriberIdSchema,
  subscriberCreateSchema,
  subscriberUpdateSchema,
  subscribeSchema,
  topicParamSchema,
};

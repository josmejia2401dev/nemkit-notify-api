'use strict';

const { createValidator } = require('nemkit');

const listQuerySchema = createValidator({
  page: { type: 'number', toNumber: true, min: 1 },
  limit: { type: 'number', toNumber: true, min: 1, max: 100 },
  search: { type: 'string', trim: true, maxLength: 100 },
  channel: { type: 'string', trim: true },
  status: { type: 'string', trim: true },
  from: { type: 'date' },
  to: { type: 'date' },
});

const notificationIdSchema = createValidator({
  id: { type: 'number', required: true, toNumber: true, min: 1 },
});

const messageSchema = {
  channels: { type: 'array', required: true, minLength: 1, maxLength: 3 },
  title: { type: 'string', required: true, trim: true, minLength: 1, maxLength: 120 },
  body: { type: 'string', required: true, trim: true, minLength: 1, maxLength: 2000 },
  data: { type: 'object' },
};

const sendSchema = createValidator({
  subscriberId: { type: 'number', required: true, toNumber: true, min: 1 },
  ...messageSchema,
});

const broadcastSchema = createValidator({
  topicId: { type: 'number', required: true, toNumber: true, min: 1 },
  ...messageSchema,
});

module.exports = { listQuerySchema, notificationIdSchema, sendSchema, broadcastSchema };

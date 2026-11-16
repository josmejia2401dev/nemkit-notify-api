'use strict';

const { mongoose, applyPlatformSchema, RECORD_STATUS } = require('nemkit');

/**
 * API Key de una empresa. Se guarda en claro a propósito: el requisito pide
 * poder verla en cualquier momento desde el portal. El tenant es `userId`.
 */
const ApiKeySchema = applyPlatformSchema({
  userId: { type: Number, required: true, index: true },
  name: { type: String, required: true, trim: true, maxlength: 60 },
  key: { type: String, required: true, trim: true, maxlength: 100 },
  lastUsedAt: { type: Date, default: null },
});

ApiKeySchema.index(
  { key: 1 },
  {
    unique: true,
    partialFilterExpression: {
      recordStatus: {
        $in: [RECORD_STATUS.ACTIVE, RECORD_STATUS.INACTIVE, RECORD_STATUS.ARCHIVED],
      },
    },
  },
);
ApiKeySchema.index({ userId: 1, recordStatus: 1 });

module.exports = mongoose.model('notify_api_keys', ApiKeySchema, 'notify_api_keys');

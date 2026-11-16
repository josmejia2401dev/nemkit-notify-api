'use strict';

const { mongoose, applyPlatformSchema, RECORD_STATUS } = require('nemkit');

/**
 * Tema/tópico de suscripción de una empresa (`userId`). El conteo de
 * suscriptores se calcula en vivo sobre `notify_subscribers.topicIds`.
 */
const TopicSchema = applyPlatformSchema({
  userId: { type: Number, required: true, index: true },
  name: { type: String, required: true, trim: true, maxlength: 60 },
  slug: { type: String, required: true, trim: true, lowercase: true, maxlength: 60 },
  description: { type: String, trim: true, default: '', maxlength: 200 },
});

TopicSchema.index(
  { userId: 1, slug: 1 },
  {
    unique: true,
    partialFilterExpression: {
      recordStatus: {
        $in: [RECORD_STATUS.ACTIVE, RECORD_STATUS.INACTIVE, RECORD_STATUS.ARCHIVED],
      },
    },
  },
);

module.exports = mongoose.model('notify_topics', TopicSchema, 'notify_topics');

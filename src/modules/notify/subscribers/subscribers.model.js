'use strict';

const { mongoose, applyPlatformSchema } = require('nemkit');

/** Suscripción WebPush de un dispositivo del suscriptor final. */
const WebPushSubscriptionSchema = new mongoose.Schema(
  {
    endpoint: { type: String, required: true, trim: true, maxlength: 500 },
    keys: {
      p256dh: { type: String, required: true, trim: true, maxlength: 200 },
      auth: { type: String, required: true, trim: true, maxlength: 100 },
    },
  },
  { _id: false },
);

/**
 * Destinatario de una empresa (`userId`). `externalId` es el identificador del
 * sistema del cliente. Los temas se guardan como arreglo para evitar una
 * colección puente: suscribir es `$addToSet` y desuscribir es `$pull`.
 */
const SubscriberSchema = applyPlatformSchema({
  userId: { type: Number, required: true, index: true },
  externalId: { type: String, required: true, trim: true, maxlength: 100 },
  email: { type: String, trim: true, lowercase: true, default: '', maxlength: 254 },
  phone: { type: String, trim: true, default: '', maxlength: 20 },
  locale: { type: String, trim: true, default: 'es', maxlength: 10 },
  attributes: { type: mongoose.Schema.Types.Mixed, default: {} },
  webpush: { type: [WebPushSubscriptionSchema], default: [] },
  topicIds: { type: [Number], default: [], index: true },
});

SubscriberSchema.index(
  { userId: 1, externalId: 1 },
  {
    unique: true,
    partialFilterExpression: {
      recordStatus: { $in: ['active', 'inactive', 'archived'] },
    },
  },
);
SubscriberSchema.index({ userId: 1, email: 1 });
SubscriberSchema.index({ userId: 1, phone: 1 });

module.exports = mongoose.model('notify_subscribers', SubscriberSchema, 'notify_subscribers');

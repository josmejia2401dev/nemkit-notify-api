'use strict';

const { mongoose, applyPlatformSchema } = require('nemkit');
const { CHANNELS, DELIVERY_STATUS, DELIVERY_STATUSES } = require('../notify.constants');

/**
 * Una fila = un email de un destinatario. Es la unidad del historial y de las
 * métricas de entrega. Notify solo soporta email en este MVP.
 */
const NotificationSchema = applyPlatformSchema({
  userId: { type: Number, required: true, index: true },
  channel: { type: String, enum: CHANNELS, required: true, index: true },
  // Puede ser null en envíos directos por API (correo sin suscriptor).
  subscriberId: { type: Number, default: null, index: true },
  topicId: { type: Number, default: null },
  batchId: { type: String, default: null },
  // Correo destino; en envíos directos no hay suscriptor.
  destination: { type: String, trim: true, default: '', maxlength: 500 },
  title: { type: String, required: true, trim: true, maxlength: 200 },
  body: { type: String, required: true, trim: true, maxlength: 10000 },
  data: { type: mongoose.Schema.Types.Mixed, default: {} },
  status: { type: String, enum: DELIVERY_STATUSES, default: DELIVERY_STATUS.QUEUED, index: true },
  error: {
    code: { type: String, default: null },
    message: { type: String, default: null },
  },
  provider: { type: String, default: null },
  providerMessageId: { type: String, default: null },
  sentAt: { type: Date, default: null },
});

NotificationSchema.index({ userId: 1, createdAt: -1 });
NotificationSchema.index({ userId: 1, channel: 1, status: 1, createdAt: -1 });
NotificationSchema.index({ status: 1, createdAt: 1 });
NotificationSchema.index({ batchId: 1 });

module.exports = mongoose.model('notify_deliveries', NotificationSchema, 'notify_deliveries');

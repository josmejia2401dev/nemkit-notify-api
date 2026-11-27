'use strict';

const { mongoose, applyPlatformSchema } = require('nemkit');
const { CHANNELS, DELIVERY_STATUS, DELIVERY_STATUSES } = require('../notify.constants');

/**
 * Una fila = un email enviado a un destinatario. Es la unidad del historial y
 * de las métricas. El envío es directo: no existe cola ni estado intermedio.
 */
const NotificationSchema = applyPlatformSchema({
  userId: { type: Number, required: true, index: true },
  channel: { type: String, enum: CHANNELS, required: true, index: true },
  destination: { type: String, required: true, trim: true, maxlength: 254 },
  title: { type: String, required: true, trim: true, maxlength: 200 },
  body: { type: String, required: true, trim: true, maxlength: 10000 },
  data: { type: mongoose.Schema.Types.Mixed, default: {} },
  status: { type: String, enum: DELIVERY_STATUSES, default: DELIVERY_STATUS.SENT, index: true },
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

module.exports = mongoose.model('notify_deliveries', NotificationSchema, 'notify_deliveries');

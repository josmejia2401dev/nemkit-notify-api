'use strict';

/** Canal soportado por el motor de notificaciones: únicamente email. */
const CHANNEL = Object.freeze({
  EMAIL: 'email',
});

const CHANNELS = Object.freeze(Object.values(CHANNEL));

/** Estados de una entrega. No hay reintentos: el estado es terminal. */
const DELIVERY_STATUS = Object.freeze({
  QUEUED: 'queued',
  SENT: 'sent',
  FAILED: 'failed',
});

const DELIVERY_STATUSES = Object.freeze(Object.values(DELIVERY_STATUS));

module.exports = {
  CHANNEL,
  CHANNELS,
  DELIVERY_STATUS,
  DELIVERY_STATUSES,
};

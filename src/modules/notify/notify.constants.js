'use strict';

/** Canal soportado por Notify: únicamente email. */
const CHANNEL = Object.freeze({
  EMAIL: 'email',
});

const CHANNELS = Object.freeze(Object.values(CHANNEL));

/** Estado terminal de una entrega. No hay cola ni reintentos. */
const DELIVERY_STATUS = Object.freeze({
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

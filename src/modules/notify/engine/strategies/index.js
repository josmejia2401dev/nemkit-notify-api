'use strict';

const { CHANNEL } = require('../../notify.constants');
const { emailStrategy } = require('./email.strategy');
const { smsStrategy } = require('./sms.strategy');
const { webPushStrategy } = require('./webpush.strategy');

/**
 * Registry de estrategias: agregar un canal nuevo (p. ej. push móvil) es crear
 * una clase y registrarla aquí, sin tocar el dispatcher ni los endpoints.
 */
const strategies = new Map([
  [CHANNEL.EMAIL, emailStrategy],
  [CHANNEL.SMS, smsStrategy],
  [CHANNEL.WEBPUSH, webPushStrategy],
]);

function getStrategy(channel) {
  return strategies.get(channel) ?? null;
}

module.exports = { strategies, getStrategy };

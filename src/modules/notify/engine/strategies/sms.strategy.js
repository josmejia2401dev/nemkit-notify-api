'use strict';

const { env } = require('../../../../config/env');
const { CHANNEL } = require('../../notify.constants');

function configError(message, code) {
  const error = new Error(message);
  error.code = code;
  return error;
}

class SmsStrategy {
  get channel() {
    return CHANNEL.SMS;
  }

  async send({ delivery, subscriber }) {
    if (!env.SMS_ENABLED) {
      throw configError('SMS channel is disabled (SMS_ENABLED=false)', 'CHANNEL_DISABLED');
    }
    if (!env.TWILIO_ACCOUNT_SID || !env.TWILIO_AUTH_TOKEN || !env.TWILIO_FROM) {
      throw configError('SMS channel is not configured', 'CHANNEL_NOT_CONFIGURED');
    }

    const to = String(subscriber?.phone ?? '').trim();
    if (!to) throw configError('Subscriber has no phone', 'SUBSCRIBER_WITHOUT_PHONE');

    const basic = Buffer.from(`${env.TWILIO_ACCOUNT_SID}:${env.TWILIO_AUTH_TOKEN}`).toString('base64');
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${env.TWILIO_ACCOUNT_SID}/Messages.json`,
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${basic}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          To: to,
          From: env.TWILIO_FROM,
          Body: delivery.body,
        }),
      },
    );

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw configError(
        payload.message ?? `SMS provider error ${response.status}`,
        `SMS_PROVIDER_${response.status}`,
      );
    }
    return { providerMessageId: payload.sid ?? null };
  }
}

module.exports = { SmsStrategy, smsStrategy: new SmsStrategy() };

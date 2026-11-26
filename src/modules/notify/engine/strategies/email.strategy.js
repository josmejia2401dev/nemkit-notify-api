'use strict';

const { sendEmail } = require('../email.service');
const { CHANNEL } = require('../../notify.constants');

class EmailStrategy {
  get channel() {
    return CHANNEL.EMAIL;
  }

  async send({ delivery, subscriber }) {
    const to = String(subscriber?.email ?? '').trim();
    if (!to) {
      const error = new Error('Subscriber has no email');
      error.code = 'SUBSCRIBER_WITHOUT_EMAIL';
      throw error;
    }

    return sendEmail({
      to,
      subject: delivery.title,
      text: delivery.body,
      html: typeof delivery.data?.html === 'string' ? delivery.data.html : undefined,
    });
  }
}

module.exports = { EmailStrategy, emailStrategy: new EmailStrategy() };

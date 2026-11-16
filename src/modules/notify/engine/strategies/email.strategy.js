'use strict';

const nodemailer = require('nodemailer');
const { env } = require('../../../../config/env');
const { CHANNEL } = require('../../notify.constants');

let transporter = null;

function configError(message, code) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function getTransporter() {
  if (!env.MAIL_HOST) {
    throw configError('Email channel is not configured (MAIL_HOST)', 'CHANNEL_NOT_CONFIGURED');
  }
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.MAIL_HOST,
      port: env.MAIL_PORT,
      secure: env.MAIL_SECURE,
      auth: env.MAIL_USER ? { user: env.MAIL_USER, pass: env.MAIL_PASS } : undefined,
    });
  }
  return transporter;
}

class EmailStrategy {
  get channel() {
    return CHANNEL.EMAIL;
  }

  async send({ delivery, subscriber }) {
    const to = String(subscriber?.email ?? '').trim();
    if (!to) throw configError('Subscriber has no email', 'SUBSCRIBER_WITHOUT_EMAIL');

    const info = await getTransporter().sendMail({
      from: env.MAIL_FROM,
      to,
      subject: delivery.title,
      text: delivery.body,
    });
    return { providerMessageId: info.messageId ?? null };
  }
}

module.exports = { EmailStrategy, emailStrategy: new EmailStrategy() };

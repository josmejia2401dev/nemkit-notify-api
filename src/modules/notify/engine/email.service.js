'use strict';

const Mailjet = require('node-mailjet');
const { env } = require('../../../config/env');

const EMAIL_SPAM_WARNING = 'El correo puede llegar a la carpeta de spam. Pide al destinatario revisar spam y marcar el remitente como seguro.';

let mailjetClient = null;

function configError(message, code) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function mailjetConfigured() {
  return Boolean(env.MAILJET_API_KEY && env.MAILJET_API_SECRET && env.MAILJET_FROM_EMAIL);
}

function getMailjetClient() {
  if (!mailjetConfigured()) {
    throw configError('Mailjet is not configured (MAILJET_API_KEY / MAILJET_API_SECRET / MAILJET_FROM_EMAIL)', 'CHANNEL_NOT_CONFIGURED');
  }
  if (!mailjetClient) {
    mailjetClient = Mailjet.apiConnect(env.MAILJET_API_KEY, env.MAILJET_API_SECRET);
  }
  return mailjetClient;
}

/**
 * Envía un correo tal como lo entrega el cliente: sin plantillas ni variables.
 */
async function sendEmail({ to, toName, subject, text, html }) {
  const request = await getMailjetClient()
    .post('send', { version: 'v3.1' })
    .request({
      Messages: [
        {
          From: {
            Email: env.MAILJET_FROM_EMAIL,
            Name: env.MAILJET_FROM_NAME || 'Nemkit Notify',
          },
          To: [
            {
              Email: to,
              ...(toName ? { Name: toName } : {}),
            },
          ],
          Subject: subject,
          TextPart: text,
          ...(html ? { HTMLPart: html } : {}),
        },
      ],
    });

  const message = request.body?.Messages?.[0];
  const recipient = message?.To?.[0];
  if (message?.Status && message.Status !== 'success') {
    throw configError(`Mailjet rejected the message: ${message.Status}`, 'EMAIL_PROVIDER_ERROR');
  }

  return {
    provider: 'mailjet',
    providerMessageId: recipient?.MessageID
      ? String(recipient.MessageID)
      : recipient?.MessageUUID ?? null,
    providerStatus: message?.Status ?? null,
  };
}

module.exports = {
  sendEmail,
  mailjetConfigured,
  EMAIL_SPAM_WARNING,
};

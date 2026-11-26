'use strict';

const Mailjet = require('node-mailjet');
const nodemailer = require('nodemailer');
const { env } = require('../../../config/env');

const EMAIL_SPAM_WARNING = 'El correo puede llegar a la carpeta de spam. Pide al destinatario revisar spam y marcar el remitente como seguro.';

let mailjetClient = null;
let smtpTransporter = null;

function configError(message, code) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function mailjetConfigured() {
  return Boolean(env.MAILJET_API_KEY && env.MAILJET_API_SECRET && env.MAILJET_FROM_EMAIL);
}

function emailConfigured() {
  return mailjetConfigured() || Boolean(env.MAIL_HOST);
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

function getSmtpTransporter() {
  if (!env.MAIL_HOST) {
    throw configError('Email channel is not configured (MAIL_HOST)', 'CHANNEL_NOT_CONFIGURED');
  }
  if (!smtpTransporter) {
    smtpTransporter = nodemailer.createTransport({
      host: env.MAIL_HOST,
      port: env.MAIL_PORT,
      secure: env.MAIL_SECURE,
      auth: env.MAIL_USER ? { user: env.MAIL_USER, pass: env.MAIL_PASS } : undefined,
    });
  }
  return smtpTransporter;
}

async function sendWithMailjet({ to, toName, subject, text, html }) {
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
    throw configError(
      `Mailjet rejected the message: ${message.Status}`,
      'EMAIL_PROVIDER_ERROR',
    );
  }

  return {
    provider: 'mailjet',
    providerMessageId: recipient?.MessageID
      ? String(recipient.MessageID)
      : recipient?.MessageUUID ?? null,
    providerStatus: message?.Status ?? null,
  };
}

async function sendWithSmtp({ to, subject, text, html }) {
  const info = await getSmtpTransporter().sendMail({
    from: env.MAIL_FROM,
    to,
    subject,
    text,
    ...(html ? { html } : {}),
  });
  return {
    provider: 'smtp',
    providerMessageId: info.messageId ?? null,
    providerStatus: 'success',
  };
}

/**
 * Envía un correo tal como lo entrega el cliente: sin plantillas ni variables.
 * Mailjet tiene prioridad; SMTP queda como respaldo para desarrollo.
 */
async function sendEmail({ to, toName, subject, text, html }) {
  if (mailjetConfigured()) return sendWithMailjet({ to, toName, subject, text, html });
  if (env.MAIL_HOST) return sendWithSmtp({ to, subject, text, html });
  throw configError(
    'Email channel is not configured (MAILJET_* or MAIL_HOST)',
    'CHANNEL_NOT_CONFIGURED',
  );
}

module.exports = {
  sendEmail,
  emailConfigured,
  mailjetConfigured,
  EMAIL_SPAM_WARNING,
};

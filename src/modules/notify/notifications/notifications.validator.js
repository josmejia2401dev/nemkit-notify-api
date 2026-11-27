'use strict';

const { createValidator, HttpError, PATTERNS } = require('nemkit');

const MAX_RECIPIENTS = 20;

const listQuerySchema = createValidator({
  page: { type: 'number', toNumber: true, min: 1 },
  limit: { type: 'number', toNumber: true, min: 1, max: 100 },
  search: { type: 'string', trim: true, maxLength: 100 },
  channel: { type: 'string', trim: true },
  status: { type: 'string', trim: true },
  from: { type: 'date' },
  to: { type: 'date' },
});

const notificationIdSchema = createValidator({
  id: { type: 'number', required: true, toNumber: true, min: 1 },
});

/** MVP de email: el cliente envía el contenido final, sin plantillas. */
const sendEmailSchema = createValidator({
  subject: { type: 'string', required: true, trim: true, minLength: 1, maxLength: 200 },
  text: { type: 'string', required: true, trim: true, minLength: 1, maxLength: 10000 },
  html: { type: 'string', trim: true, maxLength: 50000 },
});

/**
 * Acepta `to` como string, string separado por comas o arreglo de correos.
 * Devuelve una lista única, normalizada y validada.
 */
function normalizeRecipients(value) {
  const raw = Array.isArray(value) ? value : String(value ?? '').split(',');
  const recipients = [...new Set(
    raw
      .map((item) => String(item ?? '').trim().toLowerCase())
      .filter(Boolean),
  )];

  if (!recipients.length) throw HttpError.badRequest('to is required');
  if (recipients.length > MAX_RECIPIENTS) {
    throw HttpError.badRequest(`to supports at most ${MAX_RECIPIENTS} recipients`);
  }
  const invalid = recipients.find((email) => !PATTERNS.EMAIL.test(email) || email.length > 254);
  if (invalid) throw HttpError.badRequest(`Invalid recipient email: ${invalid}`);

  return recipients;
}

module.exports = {
  MAX_RECIPIENTS,
  listQuerySchema,
  notificationIdSchema,
  sendEmailSchema,
  normalizeRecipients,
};

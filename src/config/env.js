'use strict';

const { loadEnv } = require('nemkit');
const path = require('path');

const env = loadEnv({
  NODE_ENV:       { default: 'development' },
  HOST:           { default: () => process.env.NODE_ENV === 'production' ? '0.0.0.0' : 'localhost' },
  PORT:           { type: 'number', default: () => process.env.PORT || 4001 },
  API_PREFIX:     { default: '/api/v1/notify' },

  // Nombre lógico del nodo (casa / render). Se expone en /ready y /health para
  // detectar proxies mal enrutados desde el frontend.
  APP_NODE_NAME:  { default: '' },

  MONGODB_URI:                { required: true },
  MONGODB_TLS:                { type: 'boolean', default: false },
  MONGODB_TLS_ALLOW_INVALID:  { type: 'boolean', default: false },
  MONGODB_USE_SERVER_API:     { type: 'boolean', default: false },

  JWT_SECRET:             { required: true },
  JWT_EXPIRES_IN:         { default: '30m' },
  JWT_REFRESH_SECRET:     { required: true },
  JWT_REFRESH_EXPIRES_IN: { default: '7d' },

  CORS_ORIGINS:          { type: 'array', default: ['http://localhost:4300'] },
  RATE_LIMIT_WINDOW_MS:  { type: 'number', default: 900000 },
  RATE_LIMIT_MAX:        { type: 'number', default: 1000 },

  LOG_LEVEL:            { default: 'info' },
  LOGS_LOCAL_PATH:      { default: './logs' },
  REQUEST_LOG_ENABLED:  { type: 'boolean', default: true },

  // Cache Redis (Render Key Value). Si no hay URL o está deshabilitado,
  // todas las lecturas van directo a MongoDB.
  REDIS_URL: { default: '' },
  REDIS_ENABLED: { type: 'boolean', default: true },

  // ── Motor de notificaciones ──────────────────────────────────────────
  // Envío directo, sin cola ni reintentos.

  // Mailjet: único proveedor de email del MVP.
  MAILJET_API_KEY: { default: '' },
  MAILJET_API_SECRET: { default: '' },
  MAILJET_FROM_EMAIL: { default: '' },
  MAILJET_FROM_NAME: { default: 'Nemkit Notify' },

  // API key interna por defecto. El seed la crea si no existe y, cuando
  // hace falta, crea la empresa interna con estas credenciales.
  DEFAULT_API_KEY: { default: '' },
  DEFAULT_API_KEY_NAME: { default: 'default' },
  DEFAULT_API_KEY_EMAIL: { default: '' },
  DEFAULT_API_KEY_PASSWORD: { default: '' },
  DEFAULT_API_KEY_COMPANY: { default: 'Nemkit Internal' },

  // Seed del admin (primer arranque, si no hay usuarios).
  // Los tres son REQUERIDOS y sin default: nada de credenciales del admin
  // queda hardcodeado en el código. Deben venir del entorno (.env / Render).
  ADMIN_EMAIL:    { required: true },
  ADMIN_PASSWORD: { required: true },
  ADMIN_FULLNAME: { required: true },
}, {
  path: path.resolve(__dirname, '../..'),
  environment: process.env.NODE_ENV ?? 'production',
  requireFile: false
});

module.exports = { env };

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
  CACHE_PREFIX: { default: 'nk:notify' },
  CACHE_VERSION: { default: 'v1' },
  REDIS_CONNECT_TIMEOUT_MS: { type: 'number', default: 1500 },
  REDIS_COMMAND_TIMEOUT_MS: { type: 'number', default: 100 },
  REDIS_CIRCUIT_FAILURES: { type: 'number', default: 3 },
  REDIS_CIRCUIT_OPEN_MS: { type: 'number', default: 60000 },
  REDIS_PROBE_INTERVAL_MS: { type: 'number', default: 30000 },
  CACHE_TTL_API_KEY_SECONDS: { type: 'number', default: 30 },
  CACHE_TTL_DETAIL_SECONDS: { type: 'number', default: 300 },
  CACHE_TTL_CATALOG_SECONDS: { type: 'number', default: 120 },
  CACHE_TTL_DASHBOARD_SECONDS: { type: 'number', default: 30 },
  CACHE_TTL_STATS_SECONDS: { type: 'number', default: 30 },

  // ── Motor de notificaciones ──────────────────────────────────────────
  // Envío directo, sin cola ni reintentos.

  // Mailjet: único proveedor de email del MVP.
  MAILJET_API_KEY: { default: '' },
  MAILJET_API_SECRET: { default: '' },
  MAILJET_FROM_EMAIL: { default: '' },
  MAILJET_FROM_NAME: { default: 'Nemkit Notify' },

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

'use strict';

const { BaseService, HttpError } = require('nemkit');
const { NotificationsRepository } = require('./notifications.repository');
const { foundation: nemkitFoundation } = require('nemkit');
const { paginationOptions, constants } = nemkitFoundation;
const { BUSINESS_TIMEZONE } = constants;
const { CHANNEL, DELIVERY_STATUS, DELIVERY_STATUSES, CHANNELS } = require('../notify.constants');

/** Estructura de métricas por canal a partir de filas `{ _id, count }`. */
function buildSummary(rows) {
  const channels = Object.fromEntries(
    CHANNELS.map((channel) => [channel, { sent: 0, failed: 0, total: 0 }]),
  );
  let sent = 0;
  let failed = 0;

  for (const row of rows) {
    const channel = row._id.channel;
    const status = row._id.status;
    if (!channels[channel]) continue;
    if (status !== DELIVERY_STATUS.SENT && status !== DELIVERY_STATUS.FAILED) continue;

    channels[channel][status] += row.count;
    channels[channel].total += row.count;
    if (status === DELIVERY_STATUS.SENT) sent += row.count;
    if (status === DELIVERY_STATUS.FAILED) failed += row.count;
  }

  const total = sent + failed;
  return {
    total,
    sent,
    failed,
    errorRate: total === 0 ? 0 : Number(((failed / total) * 100).toFixed(2)),
    channels,
  };
}

class NotificationsService extends BaseService {
  constructor() {
    super(new NotificationsRepository());
    this.notFoundMessage = 'Notification not found';
  }

  list(userId, query = {}) {
    const { page, limit, search } = paginationOptions(query);
    const filter = { userId };
    if (query.channel !== undefined) {
      if (!CHANNELS.includes(query.channel)) throw HttpError.badRequest('Invalid channel');
      filter.channel = query.channel;
    }
    if (query.status !== undefined) {
      if (!DELIVERY_STATUSES.includes(query.status)) throw HttpError.badRequest('Invalid status');
      filter.status = query.status;
    }

    return this.filterAndPaginate(filter, {
      page,
      limit,
      sort: { createdAt: -1 },
      search: search ? { value: search, fields: ['destination', 'title'] } : null,
      between: query.from || query.to
        ? { field: 'createdAt', from: query.from, to: query.to }
        : null,
    });
  }

  async get(userId, id) {
    const notification = await this.findOne({ _id: id, userId });
    if (!notification) throw HttpError.notFound('Notification not found');
    return notification;
  }

  /** Registra una entrega exitosa. */
  recordSent(userId, delivery, actorId) {
    return this.create({
      userId,
      channel: CHANNEL.EMAIL,
      destination: delivery.destination,
      title: delivery.subject,
      body: delivery.text,
      data: { html: delivery.html ?? null, source: 'api' },
      status: DELIVERY_STATUS.SENT,
      error: { code: null, message: null },
      provider: delivery.provider ?? null,
      providerMessageId: delivery.providerMessageId ?? null,
      sentAt: new Date(),
    }, actorId);
  }

  /** Registra una entrega fallida para conservar trazabilidad. */
  recordFailed(userId, delivery, error, actorId) {
    return this.create({
      userId,
      channel: CHANNEL.EMAIL,
      destination: delivery.destination,
      title: delivery.subject,
      body: delivery.text,
      data: { html: delivery.html ?? null, source: 'api' },
      status: DELIVERY_STATUS.FAILED,
      error: {
        code: String(error?.code ?? 'EMAIL_SEND_FAILED').slice(0, 60),
        message: String(error?.message ?? error).slice(0, 500),
      },
      provider: 'mailjet',
    }, actorId);
  }

  async summary(userId) {
    return buildSummary(await this.repository.aggregateByChannelAndStatus(userId));
  }

  async timeseries(userId, days = 30) {
    const window = Math.min(90, Math.max(1, Number(days) || 30));
    const since = new Date(Date.now() - window * 24 * 60 * 60 * 1000);
    const rows = await this.repository.aggregateTimeseries(userId, since, BUSINESS_TIMEZONE);
    return rows.map((row) => ({
      day: row._id.day,
      channel: row._id.channel,
      status: row._id.status,
      count: row.count,
    }));
  }

  async globalSummary() {
    return buildSummary(await this.repository.aggregateByChannelAndStatus(null));
  }
}

module.exports = { NotificationsService, notificationsService: new NotificationsService(), buildSummary };

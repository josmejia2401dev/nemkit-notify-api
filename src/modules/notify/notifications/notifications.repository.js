'use strict';

const { MongoRepository } = require('nemkit');
const Notification = require('./notifications.model');

class NotificationsRepository extends MongoRepository {
  constructor() {
    super(Notification);
  }

  /** Conteo agrupado por canal y estado para un tenant (o global si userId es null). */
  aggregateByChannelAndStatus(userId) {
    const match = userId == null ? {} : { userId };
    return this.aggregate([
      { $match: match },
      { $group: { _id: { channel: '$channel', status: '$status' }, count: { $sum: 1 } } },
    ]);
  }

  /** Serie diaria por canal y estado dentro de la ventana solicitada. */
  aggregateTimeseries(userId, since, timezone) {
    const match = userId == null ? {} : { userId };
    return this.aggregate([
      { $match: { ...match, createdAt: { $gte: since } } },
      {
        $group: {
          _id: {
            day: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone } },
            channel: '$channel',
            status: '$status',
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.day': 1 } },
    ]);
  }
}

module.exports = { NotificationsRepository };

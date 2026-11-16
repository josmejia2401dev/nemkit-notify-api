'use strict';

const { MongoRepository } = require('nemkit');
const Topic = require('./topics.model');
const Subscriber = require('../subscribers/subscribers.model');

class TopicsRepository extends MongoRepository {
  constructor() {
    super(Topic);
  }

  /** Suscriptores activos por tema, en una sola agregación. */
  async countSubscribersByTopic(userId, topicIds) {
    if (!topicIds.length) return new Map();
    const rows = await Subscriber.aggregate([
      { $match: { userId, topicIds: { $in: topicIds }, recordStatus: 'active' } },
      { $unwind: '$topicIds' },
      { $match: { topicIds: { $in: topicIds } } },
      { $group: { _id: '$topicIds', count: { $sum: 1 } } },
    ]);
    return new Map(rows.map((row) => [row._id, row.count]));
  }
}

module.exports = { TopicsRepository };

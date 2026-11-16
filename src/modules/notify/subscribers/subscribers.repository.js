'use strict';

const { MongoRepository, RECORD_STATUS } = require('nemkit');
const Subscriber = require('./subscribers.model');

class SubscribersRepository extends MongoRepository {
  constructor() {
    super(Subscriber);
  }

  async addTopics(id, topicIds, userId) {
    const doc = await this.model.findOneAndUpdate(
      { _id: id, recordStatus: { $ne: RECORD_STATUS.DELETED } },
      { $addToSet: { topicIds: { $each: topicIds } }, updatedBy: userId },
      { returnDocument: 'after' },
    );
    return this.normalizeOutput(doc);
  }

  async removeTopic(id, topicId, userId) {
    const doc = await this.model.findOneAndUpdate(
      { _id: id, recordStatus: { $ne: RECORD_STATUS.DELETED } },
      { $pull: { topicIds: topicId }, updatedBy: userId },
      { returnDocument: 'after' },
    );
    return this.normalizeOutput(doc);
  }

  /** Suscriptores activos de un tema, acotados para detectar el tope del plan. */
  listByTopic(userId, topicId, limit) {
    return this.find(
      { userId, topicIds: topicId, recordStatus: RECORD_STATUS.ACTIVE },
      { limit, sort: { _id: 1 } },
    );
  }
}

module.exports = { SubscribersRepository };

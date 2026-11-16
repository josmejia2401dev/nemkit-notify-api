'use strict';

const { MongoRepository, RECORD_STATUS } = require('nemkit');
const ApiKey = require('./api-keys.model');

class ApiKeysRepository extends MongoRepository {
  constructor() {
    super(ApiKey);
  }

  findActiveByKey(key) {
    return this.findOne({ key, recordStatus: RECORD_STATUS.ACTIVE });
  }

  countActiveByUser(userId) {
    return this.countDocuments({ userId, recordStatus: RECORD_STATUS.ACTIVE });
  }
}

module.exports = { ApiKeysRepository };

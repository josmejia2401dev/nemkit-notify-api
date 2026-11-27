'use strict';

const { express } = require('nemkit');
const { foundation } = require('../config/foundation');
const apiKeysRoutes = require('../modules/notify/api-keys/api-keys.routes');
const notificationsRoutes = require('../modules/notify/notifications/notifications.routes');
const statsRoutes = require('../modules/notify/stats/stats.routes');

/** Portal de la empresa: JWT + scope al `userId` dueño de la cuenta. */
const router = express.Router();
const { authenticate, requireCompany } = foundation.middlewares;

router.use('/api-keys', authenticate, requireCompany, apiKeysRoutes);
router.use('/notifications', authenticate, requireCompany, notificationsRoutes);
router.use('/stats', authenticate, requireCompany, statsRoutes);

module.exports = router;

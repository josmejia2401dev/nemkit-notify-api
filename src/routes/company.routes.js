'use strict';

const { express } = require('nemkit');
const { authenticate } = require('../middlewares/auth.middleware');
const { requireCompany } = require('../middlewares/users.middleware');
const apiKeysRoutes = require('../modules/notify/api-keys/api-keys.routes');
const topicsRoutes = require('../modules/notify/topics/topics.routes');
const subscribersRoutes = require('../modules/notify/subscribers/subscribers.routes');
const notificationsRoutes = require('../modules/notify/notifications/notifications.routes');
const statsRoutes = require('../modules/notify/stats/stats.routes');
const usersProfileRoutes = require('../modules/foundation/users-profile/users-profile.routes');

/** Portal de la empresa: JWT + scope al `userId` dueño de la cuenta. */
const router = express.Router();

router.use(authenticate);
router.use(requireCompany);

router.use('/company/profile', usersProfileRoutes);
router.use('/company/api-keys', apiKeysRoutes);
router.use('/company/topics', topicsRoutes);
router.use('/company/subscribers', subscribersRoutes);
router.use('/company/notifications', notificationsRoutes);
router.use('/company/stats', statsRoutes);

module.exports = router;

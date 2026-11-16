'use strict';

const { express } = require('nemkit');
const { apiKeyAuth } = require('../middlewares/api-key.middleware');
const subscribersRoutes = require('../modules/notify/subscribers/subscribers.routes');
const notificationsRoutes = require('../modules/notify/notifications/notifications.public.routes');

/** API pública para los sistemas de los clientes. Tenant resuelto por API Key. */
const router = express.Router();

router.use('/subscribers', apiKeyAuth, subscribersRoutes);
router.use('/notifications', apiKeyAuth, notificationsRoutes);

module.exports = router;

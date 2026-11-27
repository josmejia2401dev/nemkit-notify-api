'use strict';

const { express } = require('nemkit');
const { apiKeyAuth } = require('../middlewares/api-key.middleware');
const { notificationsController } = require('../modules/notify/notifications/notifications.controller');

/** API pública: solo envío de email, autenticado por `api-key`. */
const router = express.Router();

router.post('/notifications/email', apiKeyAuth, notificationsController.sendEmail.bind(notificationsController));

module.exports = router;

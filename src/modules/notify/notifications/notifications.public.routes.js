'use strict';

const { express } = require('nemkit');
const { notificationsController: c } = require('./notifications.controller');

const router = express.Router();

router.post('/email', c.sendEmail.bind(c));
router.post('/send', c.send.bind(c));
router.post('/broadcast', c.broadcast.bind(c));
router.get('/:id', c.status.bind(c));

module.exports = router;

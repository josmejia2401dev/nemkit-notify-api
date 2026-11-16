'use strict';

const { express } = require('nemkit');
const { subscribersController: c } = require('./subscribers.controller');

const router = express.Router();

router.get('/', c.list.bind(c));
router.post('/', c.create.bind(c));
router.get('/:id', c.get.bind(c));
router.put('/:id', c.update.bind(c));
router.delete('/:id', c.remove.bind(c));
router.post('/:id/topics', c.subscribe.bind(c));
router.delete('/:id/topics/:topicId', c.unsubscribe.bind(c));

module.exports = router;

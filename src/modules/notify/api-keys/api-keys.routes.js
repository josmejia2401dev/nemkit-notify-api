'use strict';

const { express } = require('nemkit');
const { apiKeysController: c } = require('./api-keys.controller');

const router = express.Router();

router.get('/', c.list.bind(c));
router.post('/', c.create.bind(c));
router.delete('/:id', c.revoke.bind(c));

module.exports = router;

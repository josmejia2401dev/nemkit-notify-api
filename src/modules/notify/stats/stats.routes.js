'use strict';

const { express } = require('nemkit');
const { statsController: c } = require('./stats.controller');

const router = express.Router();

router.get('/summary', c.summary.bind(c));
router.get('/timeseries', c.timeseries.bind(c));
router.get('/channels', c.channels.bind(c));

module.exports = router;

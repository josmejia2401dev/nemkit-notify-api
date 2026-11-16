'use strict';

const { express } = require('nemkit');
const { platformCompaniesController: c } = require('./sys-companies.controller');

const router = express.Router();

router.get('/', c.list.bind(c));
router.get('/:id/consumption', c.consumption.bind(c));
router.get('/:id', c.get.bind(c));
router.patch('/:id/status', c.changeStatus.bind(c));
router.delete('/:id', c.remove.bind(c));

module.exports = router;

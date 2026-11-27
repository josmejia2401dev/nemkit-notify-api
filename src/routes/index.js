'use strict';

const { express } = require('nemkit');
const { foundation } = require('../config/foundation');
const publicRoutes = require('./public.routes');
const companyRoutes = require('./company.routes');

const router = express.Router();

// Orden importante: la API pública valida `api-key`, foundation resuelve auth y
// el portal de empresa aplica JWT + scope de tenant.
router.use('/', publicRoutes);
router.use('/foundation', foundation.router);
router.use('/company', companyRoutes);

module.exports = router;

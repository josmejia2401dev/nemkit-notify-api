'use strict';

const { express } = require('nemkit');
const foundationRoutes = require('./foundation.routes');
const publicRoutes = require('./public.routes');
const companyRoutes = require('./company.routes');

const router = express.Router();

// Orden importante: la API pública valida `api-key`, foundation resuelve auth y
// el portal de empresa aplica JWT + scope de tenant.
router.use('/', publicRoutes);
router.use('/', foundationRoutes);
router.use('/', companyRoutes);

module.exports = router;

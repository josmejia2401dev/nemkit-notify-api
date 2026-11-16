'use strict';

const { usersService } = require('../users/users.service');
const { feedbackService } = require('../feedback/feedback.service');
const { FEEDBACK_STATUS } = require('../feedback/feedback.constants');
const { employeesService } = require('../employees/employees.service');
const { notificationsService } = require('../../notify/notifications/notifications.service');

class PlatformOverviewService {
  /** Métricas globales de la plataforma para el super administrador. */
  async get() {
    const [owners, users, employees, openFeedback, totalFeedback, notifications] = await Promise.all([
      usersService.listOwners({ page: 1, limit: 1 }),
      usersService.listGlobal({ page: 1, limit: 1 }),
      employeesService.globalOverview(),
      feedbackService.countByStatus(FEEDBACK_STATUS.OPEN),
      feedbackService.countAll(),
      notificationsService.globalSummary(),
    ]);

    return {
      companies: owners.pagination?.total ?? 0,
      users: users.pagination?.total ?? 0,
      employees,
      feedback: { open: openFeedback, total: totalFeedback },
      notifications,
    };
  }
}

module.exports = { PlatformOverviewService, platformOverviewService: new PlatformOverviewService() };

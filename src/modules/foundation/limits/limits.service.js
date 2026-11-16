'use strict';

const { HttpError, RECORD_STATUS } = require('nemkit');
const {
  LIMIT_PERIOD,
  BUSINESS_TIMEZONE,
  PLANS,
  DEFAULT_PLAN,
  LIMIT_LABELS,
} = require('./limits.constants');
const User = require('../users/users.model');
const Topic = require('../../notify/topics/topics.model');
const Subscriber = require('../../notify/subscribers/subscribers.model');
const ApiKey = require('../../notify/api-keys/api-keys.model');

const ACTIVE_FILTER = Object.freeze({ recordStatus: RECORD_STATUS.ACTIVE });

/**
 * Contadores de límites con periodo `total`. Se consultan en vivo, sin
 * mantener contadores en el usuario.
 */
const TOTAL_COUNTERS = Object.freeze({
  topics: (userId) => Topic.countDocuments({ userId, ...ACTIVE_FILTER }),
  subscribers: (userId) => Subscriber.countDocuments({ userId, ...ACTIVE_FILTER }),
  apiKeys: (userId) => ApiKey.countDocuments({ userId, ...ACTIVE_FILTER }),
});

/** Periodo mensual actual (`YYYY-MM`) en la zona horaria del negocio. */
function currentPeriod() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: BUSINESS_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
  }).format(new Date());
}

/** Normaliza a un número de uso válido (nunca negativo ni NaN). */
function normalizeUsed(value) {
  const used = Number(value);
  return Number.isFinite(used) && used > 0 ? used : 0;
}

class LimitsService {
  /**
   * Resuelve el plan del usuario desde el catálogo. Acepta documentos viejos
   * donde `limitUsage.plan` era un string y documentos sin `limitUsage`.
   */
  resolvePlan(user) {
    const stored = user?.limitUsage?.plan;
    const code = typeof stored === 'string' ? stored : stored?.code;
    return PLANS[code] ?? PLANS[DEFAULT_PLAN];
  }

  /** Catálogo de planes disponibles (precio, límites y topes desde constantes). */
  getPlans() {
    return Object.values(PLANS).map((plan) => ({
      code: plan.code,
      name: plan.name,
      price: plan.price,
      currency: plan.currency,
      limits: Object.fromEntries(
        Object.entries(plan.limits).map(([key, config]) => [
          key,
          { max: config.max, period: config.period },
        ]),
      ),
      caps: { ...plan.caps },
    }));
  }

  /** Uso real del tenant según la periodicidad de cada límite. */
  async getLimitUsage(userId) {
    const user = await User.findById(userId).select('limitUsage').lean();
    const plan = this.resolvePlan(user);
    const period = currentPeriod();
    const monthlyUsed = this.#monthlyUsed(user, period);
    const totalUsed = await this.#countTotals(userId, plan);

    const limits = {};
    for (const [key, config] of Object.entries(plan.limits)) {
      const used = config.period === LIMIT_PERIOD.MONTH
        ? normalizeUsed(monthlyUsed[key])
        : normalizeUsed(totalUsed[key]);
      limits[key] = {
        max: config.max,
        used,
        remaining: Math.max(0, config.max - used),
        period: config.period,
      };
    }

    return {
      plan: {
        code: plan.code,
        name: plan.name,
        price: plan.price,
        currency: plan.currency,
      },
      period,
      limits,
      caps: { ...plan.caps },
    };
  }

  /** Corta la creación cuando el tenant ya alcanzó el límite del plan. */
  async assertCanCreate(userId, key) {
    const usage = await this.getLimitUsage(userId);
    const current = usage.limits[key];
    if (!current) return;

    if (current.used >= current.max) {
      throw new HttpError(
        409,
        `Límite del plan ${usage.plan.name} alcanzado: ${current.used}/${current.max} ${LIMIT_LABELS[key] ?? key}`,
        { code: 'PLAN_LIMIT_REACHED' },
      );
    }
  }

  /** Corta una operación que consume `amount` unidades del límite indicado. */
  async assertCanConsume(userId, key, amount = 1) {
    const usage = await this.getLimitUsage(userId);
    const current = usage.limits[key];
    if (!current) return;

    if (current.used + amount > current.max) {
      throw new HttpError(
        409,
        `Límite del plan ${usage.plan.name} alcanzado: ${current.used}/${current.max} ${LIMIT_LABELS[key] ?? key}`,
        { code: 'PLAN_LIMIT_REACHED' },
      );
    }
  }

  /** Corte de un tope por petición (p. ej. destinatarios de un broadcast). */
  async assertCanBroadcast(userId, recipients) {
    const usage = await this.getLimitUsage(userId);
    const max = usage.caps.broadcastRecipients;
    if (max && recipients > max) {
      throw new HttpError(
        409,
        `Límite del plan ${usage.plan.name} alcanzado: ${recipients}/${max} destinatarios por envío`,
        { code: 'PLAN_LIMIT_REACHED' },
      );
    }
  }

  /**
   * Suma consumo a un límite mensual. Es un no-op para límites totales.
   * El reinicio es perezoso: si cambió el mes, primero se limpian los valores.
   */
  async recordUsage(userId, key, amount = 1) {
    const user = await User.findById(userId).select('limitUsage.plan').lean();
    const plan = this.resolvePlan(user);
    const config = plan.limits[key];
    if (!config || config.period !== LIMIT_PERIOD.MONTH) return;

    const period = currentPeriod();
    await User.updateOne(
      { _id: userId, 'limitUsage.used.period': { $ne: period } },
      {
        $set: {
          'limitUsage.used.period': period,
          'limitUsage.used.values': {},
          'limitUsage.used.updatedAt': new Date(),
        },
      },
    );
    await User.updateOne(
      { _id: userId },
      {
        $inc: { [`limitUsage.used.values.${key}`]: amount },
        $set: { 'limitUsage.used.updatedAt': new Date() },
      },
    );
  }

  /** Valores mensuales guardados, solo si pertenecen al periodo actual. */
  #monthlyUsed(user, period) {
    const used = user?.limitUsage?.used;
    if (!used || used.period !== period || !used.values) return {};
    return used.values;
  }

  /** Cuenta en vivo los límites con periodo `total` definidos por el plan. */
  async #countTotals(userId, plan) {
    const keys = Object.keys(plan.limits).filter(
      (key) => plan.limits[key].period === LIMIT_PERIOD.TOTAL && TOTAL_COUNTERS[key],
    );
    const entries = await Promise.all(
      keys.map(async (key) => [key, await TOTAL_COUNTERS[key](userId)]),
    );
    return Object.fromEntries(entries);
  }
}

module.exports = { LimitsService, limitsService: new LimitsService() };

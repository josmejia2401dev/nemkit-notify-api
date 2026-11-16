'use strict';

const webpush = require('web-push');
const { env } = require('../../../../config/env');
const { CHANNEL } = require('../../notify.constants');

let configured = false;

function configError(message, code) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function configure() {
  if (!env.VAPID_PUBLIC_KEY || !env.VAPID_PRIVATE_KEY) {
    throw configError('WebPush channel is not configured (VAPID keys)', 'CHANNEL_NOT_CONFIGURED');
  }
  if (!configured) {
    webpush.setVapidDetails(env.VAPID_SUBJECT, env.VAPID_PUBLIC_KEY, env.VAPID_PRIVATE_KEY);
    configured = true;
  }
}

class WebPushStrategy {
  get channel() {
    return CHANNEL.WEBPUSH;
  }

  async send({ delivery, subscriber }) {
    const subscriptions = Array.isArray(subscriber?.webpush) ? subscriber.webpush : [];
    if (!subscriptions.length) {
      throw configError('Subscriber has no webpush subscription', 'SUBSCRIBER_WITHOUT_WEBPUSH');
    }
    configure();

    const payload = JSON.stringify({
      title: delivery.title,
      body: delivery.body,
      data: delivery.data ?? {},
    });

    const results = await Promise.allSettled(
      subscriptions.map((item) =>
        webpush.sendNotification({ endpoint: item.endpoint, keys: item.keys }, payload),
      ),
    );

    const rejected = results.filter((result) => result.status === 'rejected');
    if (rejected.length === results.length) {
      throw rejected[0].reason ?? new Error('WebPush delivery failed');
    }
    return { providerMessageId: null };
  }
}

module.exports = { WebPushStrategy, webPushStrategy: new WebPushStrategy() };

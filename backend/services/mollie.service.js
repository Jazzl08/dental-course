import { createMollieClient } from '@mollie/api-client';

const mollieClient = createMollieClient({
  apiKey: process.env.MOLLIE_API_KEY,
});

const createMolliePayment = async ({ amountCents, currency = 'EUR', description, orderId, metadata = {} }) => {
  const isDev = process.env.NODE_ENV !== 'production';

  const payment = await mollieClient.payments.create({
    amount: {
      currency,
      value: (amountCents / 100).toFixed(2),
    },
    description,
    redirectUrl: `${process.env.MOLLIE_REDIRECT_URL}?orderId=${orderId}`,
    ...(isDev ? {} : { webhookUrl: process.env.MOLLIE_WEBHOOK_URL }),
    metadata: { orderId, ...metadata },
  });

  return {
    mollieId: payment.id,
    checkoutUrl: payment.getCheckoutUrl(),
  };
};

const getMolliePayment = async (mollieId) =>
  mollieClient.payments.get(mollieId);

export { createMolliePayment, getMolliePayment };

import { getClient, query } from '../config/db.js';
import { createMolliePayment, getMolliePayment } from './mollie.service.js';
import { sendPurchaseConfirmation } from './email.service.js';
import { createError } from '../middleware/errorHandler.js';

export const createPaymentService = async ({ courseId, userId }) => {
  const client = await getClient();
  try {
    const courseResult = await client.query(
      'SELECT id, title, price_cents, currency FROM courses WHERE id = $1 AND is_published = TRUE',
      [courseId]
    );
    const course = courseResult.rows[0];
    if (!course) {
      throw createError(404, 'Course not found.');
    }

    const enrolled = await client.query(
      'SELECT id FROM enrollments WHERE user_id = $1 AND course_id = $2',
      [userId, courseId]
    );
    if (enrolled.rowCount > 0) {
      throw createError(409, 'You already own this course.');
    }

    const pendingPayment = await client.query(
      `SELECT id, checkout_url FROM payments WHERE user_id = $1 AND course_id = $2 AND status = 'pending' AND checkout_url IS NOT NULL`,
      [userId, courseId]
    );
    if (pendingPayment.rowCount > 0) {
      return { paymentId: pendingPayment.rows[0].id, checkoutUrl: pendingPayment.rows[0].checkout_url };
    }

    const paymentRecord = await client.query(
      `INSERT INTO payments (user_id, course_id, amount_cents, currency, status)
       VALUES ($1, $2, $3, $4, 'pending')
       RETURNING id`,
      [userId, courseId, course.price_cents, course.currency]
    );
    const localPaymentId = paymentRecord.rows[0].id;

    const { mollieId, checkoutUrl } = await createMolliePayment({
      amountCents: course.price_cents,
      currency: course.currency,
      description: `Dental Course: ${course.title}`,
      orderId: localPaymentId,
      metadata: { courseId, userId },
    });

    await client.query(
      `UPDATE payments SET mollie_id = $1, checkout_url = $2, status = 'pending' WHERE id = $3`,
      [mollieId, checkoutUrl, localPaymentId]
    );

    return { paymentId: localPaymentId, checkoutUrl };
  } finally {
    client.release();
  }
};

export const handleMollieWebhookService = async ({ mollieId }) => {
  if (!mollieId) {
    console.warn('[WEBHOOK] No Mollie ID in payload');
    return;
  }

  const client = await getClient();
  try {
    await client.query('BEGIN');

    const paymentResult = await client.query(
      `SELECT p.id, p.user_id, p.course_id, p.status, p.amount_cents, p.currency,
              u.email, u.name,
              c.title AS course_title
       FROM payments p
       JOIN users u ON u.id = p.user_id
       JOIN courses c ON c.id = p.course_id
       WHERE p.mollie_id = $1`,
      [mollieId]
    );
    const payment = paymentResult.rows[0];

    if (!payment) {
      console.warn('[WEBHOOK] Unknown mollie_id:', mollieId);
      await client.query('ROLLBACK');
      return;
    }

    const molliePayment = await getMolliePayment(mollieId);
    const newStatus = molliePayment.status;

    if (payment.status === newStatus) {
      await client.query('ROLLBACK');
      return;
    }

    await client.query(
      `UPDATE payments
       SET status = $1, paid_at = $2, updated_at = NOW()
       WHERE id = $3`,
      [newStatus, newStatus === 'paid' ? new Date() : null, payment.id]
    );

    if (newStatus === 'paid') {
      await client.query(
        `INSERT INTO enrollments (user_id, course_id, payment_id)
         VALUES ($1, $2, $3)
         ON CONFLICT (user_id, course_id) DO NOTHING`,
        [payment.user_id, payment.course_id, payment.id]
      );

      sendPurchaseConfirmation({
        userId: payment.user_id,
        to: payment.email,
        name: payment.name,
        courseName: payment.course_title,
        amountCents: payment.amount_cents,
        currency: payment.currency,
      }).catch(console.error);
    }

    await client.query('COMMIT');
    console.log(`[WEBHOOK] Payment ${mollieId} -> ${newStatus}`);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[WEBHOOK] Error processing webhook:', err.message);
  } finally {
    client.release();
  }
};

export const getPaymentStatusService = async ({ id, userId }) => {
  const { rows } = await query(
    `SELECT p.id, p.status, p.mollie_id, p.checkout_url, p.paid_at, p.user_id, p.course_id, p.amount_cents, p.currency,
            c.title AS course_title
     FROM payments p
     JOIN courses c ON c.id = p.course_id
     WHERE p.id = $1 AND p.user_id = $2`,
    [id, userId]
  );

  if (!rows[0]) throw createError(404, 'Payment not found.');

  const payment = rows[0];

  if (payment.status === 'pending' && process.env.NODE_ENV !== 'production') {
    await handleMollieWebhookService({ mollieId: payment.mollie_id });
    const { rows: updated } = await query(
      `SELECT p.id, p.status, p.checkout_url, p.paid_at, c.title AS course_title
       FROM payments p JOIN courses c ON c.id = p.course_id
       WHERE p.id = $1`,
      [id]
    );
    return updated[0];
  }

  return payment;
};

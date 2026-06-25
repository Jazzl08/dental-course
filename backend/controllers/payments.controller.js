import { createMollieClient } from '@mollie/api-client';
import { query, getClient } from '../config/db.js';
import { createPaymentService, getPaymentStatusService } from '../services/payments.service.js';
import { sendPurchaseConfirmation } from '../services/email.service.js';

const mollieClient = createMollieClient({ apiKey: process.env.MOLLIE_API_KEY });

export const createPayment = async (req, res, next) => {
  try {
    const { courseId } = req.body;
    const userId = req.user.id;
    const result = await createPaymentService({ courseId, userId });
    res.status(201).json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

export const mollieWebhook = async (req, res) => {
  try {
    const mollieId = req.body?.id;
    if (!mollieId) return res.status(400).send('No payment ID');

    const molliePayment = await mollieClient.payments.get(mollieId);
    const newStatus = molliePayment.status;

    const client = await getClient();
    try {
      await client.query('BEGIN');

      const { rows } = await client.query(
        `SELECT p.id, p.user_id, p.course_id, p.status, p.amount_cents, p.currency,
                u.email, u.name, c.title AS course_title
         FROM payments p
         JOIN users u ON u.id = p.user_id
         JOIN courses c ON c.id = p.course_id
         WHERE p.mollie_id = $1`,
        [mollieId]
      );
      const payment = rows[0];
      if (!payment || payment.status === newStatus) {
        await client.query('ROLLBACK');
        return res.send('OK');
      }

      await client.query(
        `UPDATE payments SET status = $1, paid_at = $2, updated_at = NOW() WHERE id = $3`,
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
      console.log(`[WEBHOOK] ${mollieId} -> ${newStatus}`);
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }

    res.send('OK');
  } catch (err) {
    console.error('[WEBHOOK] Error:', err.message);
    res.send('OK');
  }
};

export const getPaymentStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const payment = await getPaymentStatusService({ id, userId });
    res.json({ success: true, payment });
  } catch (err) {
    next(err);
  }
};

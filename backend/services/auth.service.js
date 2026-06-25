import bcrypt from 'bcryptjs';
import * as db from '../config/db.js';
import {
  generateAccessToken,
  generateRefreshToken,
  generateOpaqueToken,
  hashToken,
  refreshTokenExpiresAt,
  emailVerifyExpiresAt,
  passwordResetExpiresAt,
} from '../utils/jwt.js';
import {
  sendRegistrationEmail,
  sendVerificationEmail,
  sendWelcomeEmail,
  sendLoginAlertEmail,
  sendPasswordResetEmail,
} from './email.service.js';
import { createError } from '../middleware/errorHandler.js';

const SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS || '12', 10);
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';

const issueEmailVerification = async (userId) => {
  const { raw, hash } = generateOpaqueToken();
  const expiresAt = emailVerifyExpiresAt();

  await db.query(
    `UPDATE users
     SET email_verification_token_hash = $1,
         email_verification_expires_at = $2
     WHERE id = $3`,
    [hash, expiresAt, userId]
  );

  return { raw, expiresAt };
};

const issuePasswordReset = async (userId) => {
  const { raw, hash } = generateOpaqueToken();
  const expiresAt = passwordResetExpiresAt();

  await db.query(
    `UPDATE users
     SET password_reset_token_hash = $1,
         password_reset_expires_at = $2
     WHERE id = $3`,
    [hash, expiresAt, userId]
  );

  return { raw, expiresAt };
};

export const registerUser = async ({ name, email, password, ip, userAgent }) => {
  const existing = await db.query('SELECT id FROM users WHERE email = $1', [email]);
  if (existing.rowCount > 0) {
    throw createError(409, 'Email already in use.');
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  const { rows } = await db.query(
    `INSERT INTO users (name, email, password_hash)
     VALUES ($1, $2, $3)
     RETURNING id, name, email, role, is_verified, created_at`,
    [name, email, passwordHash]
  );
  const user = rows[0];

  const accessToken = generateAccessToken(user.id, user.role);
  const { raw: refreshRaw, hash: refreshHash } = generateRefreshToken();

  await db.query(
    `INSERT INTO refresh_tokens (user_id, token_hash, expires_at, ip_address, user_agent)
     VALUES ($1, $2, $3, $4, $5)`,
    [user.id, refreshHash, refreshTokenExpiresAt(), ip, userAgent || null]
  );

  const { raw: verifyRaw } = await issueEmailVerification(user.id);
  const verifyUrl = `${CLIENT_URL}/email-verificatie?token=${verifyRaw}`;

  sendRegistrationEmail({ userId: user.id, to: user.email, name: user.name }).catch(console.error);
  sendVerificationEmail({ userId: user.id, to: user.email, name: user.name, verifyUrl }).catch(console.error);

  return { user, accessToken, refreshRaw };
};

export const loginUser = async ({ email, password, ip, userAgent }) => {
  const { rows } = await db.query(
    'SELECT id, name, email, role, password_hash, is_verified, is_blocked, email_verification_expires_at FROM users WHERE email = $1',
    [email]
  );

  const user = rows[0];
  const valid = user && (await bcrypt.compare(password, user.password_hash));

  if (!valid) {
    throw createError(401, 'Invalid email or password.');
  }

  if (user.is_blocked) {
    throw createError(403, 'This account has been blocked.');
  }

  if (!user.is_verified) {
    const { raw: verifyRaw } = await issueEmailVerification(user.id);
    const verifyUrl = `${CLIENT_URL}/email-verificatie?token=${verifyRaw}`;
    sendVerificationEmail({ userId: user.id, to: user.email, name: user.name, verifyUrl }).catch(console.error);
    throw createError(403, 'Email not verified.', 'EMAIL_NOT_VERIFIED');
  }

  const accessToken = generateAccessToken(user.id, user.role);
  const { raw: refreshRaw, hash: refreshHash } = generateRefreshToken();

  await db.query(
    `UPDATE refresh_tokens SET revoked = TRUE
     WHERE user_id = $1 AND ip_address = $2 AND revoked = FALSE`,
    [user.id, ip]
  );

  await db.query(
    `INSERT INTO refresh_tokens (user_id, token_hash, expires_at, ip_address, user_agent)
     VALUES ($1, $2, $3, $4, $5)`,
    [user.id, refreshHash, refreshTokenExpiresAt(), ip, userAgent || null]
  );

  await db.query('UPDATE users SET last_login_at = NOW() WHERE id = $1', [user.id]);

  sendLoginAlertEmail({
    userId: user.id,
    to: user.email,
    name: user.name,
    ip,
    userAgent,
  }).catch(console.error);

  return { user, accessToken, refreshRaw };
};

export const logoutUser = async (refreshRaw) => {
  if (refreshRaw) {
    const hash = hashToken(refreshRaw);
    await db.query('UPDATE refresh_tokens SET revoked = TRUE WHERE token_hash = $1', [hash]);
  }
};

export const refreshTokens = async ({ refreshRaw, ip, userAgent }) => {
  if (!refreshRaw) {
    throw createError(401, 'Refresh token missing.');
  }

  const hash = hashToken(refreshRaw);

  const { rows } = await db.query(
    `SELECT rt.id, rt.user_id, rt.expires_at, u.role, u.is_blocked
     FROM refresh_tokens rt
     JOIN users u ON u.id = rt.user_id
     WHERE rt.token_hash = $1 AND rt.revoked = FALSE`,
    [hash]
  );

  const tokenRecord = rows[0];
  if (!tokenRecord || new Date(tokenRecord.expires_at) < new Date()) {
    throw createError(401, 'Refresh token invalid or expired.');
  }
  if (tokenRecord.is_blocked) {
    throw createError(403, 'This account has been blocked.');
  }

  const { raw: newRefreshRaw, hash: newRefreshHash } = generateRefreshToken();

  await db.query('UPDATE refresh_tokens SET revoked = TRUE WHERE id = $1', [tokenRecord.id]);
  await db.query(
    `INSERT INTO refresh_tokens (user_id, token_hash, expires_at, ip_address, user_agent)
     VALUES ($1, $2, $3, $4, $5)`,
    [tokenRecord.user_id, newRefreshHash, refreshTokenExpiresAt(), ip, userAgent || null]
  );

  const newAccessToken = generateAccessToken(tokenRecord.user_id, tokenRecord.role);

  return { newAccessToken, newRefreshRaw };
};

export const getMeUser = async (userId) => {
  const { rows } = await db.query(
    'SELECT id, name, email, role, is_verified, created_at, last_login_at FROM users WHERE id = $1',
    [userId]
  );
  if (!rows[0]) throw createError(404, 'User not found.');
  return rows[0];
};

export const verifyEmailToken = async (token) => {
  const hash = hashToken(token);

  const { rows } = await db.query(
    `SELECT id, email, name, is_verified
     FROM users
     WHERE email_verification_token_hash = $1
       AND email_verification_expires_at > NOW()`,
    [hash]
  );

  const user = rows[0];
  if (!user) {
    throw createError(400, 'Verification token invalid or expired.');
  }

  await db.query(
    `UPDATE users
     SET is_verified = TRUE,
         email_verification_token_hash = NULL,
         email_verification_expires_at = NULL
     WHERE id = $1`,
    [user.id]
  );

  if (!user.is_verified) {
    sendWelcomeEmail({ userId: user.id, to: user.email, name: user.name }).catch(console.error);
  }

  return { id: user.id, email: user.email, name: user.name, isVerified: true };
};

export const resendVerificationEmail = async (email) => {
  const { rows } = await db.query(
    'SELECT id, email, name, is_verified FROM users WHERE email = $1',
    [email]
  );
  const user = rows[0];

  if (!user) return;
  if (user.is_verified) return;

  const { raw: verifyRaw } = await issueEmailVerification(user.id);
  const verifyUrl = `${CLIENT_URL}/email-verificatie?token=${verifyRaw}`;

  sendVerificationEmail({ userId: user.id, to: user.email, name: user.name, verifyUrl }).catch(console.error);
};

export const requestPasswordReset = async (email) => {
  const { rows } = await db.query('SELECT id, email, name FROM users WHERE email = $1', [email]);
  const user = rows[0];

  if (!user) return;

  const { raw } = await issuePasswordReset(user.id);
  const resetUrl = `${CLIENT_URL}/wachtwoord-reset?token=${raw}`;

  sendPasswordResetEmail({ userId: user.id, to: user.email, name: user.name, resetUrl }).catch(console.error);
};

export const resetPassword = async ({ token, password }) => {
  const hash = hashToken(token);

  const { rows } = await db.query(
    `SELECT id, email, name
     FROM users
     WHERE password_reset_token_hash = $1
       AND password_reset_expires_at > NOW()`,
    [hash]
  );

  const user = rows[0];
  if (!user) {
    throw createError(400, 'Reset token invalid or expired.');
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  await db.query(
    `UPDATE users
     SET password_hash = $1,
         password_reset_token_hash = NULL,
         password_reset_expires_at = NULL
     WHERE id = $2`,
    [passwordHash, user.id]
  );

  await db.query('UPDATE refresh_tokens SET revoked = TRUE WHERE user_id = $1', [user.id]);
};

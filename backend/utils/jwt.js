import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;

if (!ACCESS_SECRET || !REFRESH_SECRET) {
  throw new Error('JWT_ACCESS_SECRET and JWT_REFRESH_SECRET must be set in environment variables.');
}

const ACCESS_EXPIRES_IN = process.env.JWT_ACCESS_EXPIRES_IN || '15m';
const REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';
const EMAIL_VERIFY_EXPIRES_IN = process.env.EMAIL_VERIFY_EXPIRES_IN || '24h';
const PASSWORD_RESET_EXPIRES_IN = process.env.PASSWORD_RESET_EXPIRES_IN || '2h';

const generateAccessToken = (userId, role) =>
  jwt.sign({ sub: userId, role }, ACCESS_SECRET, {
    expiresIn: ACCESS_EXPIRES_IN,
    issuer: 'dental-platform',
  });

const generateOpaqueToken = (bytes = 64) => {
  const raw = crypto.randomBytes(bytes).toString('hex');
  return { raw, hash: hashToken(raw) };
};

const generateRefreshToken = () => generateOpaqueToken();

const hashToken = (token) =>
  crypto.createHash('sha256').update(token).digest('hex');

const verifyAccessToken = (token) =>
  jwt.verify(token, ACCESS_SECRET, { issuer: 'dental-platform' });

const refreshTokenExpiresAt = () => new Date(Date.now() + parseDuration(REFRESH_EXPIRES_IN));
const emailVerifyExpiresAt = () => new Date(Date.now() + parseDuration(EMAIL_VERIFY_EXPIRES_IN));
const passwordResetExpiresAt = () => new Date(Date.now() + parseDuration(PASSWORD_RESET_EXPIRES_IN));

const parseDuration = (str) => {
  const units = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 };
  const match = str.match(/^(\d+)([smhd])$/);
  if (!match) throw new Error(`Invalid duration: ${str}`);
  return parseInt(match[1], 10) * units[match[2]];
};

export {
  generateAccessToken,
  generateRefreshToken,
  generateOpaqueToken,
  hashToken,
  verifyAccessToken,
  refreshTokenExpiresAt,
  emailVerifyExpiresAt,
  passwordResetExpiresAt,
};

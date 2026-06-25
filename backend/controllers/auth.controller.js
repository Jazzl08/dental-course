import {
  registerUser,
  loginUser,
  logoutUser,
  refreshTokens,
  getMeUser,
  verifyEmailToken,
  resendVerificationEmail,
  requestPasswordReset,
  resetPassword,
} from '../services/auth.service.js';

const sameSite = process.env.COOKIE_SAMESITE || 'lax';
const secureCookie = process.env.NODE_ENV === 'production' || sameSite === 'none';

const baseCookieOptions = {
  httpOnly: true,
  secure: secureCookie,
  sameSite,
};

if (process.env.COOKIE_DOMAIN) {
  baseCookieOptions.domain = process.env.COOKIE_DOMAIN;
}

const ACCESS_COOKIE_OPTIONS = {
  ...baseCookieOptions,
  path: '/',
  maxAge: 15 * 60 * 1000,
};

const REFRESH_COOKIE_OPTIONS = {
  ...baseCookieOptions,
  path: '/api/auth',
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

export const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    const ip = req.ip;
    const userAgent = req.headers['user-agent'];

    const { user, accessToken, refreshRaw } = await registerUser({
      name,
      email,
      password,
      ip,
      userAgent,
    });

    res
      .cookie('access_token', accessToken, ACCESS_COOKIE_OPTIONS)
      .cookie('refresh_token', refreshRaw, REFRESH_COOKIE_OPTIONS)
      .status(201)
      .json({
        success: true,
        message: 'Account created.',
        user: { id: user.id, name: user.name, email: user.email, role: user.role, isVerified: user.is_verified },
      });
  } catch (err) {
    next(err);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const ip = req.ip;
    const userAgent = req.headers['user-agent'];

    const { user, accessToken, refreshRaw } = await loginUser({ email, password, ip, userAgent });

    res
      .cookie('access_token', accessToken, ACCESS_COOKIE_OPTIONS)
      .cookie('refresh_token', refreshRaw, REFRESH_COOKIE_OPTIONS)
      .json({
        success: true,
        message: 'Logged in.',
        user: { id: user.id, name: user.name, email: user.email, role: user.role, isVerified: user.is_verified },
      });
  } catch (err) {
    next(err);
  }
};

export const logout = async (req, res, next) => {
  try {
    const refreshRaw = req.cookies?.refresh_token;
    await logoutUser(refreshRaw);

    res
      .clearCookie('access_token', { ...baseCookieOptions, path: '/' })
      .clearCookie('refresh_token', { ...baseCookieOptions, path: '/api/auth' })
      .json({ success: true, message: 'Logged out.' });
  } catch (err) {
    next(err);
  }
};

export const refresh = async (req, res, next) => {
  try {
    const refreshRaw = req.cookies?.refresh_token;
    const ip = req.ip;
    const userAgent = req.headers['user-agent'];

    const { newAccessToken, newRefreshRaw } = await refreshTokens({ refreshRaw, ip, userAgent });

    res
      .cookie('access_token', newAccessToken, ACCESS_COOKIE_OPTIONS)
      .cookie('refresh_token', newRefreshRaw, REFRESH_COOKIE_OPTIONS)
      .json({ success: true, message: 'Tokens refreshed.' });
  } catch (err) {
    next(err);
  }
};

export const me = async (req, res, next) => {
  try {
    const user = await getMeUser(req.user.id);
    res.json({ success: true, user });
  } catch (err) {
    next(err);
  }
};

export const verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.body;
    const user = await verifyEmailToken(token);
    res.json({ success: true, message: 'Email verified.', user });
  } catch (err) {
    next(err);
  }
};

export const resendVerification = async (req, res, next) => {
  try {
    const { email } = req.body;
    await resendVerificationEmail(email);
    res.json({ success: true, message: 'If the account exists, a verification email was sent.' });
  } catch (err) {
    next(err);
  }
};

export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    await requestPasswordReset(email);
    res.json({ success: true, message: 'If the account exists, a reset email was sent.' });
  } catch (err) {
    next(err);
  }
};

export const resetPasswordHandler = async (req, res, next) => {
  try {
    const { token, password } = req.body;
    await resetPassword({ token, password });
    res.json({ success: true, message: 'Password updated.' });
  } catch (err) {
    next(err);
  }
};

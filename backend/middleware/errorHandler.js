export const errorHandler = (err, req, res, next) => {
  const statusCode = err.status || err.statusCode || 500;
  const is5xx = statusCode >= 500;

  if (process.env.NODE_ENV !== 'production') {
    if (is5xx) {
      console.error('[ERROR]', err);
    } else {
      console.warn(`[WARN] ${statusCode} ${err.message} — ${req.method} ${req.originalUrl}`);
    }
  } else {
    if (is5xx) console.error('[ERROR]', err.message);
  }

  if (err.code === '23505') {
    return res.status(409).json({ success: false, message: 'Record already exists.' });
  }
  if (err.code === '23503') {
    return res.status(400).json({ success: false, message: 'Related record not found.' });
  }

  const payload = {
    success: false,
    message: err.message || (statusCode === 500 ? 'Server error.' : 'Request failed.'),
  };

  if (err._isAppError && err.code) {
    payload.code = err.code;
  }

  if (process.env.NODE_ENV === 'development') {
    payload.stack = err.stack;
  }

  res.status(statusCode).json(payload);
};

export const createError = (status, message, code = null) => {
  const err = new Error(message);
  err.status = status;
  err.statusCode = status;
  err._isAppError = true;
  if (code) err.code = code;
  return err;
};

export const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
};

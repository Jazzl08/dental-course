const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

let isRefreshing = false;
let pendingRequests = [];

function processQueue(error) {
  pendingRequests.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve();
  });
  pendingRequests = [];
}

async function refreshTokens() {
  const response = await fetch(`${API_BASE}/api/auth/refresh`, {
    method: 'POST',
    credentials: 'include',
  });
  if (!response.ok) throw new Error('Refresh failed');
}

async function request(path, options = {}) {
  const url = `${API_BASE}${path}`;

  const { skipRefresh = false, ...fetchOptions } = options;

  const config = {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...fetchOptions.headers,
    },
    ...fetchOptions,
  };

  if (fetchOptions.body && typeof fetchOptions.body !== 'string') {
    config.body = JSON.stringify(fetchOptions.body);
  }

  let response = await fetch(url, config);

  const shouldRefresh =
    response.status === 401 &&
    !skipRefresh &&
    path !== '/api/auth/login' &&
    path !== '/api/auth/refresh';

  if (shouldRefresh) {
    if (isRefreshing) {
      await new Promise((resolve, reject) => {
        pendingRequests.push({ resolve, reject });
      });
      response = await fetch(url, config);
    } else {
      isRefreshing = true;
      try {
        await refreshTokens();
        processQueue(null);
        response = await fetch(url, config);
      } catch {
        processQueue(new Error('Session expired'));
        window.dispatchEvent(new CustomEvent('auth:expired'));
        throw new Error('Session expired');
      } finally {
        isRefreshing = false;
      }
    }
  }

  const contentType = response.headers.get('Content-Type') || '';
  const data = contentType.includes('application/json') ? await response.json() : null;

  if (!response.ok) {
    let message;
    if (data?.errors?.length > 0) {
      message = data.errors.map((e) => e.message).join(', ');
    } else {
      message = data?.message || data?.error || `Request failed (${response.status})`;
    }
    throw Object.assign(new Error(message), { status: response.status, data });
  }

  return data;
}

export const api = {
  get:    (path, opts)  => request(path, { method: 'GET',    ...opts }),
  post:   (path, body)  => request(path, { method: 'POST',   body }),
  patch:  (path, body)  => request(path, { method: 'PATCH',  body }),
  put:    (path, body)  => request(path, { method: 'PUT',    body }),
  delete: (path)        => request(path, { method: 'DELETE' }),
};

export const auth = {
  register:           (data)  => api.post('/api/auth/register', data),
  login:              (data)  => api.post('/api/auth/login', data),
  logout:             ()      => api.post('/api/auth/logout', {}),
  me:                 ()      => api.get('/api/auth/me'),
  verifyEmail:        (data)  => api.post('/api/auth/verify-email', data),
  resendVerification: (data)  => api.post('/api/auth/resend-verification', data),
  forgotPassword:     (data)  => api.post('/api/auth/forgot-password', data),
  resetPassword:      (data)  => api.post('/api/auth/reset-password', data),
};

export const courses = {
  getAll:  ()     => api.get('/api/courses'),
  getById: (id)   => api.get(`/api/courses/${id}`),
  getBySlug: (slug) => api.get(`/api/courses/slug/${slug}`),
};

export const enrollments = {
  getAll:          ()           => api.get('/api/enrollments'),
  getOne:          (courseId)   => api.get(`/api/enrollments/${courseId}`),
  updateProgress:  (courseId, data) => api.patch(`/api/enrollments/${courseId}/progress`, data),
};

export const payments = {
  create:    (data) => api.post('/api/payments/create', data),
  getStatus: (id)   => api.get(`/api/payments/${id}`),
};

export const users = {
  getProfile:     ()     => api.get('/api/users/profile'),
  updateProfile:  (data) => api.patch('/api/users/profile', data),
  updatePassword: (data) => api.patch('/api/users/password', data),
  getCourses:     ()     => api.get('/api/users/courses'),
};

export const learning = {
  getDashboard:       ()                    => api.get('/api/learning/dashboard'),
  getLesson:          (courseId, lessonId)  => api.get(`/api/learning/courses/${courseId}/lessons/${lessonId}`),
  completeLesson:     (lessonId)            => api.post(`/api/learning/lessons/${lessonId}/complete`, {}),
  submitQuiz:         (quizId, data)        => api.post(`/api/learning/quizzes/${quizId}/submit`, data),
  getCertificate:     (courseId)            => api.get(`/api/learning/certificates/${courseId}`),
  downloadCertificate:(courseId)            => `${API_BASE}/api/learning/certificates/${courseId}/download`,
};

export const admin = {
  getDashboard:    ()           => api.get('/api/admin/dashboard'),
  getUsers:        ()           => api.get('/api/admin/users'),
  setUserStatus:   (id, data)   => api.patch(`/api/admin/users/${id}/status`, data),
  deleteUser:      (id)         => api.delete(`/api/admin/users/${id}`),
  assignCourse:    (id, data)   => api.post(`/api/admin/users/${id}/assign-course`, data),
  createCourse:    (data)       => api.post('/api/admin/courses', data),
  createWeek:      (id, data)   => api.post(`/api/admin/courses/${id}/weeks`, data),
  createLesson:    (id, data)   => api.post(`/api/admin/weeks/${id}/lessons`, data),
  getPayments:     ()           => api.get('/api/admin/payments'),
  getProgress:     ()           => api.get('/api/admin/progress'),
  getCertificates: ()           => api.get('/api/admin/certificates'),
};

export default api;

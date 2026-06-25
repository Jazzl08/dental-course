import * as adminService from '../services/admin.service.js';

export const getDashboard = async (req, res, next) => {
  try {
    const dashboard = await adminService.getDashboard();
    res.json({ success: true, dashboard });
  } catch (err) {
    next(err);
  }
};

export const listUsers = async (req, res, next) => {
  try {
    const users = await adminService.listUsers();
    res.json({ success: true, users });
  } catch (err) {
    next(err);
  }
};

export const setUserStatus = async (req, res, next) => {
  try {
    const user = await adminService.setUserStatus(req.params.id, req.body.isBlocked);
    res.json({ success: true, user });
  } catch (err) {
    next(err);
  }
};

export const deleteUser = async (req, res, next) => {
  try {
    if (String(req.user.id) === String(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Je kunt je eigen account niet verwijderen.' });
    }
    await adminService.deleteUser(req.params.id);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};

export const assignCourse = async (req, res, next) => {
  try {
    const enrollment = await adminService.assignCourse(req.params.id, req.body.courseId);
    res.json({ success: true, enrollment });
  } catch (err) {
    next(err);
  }
};

export const createCourse = async (req, res, next) => {
  try {
    const course = await adminService.createCourse(req.body);
    res.status(201).json({ success: true, course });
  } catch (err) {
    next(err);
  }
};

export const createWeek = async (req, res, next) => {
  try {
    const week = await adminService.createWeek(req.params.id, req.body);
    res.status(201).json({ success: true, week });
  } catch (err) {
    next(err);
  }
};

export const createLesson = async (req, res, next) => {
  try {
    const lesson = await adminService.createLesson(req.params.id, req.body);
    res.status(201).json({ success: true, lesson });
  } catch (err) {
    next(err);
  }
};

export const createQuizQuestion = async (req, res, next) => {
  try {
    const question = await adminService.createQuizQuestion(req.params.id, req.body);
    res.status(201).json({ success: true, question });
  } catch (err) {
    next(err);
  }
};

export const listPayments = async (req, res, next) => {
  try {
    const data = await adminService.getPayments();
    res.json({ success: true, ...data });
  } catch (err) {
    next(err);
  }
};

export const listProgress = async (req, res, next) => {
  try {
    const data = await adminService.getProgress();
    res.json({ success: true, ...data });
  } catch (err) {
    next(err);
  }
};

export const listCertificates = async (req, res, next) => {
  try {
    const data = await adminService.getCertificates();
    res.json({ success: true, ...data });
  } catch (err) {
    next(err);
  }
};

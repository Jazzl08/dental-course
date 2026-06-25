import {
  getMyCoursesService,
  getProfileService,
  updatePasswordService,
  updateProfileService,
} from '../services/users.service.js';

export const getMyCourses = async (req, res, next) => {
  try {
    const courses = await getMyCoursesService(req.user.id);
    res.json({ success: true, courses });
  } catch (err) {
    next(err);
  }
};

export const getProfile = async (req, res, next) => {
  try {
    const profile = await getProfileService(req.user.id);
    res.json({ success: true, profile });
  } catch (err) {
    next(err);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const profile = await updateProfileService(req.user.id, req.body);
    res.json({ success: true, profile });
  } catch (err) {
    next(err);
  }
};

export const updatePassword = async (req, res, next) => {
  try {
    await updatePasswordService(req.user.id, req.body);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};

import {
  getMyEnrollmentsService,
  getEnrollmentByCourseService,
  updateEnrollmentProgressService,
} from '../services/enrollments.service.js';

export const getMyEnrollments = async (req, res, next) => {
  try {
    const enrollments = await getMyEnrollmentsService(req.user.id);
    res.json({ success: true, enrollments });
  } catch (err) {
    next(err);
  }
};

export const getEnrollmentByCourse = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const enrollment = await getEnrollmentByCourseService({ userId: req.user.id, courseId });
    res.json({ success: true, enrollment });
  } catch (err) {
    next(err);
  }
};

export const updateEnrollmentProgress = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const { progressPct } = req.body;
    const enrollment = await updateEnrollmentProgressService({
      userId: req.user.id,
      courseId,
      progressPct,
    });
    res.json({ success: true, enrollment });
  } catch (err) {
    next(err);
  }
};

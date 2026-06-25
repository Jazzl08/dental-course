import * as coursesService from '../services/courses.service.js';

export const getAllCourses = async (req, res, next) => {
  try {
    const courses = await coursesService.getAllCourses();
    res.json({ success: true, courses });
  } catch (err) {
    next(err);
  }
};

export const getCourseById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const course = await coursesService.getCourseById(id);
    res.json({ success: true, course });
  } catch (err) {
    next(err);
  }
};

export const getCourseBySlug = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const course = await coursesService.getCourseBySlug(slug);
    res.json({ success: true, course });
  } catch (err) {
    next(err);
  }
};

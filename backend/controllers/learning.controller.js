import * as learningService from '../services/learning.service.js';

export const getDashboard = async (req, res, next) => {
  try {
    const dashboard = await learningService.getDashboard(req.user.id);
    res.json({ success: true, dashboard });
  } catch (err) {
    next(err);
  }
};

export const getLesson = async (req, res, next) => {
  try {
    const lesson = await learningService.getLesson(req.user.id, req.params.courseId, req.params.lessonId);
    res.json({ success: true, lesson });
  } catch (err) {
    next(err);
  }
};

export const completeLesson = async (req, res, next) => {
  try {
    const progress = await learningService.completeLesson(req.user.id, req.params.lessonId);
    res.json({ success: true, progress });
  } catch (err) {
    next(err);
  }
};

export const submitQuiz = async (req, res, next) => {
  try {
    const result = await learningService.submitQuiz(req.user.id, req.params.quizId, req.body.answers);
    res.json({ success: true, result });
  } catch (err) {
    next(err);
  }
};

export const getCertificate = async (req, res, next) => {
  try {
    const certificate = await learningService.getOrCreateCertificate(req.user.id, req.params.courseId);
    res.json({ success: true, certificate });
  } catch (err) {
    next(err);
  }
};

export const downloadCertificate = async (req, res, next) => {
  try {
    const { certificate, pdf } = await learningService.generateCertificatePdf(req.user.id, req.params.courseId);
    await learningService.markCertificateDownloaded(certificate.id);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${certificate.certificate_number}.pdf"`);
    res.send(pdf);
  } catch (err) {
    next(err);
  }
};

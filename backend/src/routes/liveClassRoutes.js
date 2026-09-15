const express = require('express');
const {
  getLiveClasses,
  getUpcomingLiveClasses,
  scheduleLiveClass,
  updateLiveClass,
  startLiveClass,
  endLiveClass,
  getJoinAccess,
  getRecordedClasses,
  createRecordedClass,
} = require('../controllers/liveClassController');
const { authenticate, authorize, optionalAuthenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const {
  scheduleLiveClassValidation,
  updateLiveClassValidation,
  liveClassIdParamValidation,
  endLiveClassValidation,
  listLiveClassesValidation,
  recordedClassesValidation,
} = require('../validators/liveClassValidators');

const router = express.Router();

router.get('/upcoming', optionalAuthenticate, getUpcomingLiveClasses);
router.get('/recordings', authenticate, recordedClassesValidation, validate, getRecordedClasses);
router.get('/', authenticate, listLiveClassesValidation, validate, getLiveClasses);
router.get('/:id/join', authenticate, liveClassIdParamValidation, validate, getJoinAccess);
router.post('/', authenticate, authorize('TEACHER', 'ADMIN'), scheduleLiveClassValidation, validate, scheduleLiveClass);
router.post('/:id/start', authenticate, authorize('TEACHER', 'ADMIN'), liveClassIdParamValidation, validate, startLiveClass);
router.post('/:id/end', authenticate, authorize('TEACHER', 'ADMIN'), endLiveClassValidation, validate, endLiveClass);
router.put('/:id', authenticate, authorize('TEACHER', 'ADMIN'), updateLiveClassValidation, validate, updateLiveClass);
router.post('/recordings', authenticate, authorize('TEACHER', 'ADMIN'), createRecordedClass);

module.exports = router;

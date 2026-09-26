const express = require('express');
const { getHome, getExamTracks, getTestSeries } = require('../controllers/platformController');

const router = express.Router();

router.get('/home', getHome);
router.get('/exam-tracks', getExamTracks);
router.get('/test-series', getTestSeries);

module.exports = router;

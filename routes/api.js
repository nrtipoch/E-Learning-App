const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const assessmentService = require('../services/assessmentService');

// Test endpoint
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'E-Learning API is working!',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Knowledge assessment endpoint
router.post('/assess-knowledge', [
  body('userName').notEmpty().withMessage('User name is required'),
  body('fieldOfInterest').notEmpty().withMessage('Field of interest is required'),
  body('assessmentTopic').notEmpty().withMessage('Assessment topic is required'),
  body('currentLevel').isIn(['beginner', 'intermediate', 'advanced']).withMessage('Invalid level')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const assessment = await assessmentService.assessUserKnowledge(req.body);
    res.json(assessment);
  } catch (error) {
    console.error('Assessment error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to assess knowledge'
    });
  }
});

// Job market analysis endpoint
router.post('/analyze-job-market', [
  body('country').notEmpty().withMessage('Country is required'),
  body('industry').notEmpty().withMessage('Industry is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const analysis = await assessmentService.analyzeJobMarket(req.body);
    res.json(analysis);
  } catch (error) {
    console.error('Job market analysis error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to analyze job market'
    });
  }
});

module.exports = router;

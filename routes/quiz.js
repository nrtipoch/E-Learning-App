const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const geminiService = require('../services/geminiService');

// Generate quiz with Gemini AI
router.post('/generate', [
  body('subjectName').notEmpty().withMessage('Subject name is required'),
  body('subjectLevel').notEmpty().withMessage('Subject level is required'),
  body('topicDetails').notEmpty().withMessage('Topic details are required'),
  body('questionCount').isInt({ min: 1, max: 50 }).withMessage('Question count must be between 1 and 50'),
  body('difficulty').isIn(['ง่าย', 'ปานกลาง', 'ยาก']).withMessage('Invalid difficulty level')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const result = await geminiService.generateQuiz(req.body);
    res.json(result);
  } catch (error) {
    console.error('Quiz generation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate quiz: ' + error.message
    });
  }
});

// Submit quiz answers
router.post('/submit', [
  body('quizTitle').notEmpty().withMessage('Quiz title is required'),
  body('totalQuestions').isInt({ min: 1 }).withMessage('Total questions must be a positive integer'),
  body('correctCount').isInt({ min: 0 }).withMessage('Correct count must be a non-negative integer'),
  body('timeSpent').optional().isInt({ min: 0 }).withMessage('Time spent must be a non-negative integer')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    // Here you would typically save to database
    // For now, we'll just return success
    const { quizTitle, totalQuestions, correctCount, timeSpent = 0 } = req.body;
    const percentage = Math.round((correctCount / totalQuestions) * 100);
    
    console.log('Quiz Result:', {
      title: quizTitle,
      score: `${correctCount}/${totalQuestions}`,
      percentage: `${percentage}%`,
      timeSpent: `${timeSpent}s`
    });

    res.json({
      success: true,
      message: 'Quiz result saved successfully',
      data: {
        score: correctCount,
        totalQuestions,
        percentage,
        timeSpent
      }
    });
  } catch (error) {
    console.error('Submit quiz error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to submit quiz'
    });
  }
});

// Get quiz statistics
router.get('/statistics', async (req, res) => {
  try {
    // Mock statistics - in real app, get from database
    const stats = {
      totalQuizzes: 25,
      averageScore: 78,
      highestScore: 95,
      lowestScore: 45,
      topSubjects: [
        { subject: 'คณิตศาสตร์', count: 8 },
        { subject: 'ฟิสิกส์', count: 6 },
        { subject: 'เคมี', count: 4 }
      ],
      recentActivity: []
    };

    res.json({
      success: true,
      statistics: stats
    });
  } catch (error) {
    console.error('Statistics error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get statistics'
    });
  }
});

// Test Gemini connection
router.get('/test-connection', async (req, res) => {
  try {
    const result = await geminiService.testConnection();
    res.json(result);
  } catch (error) {
    console.error('Connection test error:', error);
    res.status(500).json({
      success: false,
      error: 'Connection test failed: ' + error.message
    });
  }
});

module.exports = router;

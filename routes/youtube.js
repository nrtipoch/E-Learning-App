const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const youtubeService = require('../services/youtubeService');

// Search YouTube videos
router.post('/search', [
  body('query').notEmpty().withMessage('Search query is required'),
  body('maxResults').optional().isInt({ min: 1, max: 50 }).withMessage('Max results must be between 1 and 50')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { query, maxResults = 10 } = req.body;
    const videos = await youtubeService.searchYouTubeVideos(query, maxResults);
    
    res.json({
      success: true,
      videos,
      total: videos.length,
      query
    });
  } catch (error) {
    console.error('YouTube search error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search YouTube videos'
    });
  }
});

module.exports = router;

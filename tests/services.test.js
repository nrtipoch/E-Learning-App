const geminiService = require('../services/geminiService');
const youtubeService = require('../services/youtubeService');
const assessmentService = require('../services/assessmentService');

// Mock external APIs for testing
jest.mock('axios');
const axios = require('axios');

describe('Services Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Gemini Service', () => {
    test('should generate quiz successfully', async () => {
      const mockResponse = {
        data: {
          candidates: [{
            content: {
              parts: [{
                text: JSON.stringify({
                  title: 'Test Quiz',
                  subject: 'Mathematics',
                  questions: [{
                    id: 1,
                    question: 'What is 2+2?',
                    options: ['3', '4', '5', '6'],
                    correct: 1,
                    explanation: '2+2=4'
                  }]
                })
              }]
            }
          }]
        }
      };

      axios.post.mockResolvedValue(mockResponse);

      const subjectData = {
        subjectName: 'Mathematics',
        subjectLevel: 'ปริญญาตรี',
        topicDetails: 'Basic arithmetic',
        questionCount: 1,
        difficulty: 'ง่าย'
      };

      const result = await geminiService.generateQuiz(subjectData);

      expect(result.success).toBe(true);
      expect(result.quiz).toBeDefined();
      expect(result.quiz.questions).toHaveLength(1);
      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining('generativelanguage.googleapis.com'),
        expect.any(Object),
        expect.objectContaining({
          headers: expect.objectContaining({
            'x-goog-api-key': expect.any(String)
          })
        })
      );
    });

    test('should handle API errors', async () => {
      axios.post.mockRejectedValue(new Error('API Error'));

      const subjectData = {
        subjectName: 'Mathematics',
        subjectLevel: 'ปริญญาตรี',
        topicDetails: 'Basic arithmetic',
        questionCount: 1,
        difficulty: 'ง่าย'
      };

      await expect(geminiService.generateQuiz(subjectData))
        .rejects.toThrow('Failed to generate quiz');
    });

    test('should test connection successfully', async () => {
      const mockResponse = {
        data: {
          candidates: [{
            content: {
              parts: [{
                text: '{"status": "การเชื่อมต่อสำเร็จ"}'
              }]
            }
          }]
        }
      };

      axios.post.mockResolvedValue(mockResponse);

      const result = await geminiService.testConnection();

      expect(result.success).toBe(true);
      expect(result.message).toContain('successful');
    });

    test('should create proper prompt', () => {
      const subjectData = {
        subjectName: 'Physics',
        subjectLevel: 'ปริญญาตรี',
        topicDetails: 'Newton laws',
        questionCount: 5,
        difficulty: 'ปานกลาง'
      };

      const prompt = geminiService.createPrompt(subjectData);

      expect(prompt).toContain('Physics');
      expect(prompt).toContain('ปริญญาตรี');
      expect(prompt).toContain('Newton laws');
      expect(prompt).toContain('5');
      expect(prompt).toContain('ปานกลาง');
    });

    test('should parse quiz JSON correctly', () => {
      const jsonText = `{
        "title": "Test Quiz",
        "questions": [
          {
            "question": "Test question?",
            "options": ["A", "B", "C", "D"],
            "correct": 0,
            "explanation": "Test explanation"
          }
        ]
      }`;

      const quiz = geminiService.parseQuizFromText(jsonText);

      expect(quiz.title).toBe('Test Quiz');
      expect(quiz.questions).toHaveLength(1);
      expect(quiz.questions[0].id).toBe(1); // Auto-generated ID
    });

    test('should handle malformed JSON', () => {
      const malformedJson = '{ invalid json }';

      expect(() => {
        geminiService.parseQuizFromText(malformedJson);
      }).toThrow('Failed to parse quiz data');
    });
  });

  describe('YouTube Service', () => {
    test('should search videos successfully', async () => {
      const mockResponse = {
        data: {
          items: [
            {
              id: { kind: 'youtube#video', videoId: 'test123' },
              snippet: {
                title: 'Test Video',
                description: 'Test Description',
                thumbnails: {
                  high: { url: 'https://example.com/thumb.jpg' }
                },
                publishedAt: '2023-01-01T00:00:00Z',
                channelTitle: 'Test Channel'
              }
            }
          ]
        }
      };

      axios.get.mockResolvedValue(mockResponse);

      const result = await youtubeService.searchYouTubeVideos('test query', 5);

      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('Test Video');
      expect(result[0].videoId).toBe('test123');
      expect(result[0].url).toBe('https://www.youtube.com/watch?v=test123');
    });

    test('should handle empty search results', async () => {
      const mockResponse = {
        data: { items: [] }
      };

      axios.get.mockResolvedValue(mockResponse);

      const result = await youtubeService.searchYouTubeVideos('empty query');

      expect(result).toHaveLength(0);
    });

    test('should filter non-video results', async () => {
      const mockResponse = {
        data: {
          items: [
            {
              id: { kind: 'youtube#channel', channelId: 'channel123' },
              snippet: { title: 'Channel Result' }
            },
            {
              id: { kind: 'youtube#video', videoId: 'video123' },
              snippet: {
                title: 'Video Result',
                thumbnails: { high: { url: 'thumb.jpg' } },
                publishedAt: '2023-01-01T00:00:00Z',
                channelTitle: 'Test Channel'
              }
            }
          ]
        }
      };

      axios.get.mockResolvedValue(mockResponse);

      const result = await youtubeService.searchYouTubeVideos('mixed results');

      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('Video Result');
    });

    test('should handle API errors', async () => {
      axios.get.mockRejectedValue(new Error('YouTube API Error'));

      await expect(youtubeService.searchYouTubeVideos('test'))
        .rejects.toThrow('Failed to search YouTube videos');
    });

    test('should get video details', async () => {
      const mockResponse = {
        data: {
          items: [{
            id: 'test123',
            snippet: {
              title: 'Test Video',
              description: 'Full description'
            },
            statistics: {
              viewCount: '1000',
              likeCount: '100'
            }
          }]
        }
      };

      axios.get.mockResolvedValue(mockResponse);

      const result = await youtubeService.getVideoDetails('test123');

      expect(result.id).toBe('test123');
      expect(result.snippet.title).toBe('Test Video');
      expect(result.statistics.viewCount).toBe('1000');
    });
  });

  describe('Assessment Service', () => {
    test('should assess user knowledge', async () => {
      const assessmentData = {
        userName: 'Test User',
        fieldOfInterest: 'Computer Science',
        assessmentTopic: 'JavaScript',
        currentLevel: 'intermediate',
        work: 'Developer'
      };

      const result = await assessmentService.assessUserKnowledge(assessmentData);

      expect(result.success).toBe(true);
      expect(result.score).toBeGreaterThanOrEqual(20);
      expect(result.score).toBeLessThanOrEqual(95);
      expect(result.level).toBe('intermediate');
      expect(result.topic).toBe('JavaScript');
      expect(Array.isArray(result.recommendations)).toBe(true);
    });

    test('should adjust score based on level', async () => {
      const beginnerData = {
        userName: 'Beginner',
        fieldOfInterest: 'Computer Science',
        assessmentTopic: 'Programming',
        currentLevel: 'beginner'
      };

      const advancedData = {
        ...beginnerData,
        userName: 'Advanced',
        currentLevel: 'advanced'
      };

      // Run multiple times to get average (due to randomness)
      const beginnerResults = await Promise.all(
        Array(10).fill().map(() => assessmentService.assessUserKnowledge(beginnerData))
      );
      
      const advancedResults = await Promise.all(
        Array(10).fill().map(() => assessmentService.assessUserKnowledge(advancedData))
      );

      const avgBeginnerScore = beginnerResults.reduce((sum, r) => sum + r.score, 0) / 10;
      const avgAdvancedScore = advancedResults.reduce((sum, r) => sum + r.score, 0) / 10;

      expect(avgAdvancedScore).toBeGreaterThan(avgBeginnerScore);
    });

    test('should generate appropriate recommendations', () => {
      const lowScoreRecs = assessmentService.generateRecommendations('JavaScript', 40, 'beginner');
      const highScoreRecs = assessmentService.generateRecommendations('JavaScript', 90, 'advanced');

      expect(lowScoreRecs).toContain(expect.stringMatching(/เริ่มต้น.*พื้นฐาน/));
      expect(highScoreRecs).toContain(expect.stringMatching(/สอน.*ให้ผู้อื่น/));
    });

    test('should analyze job market', async () => {
      const analysisData = {
        country: 'Thailand',
        industry: 'technology'
      };

      const result = await assessmentService.analyzeJobMarket(analysisData);

      expect(result.success).toBe(true);
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.data.length).toBeGreaterThan(0);
      expect(result.country).toBe('Thailand');
      expect(result.industry).toBe('technology');

      // Check job data structure
      const job = result.data[0];
      expect(job.position).toBeDefined();
      expect(job.salary).toBeDefined();
      expect(job.demand).toMatch(/^(high|medium|low)$/);
      expect(job.demandText).toMatch(/^(สูง|ปานกลาง|ต่ำ)$/);
    });

    test('should generate job data for different industries', () => {
      const techJobs = assessmentService.generateJobMarketData('USA', 'technology');
      const financeJobs = assessmentService.generateJobMarketData('USA', 'finance');
      const healthJobs = assessmentService.generateJobMarketData('USA', 'healthcare');

      expect(techJobs.some(job => job.position.includes('Developer'))).toBe(true);
      expect(financeJobs.some(job => job.position.includes('Financial'))).toBe(true);
      expect(healthJobs.some(job => job.position.includes('Health'))).toBe(true);
    });
  });

  describe('Integration Tests', () => {
    test('should handle service chain: assessment -> recommendations -> youtube search', async () => {
      // Mock YouTube service
      axios.get.mockResolvedValue({
        data: {
          items: [{
            id: { kind: 'youtube#video', videoId: 'learn123' },
            snippet: {
              title: 'Learn JavaScript',
              thumbnails: { high: { url: 'thumb.jpg' } },
              publishedAt: '2023-01-01T00:00:00Z',
              channelTitle: 'Education Channel'
            }
          }]
        }
      });

      // 1. Assess knowledge
      const assessment = await assessmentService.assessUserKnowledge({
        userName: 'Student',
        fieldOfInterest: 'Computer Science',
        assessmentTopic: 'JavaScript',
        currentLevel: 'beginner'
      });

      expect(assessment.success).toBe(true);

      // 2. Get learning videos based on assessment
      const videos = await youtubeService.searchYouTubeVideos('JavaScript tutorial', 3);

      expect(videos).toHaveLength(1);
      expect(videos[0].title).toContain('JavaScript');
    });

    test('should handle errors gracefully across services', async () => {
      // Test Gemini service error handling
      axios.post.mockRejectedValue(new Error('Network error'));

      await expect(geminiService.generateQuiz({
        subjectName: 'Test',
        subjectLevel: 'ปริญญาตรี',
        topicDetails: 'Test topic',
        questionCount: 1,
        difficulty: 'ง่าย'
      })).rejects.toThrow();

      // Test YouTube service error handling
      axios.get.mockRejectedValue(new Error('API limit exceeded'));

      await expect(youtubeService.searchYouTubeVideos('test'))
        .rejects.toThrow();

      // Assessment service should still work (no external dependencies)
      const result = await assessmentService.assessUserKnowledge({
        userName: 'Test',
        fieldOfInterest: 'Computer Science',
        assessmentTopic: 'Programming',
        currentLevel: 'beginner'
      });

      expect(result.success).toBe(true);
    });
  });

  describe('Performance Tests', () => {
    test('should complete assessment in reasonable time', async () => {
      const startTime = Date.now();

      await assessmentService.assessUserKnowledge({
        userName: 'Speed Test',
        fieldOfInterest: 'Computer Science',
        assessmentTopic: 'Performance',
        currentLevel: 'intermediate'
      });

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(1000); // Should complete within 1 second
    });

    test('should handle multiple concurrent requests', async () => {
      const promises = Array(5).fill().map((_, i) =>
        assessmentService.assessUserKnowledge({
          userName: `User ${i}`,
          fieldOfInterest: 'Computer Science',
          assessmentTopic: 'Concurrency Test',
          currentLevel: 'intermediate'
        })
      );

      const results = await Promise.all(promises);

      expect(results).toHaveLength(5);
      results.forEach(result => {
        expect(result.success).toBe(true);
      });
    });
  });
});

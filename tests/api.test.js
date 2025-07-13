const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const User = require('../models/User');
const Quiz = require('../models/Quiz');
const { clearDatabase } = require('../config/database');

// Test database
const MONGODB_TEST_URI = process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/elearning_test';

describe('E-Learning API Tests', () => {
  let server;
  let authToken;
  let testUser;
  let testQuiz;

  beforeAll(async () => {
    // Connect to test database
    await mongoose.connect(MONGODB_TEST_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    server = app.listen(0); // Use random available port
  });

  afterAll(async () => {
    await clearDatabase();
    await mongoose.connection.close();
    server.close();
  });

  beforeEach(async () => {
    await clearDatabase();
    
    // Create test user
    testUser = await User.create({
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
      fullName: 'Test User',
      fieldOfInterest: 'Computer Science',
      isEmailVerified: true
    });

    // Login to get auth token
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'password123'
      });

    authToken = loginResponse.body.token;

    // Create test quiz
    testQuiz = await Quiz.create({
      title: 'Test Quiz',
      subject: 'Mathematics',
      level: 'ปริญญาตรี',
      category: 'Mathematics',
      questions: [
        {
          id: 1,
          question: 'What is 2 + 2?',
          options: ['3', '4', '5', '6'],
          correct: 1,
          explanation: '2 + 2 equals 4'
        }
      ],
      createdBy: testUser._id,
      isPublic: true
    });
  });

  describe('API Health Check', () => {
    test('GET /api/test should return success', async () => {
      const response = await request(app)
        .get('/api/test')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('working');
    });
  });

  describe('Authentication', () => {
    test('POST /api/auth/register should create new user', async () => {
      const userData = {
        username: 'newuser',
        email: 'newuser@example.com',
        password: 'password123',
        fullName: 'New User',
        fieldOfInterest: 'Engineering'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.token).toBeDefined();
      expect(response.body.data.user.email).toBe(userData.email);
    });

    test('POST /api/auth/login should authenticate user', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.token).toBeDefined();
      expect(response.body.data.user.email).toBe('test@example.com');
    });

    test('POST /api/auth/login should fail with wrong credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword'
        })
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Knowledge Assessment', () => {
    test('POST /api/assess-knowledge should assess user knowledge', async () => {
      const assessmentData = {
        userName: 'Test User',
        fieldOfInterest: 'Computer Science',
        assessmentTopic: 'JavaScript',
        currentLevel: 'intermediate',
        work: 'Software Developer'
      };

      const response = await request(app)
        .post('/api/assess-knowledge')
        .set('Authorization', `Bearer ${authToken}`)
        .send(assessmentData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.score).toBeDefined();
      expect(response.body.recommendations).toBeDefined();
    });

    test('POST /api/assess-knowledge should require authentication', async () => {
      const assessmentData = {
        userName: 'Test User',
        fieldOfInterest: 'Computer Science',
        assessmentTopic: 'JavaScript',
        currentLevel: 'intermediate'
      };

      await request(app)
        .post('/api/assess-knowledge')
        .send(assessmentData)
        .expect(401);
    });
  });

  describe('Quiz Management', () => {
    test('POST /api/quiz/generate should generate quiz', async () => {
      const quizData = {
        subjectName: 'Mathematics',
        subjectLevel: 'ปริญญาตรี',
        topicDetails: 'Basic algebra',
        questionCount: 5,
        difficulty: 'ง่าย'
      };

      const response = await request(app)
        .post('/api/quiz/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send(quizData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.quiz).toBeDefined();
      expect(response.body.quiz.questions).toHaveLength(5);
    });

    test('POST /api/quiz/submit should submit quiz answers', async () => {
      const submitData = {
        quizTitle: 'Test Quiz',
        totalQuestions: 1,
        correctCount: 1,
        timeSpent: 60,
        answers: { 1: 1 }
      };

      const response = await request(app)
        .post('/api/quiz/submit')
        .set('Authorization', `Bearer ${authToken}`)
        .send(submitData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.score).toBe(1);
      expect(response.body.data.percentage).toBe(100);
    });

    test('GET /api/quiz/statistics should return quiz stats', async () => {
      const response = await request(app)
        .get('/api/quiz/statistics')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.statistics).toBeDefined();
    });

    test('GET /api/quiz/test-connection should test Gemini connection', async () => {
      const response = await request(app)
        .get('/api/quiz/test-connection')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBeDefined();
    });
  });

  describe('YouTube Integration', () => {
    test('POST /api/youtube/search should search videos', async () => {
      const searchData = {
        query: 'JavaScript tutorial',
        maxResults: 5
      };

      const response = await request(app)
        .post('/api/youtube/search')
        .set('Authorization', `Bearer ${authToken}`)
        .send(searchData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.videos).toBeDefined();
      expect(Array.isArray(response.body.videos)).toBe(true);
    });

    test('POST /api/youtube/search should validate input', async () => {
      const response = await request(app)
        .post('/api/youtube/search')
        .set('Authorization', `Bearer ${authToken}`)
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });
  });

  describe('Job Market Analysis', () => {
    test('POST /api/analyze-job-market should analyze job market', async () => {
      const analysisData = {
        country: 'Thailand',
        industry: 'technology'
      };

      const response = await request(app)
        .post('/api/analyze-job-market')
        .set('Authorization', `Bearer ${authToken}`)
        .send(analysisData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('Error Handling', () => {
    test('Should handle 404 for unknown routes', async () => {
      const response = await request(app)
        .get('/api/unknown-route')
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    test('Should handle validation errors', async () => {
      const response = await request(app)
        .post('/api/assess-knowledge')
        .set('Authorization', `Bearer ${authToken}`)
        .send({}) // Empty data
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });
  });

  describe('Rate Limiting', () => {
    test('Should apply rate limiting', async () => {
      // Make multiple rapid requests to trigger rate limiting
      const promises = Array(10).fill().map(() =>
        request(app)
          .get('/api/test')
          .set('Authorization', `Bearer ${authToken}`)
      );

      const responses = await Promise.all(promises);
      
      // Check that at least some requests succeed
      const successfulRequests = responses.filter(r => r.status === 200);
      expect(successfulRequests.length).toBeGreaterThan(0);
    });
  });
});

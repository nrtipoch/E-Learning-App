const mongoose = require('mongoose');

// MongoDB connection configuration
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/elearning';
    
    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 10, // Maintain up to 10 socket connections
      serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      family: 4, // Use IPv4, skip trying IPv6
      bufferCommands: false, // Disable mongoose buffering
      bufferMaxEntries: 0, // Disable mongoose buffering
    };

    const conn = await mongoose.connect(mongoURI, options);

    console.log(`✅ MongoDB Connected: ${conn.connection.host}:${conn.connection.port}/${conn.connection.name}`);
    
    // Log connection events
    mongoose.connection.on('connected', () => {
      console.log('📡 Mongoose connected to MongoDB');
    });

    mongoose.connection.on('error', (err) => {
      console.error('❌ Mongoose connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('📴 Mongoose disconnected from MongoDB');
    });

    // Handle app termination
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('🔌 MongoDB connection closed through app termination');
      process.exit(0);
    });

    return conn;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    
    // Retry connection after 5 seconds
    setTimeout(connectDB, 5000);
  }
};

// Database health check
const checkDBHealth = async () => {
  try {
    const adminDb = mongoose.connection.db.admin();
    const result = await adminDb.ping();
    
    return {
      status: 'healthy',
      message: 'Database connection is working',
      response: result
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      message: 'Database connection failed',
      error: error.message
    };
  }
};

// Get database statistics
const getDBStats = async () => {
  try {
    const db = mongoose.connection.db;
    const stats = await db.stats();
    
    return {
      database: db.databaseName,
      collections: stats.collections,
      documents: stats.objects,
      avgObjSize: stats.avgObjSize,
      dataSize: `${(stats.dataSize / 1024 / 1024).toFixed(2)} MB`,
      storageSize: `${(stats.storageSize / 1024 / 1024).toFixed(2)} MB`,
      indexes: stats.indexes,
      indexSize: `${(stats.indexSize / 1024 / 1024).toFixed(2)} MB`
    };
  } catch (error) {
    throw new Error(`Failed to get database stats: ${error.message}`);
  }
};

// Clear database (for testing)
const clearDatabase = async () => {
  if (process.env.NODE_ENV !== 'test') {
    throw new Error('Database clearing is only allowed in test environment');
  }
  
  try {
    const collections = await mongoose.connection.db.collections();
    
    await Promise.all(
      collections.map(collection => collection.deleteMany({}))
    );
    
    console.log('🧹 Test database cleared');
  } catch (error) {
    console.error('❌ Error clearing database:', error);
    throw error;
  }
};

// Seed database with initial data
const seedDatabase = async () => {
  try {
    const User = require('../models/User');
    const Quiz = require('../models/Quiz');
    
    // Check if data already exists
    const userCount = await User.countDocuments();
    const quizCount = await Quiz.countDocuments();
    
    if (userCount > 0 || quizCount > 0) {
      console.log('📊 Database already contains data, skipping seed');
      return;
    }

    // Create admin user
    const adminUser = await User.create({
      username: 'admin',
      email: 'admin@elearning.com',
      password: 'admin123',
      fullName: 'System Administrator',
      fieldOfInterest: 'Information Technology',
      currentLevel: 'advanced',
      isEmailVerified: true,
      role: 'admin'
    });

    // Create sample quiz
    const sampleQuiz = await Quiz.create({
      title: 'Basic Programming Concepts',
      subject: 'Computer Science',
      level: 'ปริญญาตรี',
      difficulty: 'ง่าย',
      category: 'Computer Science',
      description: 'Test your understanding of basic programming concepts',
      questions: [
        {
          id: 1,
          question: 'What is a variable in programming?',
          options: [
            'A storage location with a name',
            'A fixed value',
            'A programming language',
            'A type of loop'
          ],
          correct: 0,
          explanation: 'A variable is a storage location in memory that has a name and can hold data.'
        },
        {
          id: 2,
          question: 'Which of the following is a programming loop?',
          options: [
            'if statement',
            'for loop',
            'variable declaration',
            'function call'
          ],
          correct: 1,
          explanation: 'A for loop is a control structure that repeats a block of code.'
        }
      ],
      timeLimit: 30,
      passingScore: 70,
      createdBy: adminUser._id,
      isPublic: true,
      aiGenerated: false
    });

    console.log('🌱 Database seeded successfully');
    console.log(`👤 Admin user created: ${adminUser.email}`);
    console.log(`📝 Sample quiz created: ${sampleQuiz.title}`);
    
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }
};

// Database backup (simple JSON export)
const backupDatabase = async () => {
  try {
    const fs = require('fs').promises;
    const path = require('path');
    
    const User = require('../models/User');
    const Quiz = require('../models/Quiz');
    const Assessment = require('../models/Assessment');
    
    const backupData = {
      timestamp: new Date().toISOString(),
      users: await User.find({}).lean(),
      quizzes: await Quiz.find({}).lean(),
      assessments: await Assessment.find({}).lean()
    };
    
    const backupDir = path.join(__dirname, '../backups');
    await fs.mkdir(backupDir, { recursive: true });
    
    const filename = `backup_${new Date().toISOString().split('T')[0]}.json`;
    const filepath = path.join(backupDir, filename);
    
    await fs.writeFile(filepath, JSON.stringify(backupData, null, 2));
    
    console.log(`💾 Database backup created: ${filepath}`);
    return filepath;
  } catch (error) {
    console.error('❌ Error creating backup:', error);
    throw error;
  }
};

module.exports = {
  connectDB,
  checkDBHealth,
  getDBStats,
  clearDatabase,
  seedDatabase,
  backupDatabase
};

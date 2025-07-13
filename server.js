const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Basic route
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>E-Learning Platform</title>
        <style>
            body { 
                font-family: Arial, sans-serif; 
                text-align: center; 
                background: linear-gradient(135deg, #667eea, #764ba2);
                color: white;
                padding: 50px;
            }
            .container {
                background: rgba(255,255,255,0.1);
                padding: 40px;
                border-radius: 20px;
                display: inline-block;
            }
            .status { color: #4CAF50; margin: 20px 0; }
            button {
                background: #4CAF50;
                color: white;
                border: none;
                padding: 12px 24px;
                border-radius: 8px;
                cursor: pointer;
                font-size: 16px;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>🎓 E-Learning Platform</h1>
            <div class="status">✅ เซิร์ฟเวอร์ทำงานปกติแล้ว!</div>
            <button onclick="testAPI()">ทดสอบ API</button>
            <div id="result" style="margin-top: 20px;"></div>
        </div>
        
        <script>
            async function testAPI() {
                const result = document.getElementById('result');
                try {
                    const response = await fetch('/api/test');
                    const data = await response.json();
                    result.innerHTML = data.success 
                        ? '<div style="color: #4CAF50;">✅ API ทำงานปกติ!</div>'
                        : '<div style="color: #f44336;">❌ API มีปัญหา</div>';
                } catch (error) {
                    result.innerHTML = '<div style="color: #f44336;">❌ ไม่สามารถเชื่อมต่อ API</div>';
                }
            }
        </script>
    </body>
    </html>
  `);
});

// API Routes
app.get('/api/test', (req, res) => {
  res.json({
    success: true,
    message: 'E-Learning API is working perfectly!',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Knowledge Assessment API
app.post('/api/assess-knowledge', (req, res) => {
  const { userName, fieldOfInterest, assessmentTopic, currentLevel } = req.body;
  
  // Simulate assessment
  const score = Math.floor(Math.random() * 40) + 60;
  const recommendations = [
    `เริ่มต้นศึกษา ${assessmentTopic} ในระดับ ${currentLevel}`,
    'ฝึกทำโปรเจคเพื่อเสริมสร้างประสบการณ์',
    'เข้าร่วมชุมชนออนไลน์เพื่อแลกเปลี่ยนความรู้',
    'หาคอร์สออนไลน์ที่เหมาะสมกับระดับของคุณ'
  ];

  res.json({
    success: true,
    score,
    level: currentLevel,
    topic: assessmentTopic,
    recommendations,
    timestamp: new Date().toISOString()
  });
});

// YouTube Search API
app.post('/api/youtube/search', (req, res) => {
  const { query, maxResults = 5 } = req.body;
  
  // Mock YouTube results
  const videos = Array.from({ length: Math.min(maxResults, 5) }, (_, i) => ({
    title: `${query} - บทเรียนที่ ${i + 1}`,
    url: `https://youtube.com/watch?v=sample${i + 1}`,
    thumbnail: `https://via.placeholder.com/180x101?text=Video+${i + 1}`,
    channelTitle: 'Education Channel',
    publishedAt: new Date().toISOString(),
    description: `เรียนรู้เกี่ยวกับ ${query} ในบทเรียนนี้`
  }));

  res.json({
    success: true,
    videos,
    total: videos.length,
    query
  });
});

// Job Market Analysis API
app.post('/api/analyze-job-market', (req, res) => {
  const { country, industry } = req.body;
  
  const jobData = [
    {
      position: 'Software Developer',
      salary: '40K-80K บาท',
      demand: 'high',
      demandText: 'สูง'
    },
    {
      position: 'Data Scientist',
      salary: '50K-100K บาท', 
      demand: 'high',
      demandText: 'สูง'
    },
    {
      position: 'UX/UI Designer',
      salary: '35K-70K บาท',
      demand: 'medium', 
      demandText: 'ปานกลาง'
    },
    {
      position: 'Project Manager',
      salary: '45K-90K บาท',
      demand: 'medium',
      demandText: 'ปานกลาง'
    }
  ];

  res.json({
    success: true,
    data: jobData,
    country,
    industry,
    timestamp: new Date().toISOString()
  });
});

// 404 Error Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'ไม่พบหน้าที่ต้องการ',
    path: req.path
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(500).json({
    success: false,
    error: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์'
  });
});

// Start Server
app.listen(PORT, () => {
  console.log('='.repeat(50));
  console.log('🚀 E-Learning Server Started Successfully!');
  console.log('='.repeat(50));
  console.log(`📱 เปิดเบราว์เซอร์ไปที่: http://localhost:${PORT}`);
  console.log(`🔧 API Endpoint: http://localhost:${PORT}/api/test`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log('='.repeat(50));
});

module.exports = app;

const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="th">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>E-Learning Platform</title>
        <style>
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                min-height: 100vh;
                margin: 0;
                display: flex;
                justify-content: center;
                align-items: center;
                color: white;
            }
            .container {
                text-align: center;
                background: rgba(255, 255, 255, 0.1);
                padding: 40px;
                border-radius: 20px;
                backdrop-filter: blur(10px);
            }
            .status {
                color: #4CAF50;
                font-size: 1.2em;
                margin: 20px 0;
            }
            button {
                background: #4CAF50;
                color: white;
                border: none;
                padding: 12px 24px;
                border-radius: 8px;
                cursor: pointer;
                font-size: 16px;
                margin: 10px;
            }
            button:hover {
                background: #45a049;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>🎓 E-Learning Platform</h1>
            <p>ระบบการเรียนรู้อัจฉริยะพร้อม AI Quiz Generator</p>
            
            <div class="status">
                ✅ เซิร์ฟเวอร์ทำงานปกติ
            </div>
            
            <button onclick="testAPI()">ทดสอบ API</button>
            <div id="result" style="margin-top: 20px;"></div>
        </div>

        <script>
            async function testAPI() {
                const resultDiv = document.getElementById('result');
                resultDiv.innerHTML = 'กำลังทดสอบ...';
                
                try {
                    const response = await fetch('/api/test');
                    const data = await response.json();
                    
                    resultDiv.innerHTML = data.success 
                        ? '<div style="color: #4CAF50;">✅ API ทำงานปกติ</div>'
                        : '<div style="color: #f44336;">❌ API มีปัญหา</div>';
                } catch (error) {
                    resultDiv.innerHTML = '<div style="color: #f44336;">❌ ไม่สามารถเชื่อมต่อ API</div>';
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
    message: 'E-Learning API is working!',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// API endpoints
app.post('/api/assess-knowledge', (req, res) => {
  const { userName, fieldOfInterest, assessmentTopic, currentLevel } = req.body;
  
  const score = Math.floor(Math.random() * 40) + 60;
  const recommendations = [
    `เริ่มต้นศึกษา ${assessmentTopic} ในระดับ${currentLevel}`,
    'ฝึกทำโปรเจคเพื่อเสริมสร้างประสบการณ์',
    'เข้าร่วมชุมชนออนไลน์เพื่อแลกเปลี่ยนความรู้'
  ];

  res.json({
    success: true,
    score,
    level: currentLevel,
    topic: assessmentTopic,
    recommendations
  });
});

app.post('/api/youtube/search', (req, res) => {
  const { query, maxResults = 10 } = req.body;
  
  const videos = Array.from({ length: Math.min(maxResults, 5) }, (_, i) => ({
    title: `${query} Tutorial ${i + 1}`,
    url: `https://youtube.com/watch?v=sample${i + 1}`,
    thumbnail: `https://via.placeholder.com/180x101?text=Video+${i + 1}`,
    channelTitle: 'Education Channel',
    publishedAt: new Date().toISOString()
  }));

  res.json({
    success: true,
    videos,
    total: videos.length,
    query
  });
});

app.post('/api/analyze-job-market', (req, res) => {
  const { country, industry } = req.body;
  
  const jobs = [
    {
      position: 'Software Developer',
      salary: '40K-80K',
      demand: 'high',
      demandText: 'สูง'
    },
    {
      position: 'Data Scientist', 
      salary: '50K-100K',
      demand: 'high',
      demandText: 'สูง'
    }
  ];

  res.json({
    success: true,
    data: jobs,
    country,
    industry
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found'
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    error: 'Something went wrong!'
  });
});

app.listen(PORT, () => {
  console.log(`🚀 E-Learning App running on port ${PORT}`);
  console.log(`📱 Open http://localhost:${PORT} in your browser`);
  console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;

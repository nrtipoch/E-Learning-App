const express = require('express');
const app = express();

// Middleware
app.use(express.json());

// หน้าหลัก
app.get('/', (req, res) => {
  res.send(`
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
                margin: 0;
            }
            .container {
                background: rgba(255,255,255,0.1);
                padding: 40px;
                border-radius: 20px;
                display: inline-block;
            }
            .status { color: #4CAF50; margin: 20px 0; font-size: 1.2em; }
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
            button:hover { background: #45a049; }
            #result { margin-top: 20px; font-size: 1.1em; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>🎓 E-Learning Platform</h1>
            <div class="status">✅ เซิร์ฟเวอร์ทำงานปกติแล้ว!</div>
            <button onclick="testAPI()">ทดสอบ API</button>
            <div id="result"></div>
        </div>
        
        <script>
            async function testAPI() {
                const result = document.getElementById('result');
                result.innerHTML = 'กำลังทดสอบ...';
                
                try {
                    const response = await fetch('/api/test');
                    const data = await response.json();
                    
                    if (data.success) {
                        result.innerHTML = \`
                            <div style="color: #4CAF50;">
                                ✅ API ทำงานปกติ!<br>
                                ข้อความ: \${data.message}<br>
                                เวลา: \${new Date(data.timestamp).toLocaleString('th-TH')}
                            </div>
                        \`;
                    } else {
                        result.innerHTML = '<div style="color: #f44336;">❌ API มีปัญหา</div>';
                    }
                } catch (error) {
                    result.innerHTML = \`<div style="color: #f44336;">❌ ไม่สามารถเชื่อมต่อ API: \${error.message}</div>\`;
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
    message: 'E-Learning API ทำงานได้สมบูรณ์แล้ว!',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Knowledge Assessment API
app.post('/api/assess-knowledge', (req, res) => {
  const { userName, fieldOfInterest, assessmentTopic, currentLevel } = req.body;
  
  const score = Math.floor(Math.random() * 40) + 60;
  const recommendations = [
    `เริ่มต้นศึกษา ${assessmentTopic} ในระดับ ${currentLevel}`,
    'ฝึกทำโปรเจคเพื่อเสริมสร้างประสบการณ์',
    'เข้าร่วมชุมชนออนไลน์เพื่อแลกเปลี่ยนความรู้'
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
  
  const videos = Array.from({ length: Math.min(maxResults, 5) }, (_, i) => ({
    title: `${query} - บทเรียนที่ ${i + 1}`,
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

// Job Market Analysis API
app.post('/api/analyze-job-market', (req, res) => {
  const { country, industry } = req.body;
  
  const jobs = [
    { position: 'Software Developer', salary: '40K-80K', demand: 'high', demandText: 'สูง' },
    { position: 'Data Scientist', salary: '50K-100K', demand: 'high', demandText: 'สูง' },
    { position: 'UX Designer', salary: '35K-70K', demand: 'medium', demandText: 'ปานกลาง' }
  ];

  res.json({
    success: true,
    data: jobs,
    country,
    industry,
    timestamp: new Date().toISOString()
  });
});

app.listen(3000, () => {
  console.log('🚀 Server running on http://localhost:3000');
  console.log('🔧 API Test: http://localhost:3000/api/test');
});

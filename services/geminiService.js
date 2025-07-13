const axios = require('axios');

class GeminiService {
  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY;
    this.apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent';
  }

  async generateQuiz(subjectData) {
    if (!this.apiKey) {
      throw new Error('Gemini API key not configured');
    }

    try {
      const prompt = this.createPrompt(subjectData);
      
      const payload = {
        contents: [{
          parts: [{
            text: prompt
          }]
        }]
      };

      const response = await axios.post(this.apiUrl, payload, {
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': this.apiKey
        }
      });

      if (response.data.candidates && response.data.candidates[0] && response.data.candidates[0].content) {
        const generatedText = response.data.candidates[0].content.parts[0].text;
        const quiz = this.parseQuizFromText(generatedText);
        
        return {
          success: true,
          quiz: quiz
        };
      } else {
        throw new Error('Invalid response from Gemini API');
      }
    } catch (error) {
      console.error('Gemini API error:', error.response?.data || error.message);
      throw new Error('Failed to generate quiz: ' + error.message);
    }
  }

  createPrompt(subjectData) {
    return `
คุณเป็น AI ผู้ช่วยสร้างแบบทดสอบ กรุณาสร้างแบบทดสอบตามข้อมูลต่อไปนี้:

วิชา: ${subjectData.subjectName}
ระดับการศึกษา: ${subjectData.subjectLevel}
หัวข้อ: ${subjectData.topicDetails}
จำนวนข้อ: ${subjectData.questionCount}
ระดับความยาก: ${subjectData.difficulty}

กรุณาสร้างแบบทดสอบในรูปแบบ JSON ดังนี้:
{
  "title": "ชื่อแบบทดสอบ",
  "subject": "ชื่อวิชา",
  "level": "ระดับการศึกษา",
  "questions": [
    {
      "id": 1,
      "question": "คำถาม",
      "options": ["ตัวเลือก 1", "ตัวเลือก 2", "ตัวเลือก 3", "ตัวเลือก 4"],
      "correct": 0,
      "explanation": "คำอธิบายเฉลย"
    }
  ]
}

ข้อกำหนด:
1. สร้างคำถามที่มีคุณภาพและตรงกับหัวข้อ
2. ตัวเลือกต้องมี 4 ตัวเลือก
3. ตัวเลือกที่ถูกต้องระบุด้วยตัวเลข (0-3)
4. ใส่คำอธิบายเฉลยที่ชัดเจน
5. ตอบเป็น JSON เท่านั้น ไม่ต้องใส่ข้อความอื่น
`;
  }

  parseQuizFromText(text) {
    try {
      // Remove markdown code blocks if present
      const jsonText = text.replace(/```json\n?|\n?```/g, '').trim();
      
      const quiz = JSON.parse(jsonText);
      
      // Validate and add IDs if missing
      if (quiz.questions) {
        quiz.questions.forEach((question, index) => {
          if (!question.id) {
            question.id = index + 1;
          }
        });
      }
      
      return quiz;
    } catch (error) {
      console.error('Error parsing quiz JSON:', error);
      throw new Error('Failed to parse quiz data');
    }
  }

  async testConnection() {
    try {
      const testPrompt = "สวัสดี กรุณาตอบกลับว่า 'การเชื่อมต่อสำเร็จ' ในรูปแบบ JSON: {\"status\": \"การเชื่อมต่อสำเร็จ\"}";
      
      const payload = {
        contents: [{
          parts: [{
            text: testPrompt
          }]
        }]
      };

      const response = await axios.post(this.apiUrl, payload, {
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': this.apiKey
        }
      });

      if (response.data.candidates && response.data.candidates[0]) {
        return {
          success: true,
          message: 'Gemini API connection successful',
          response: response.data.candidates[0].content.parts[0].text
        };
      } else {
        return {
          success: false,
          error: 'No response from Gemini API'
        };
      }
    } catch (error) {
      console.error('Gemini connection test error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = new GeminiService();

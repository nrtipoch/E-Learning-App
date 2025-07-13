// Global variables
let currentQuiz = null;
let userAnswers = {};
let skillChart = null;

// API base URL
const API_BASE = window.location.origin + '/api';

// Initialize application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
    initChart();
});

function initializeApp() {
    console.log('🚀 E-Learning App initialized');
    
    // Test API connection
    testAPIConnection();
}

function setupEventListeners() {
    // Assessment form
    const assessmentForm = document.getElementById('assessmentForm');
    if (assessmentForm) {
        assessmentForm.addEventListener('submit', handleAssessmentSubmit);
    }

    // YouTube search form
    const youtubeForm = document.getElementById('youtubeSearchForm');
    if (youtubeForm) {
        youtubeForm.addEventListener('submit', handleYouTubeSearch);
    }

    // Quiz generation form
    const quizForm = document.getElementById('quizGenerationForm');
    if (quizForm) {
        quizForm.addEventListener('submit', handleQuizGeneration);
    }

    // Job market form
    const jobMarketForm = document.getElementById('jobMarketForm');
    if (jobMarketForm) {
        jobMarketForm.addEventListener('submit', handleJobMarketAnalysis);
    }
}

// API Helper Functions
async function apiCall(endpoint, method = 'GET', data = null) {
    try {
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json',
            }
        };

        if (data && (method === 'POST' || method === 'PUT')) {
            options.body = JSON.stringify(data);
        }

        const response = await fetch(API_BASE + endpoint, options);
        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || `HTTP error! status: ${response.status}`);
        }

        return result;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

async function testAPIConnection() {
    try {
        const result = await apiCall('/test');
        console.log('✅ API Connection successful:', result.message);
    } catch (error) {
        console.error('❌ API Connection failed:', error);
        showError('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้');
    }
}

// Assessment Functions
async function handleAssessmentSubmit(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const data = Object.fromEntries(formData.entries());
    
    try {
        showLoading(true);
        const result = await apiCall('/assess-knowledge', 'POST', data);
        displayAssessmentResult(result);
    } catch (error) {
        showError('เกิดข้อผิดพลาดในการประเมิน: ' + error.message);
    } finally {
        showLoading(false);
    }
}

function displayAssessmentResult(result) {
    const resultDiv = document.getElementById('assessmentResult');
    const progressBar = document.getElementById('knowledgeProgress');
    const scoreDiv = document.getElementById('knowledgeScore');
    const recommendationsDiv = document.getElementById('recommendations');
    
    resultDiv.style.display = 'block';
    
    progressBar.style.width = result.score + '%';
    scoreDiv.innerHTML = `<strong>คะแนน: ${result.score}/100</strong>`;
    
    if (result.recommendations) {
        recommendationsDiv.innerHTML = `
            <h5>คำแนะนำ:</h5>
            <ul>
                ${result.recommendations.map(rec => `<li>${rec}</li>`).join('')}
            </ul>
        `;
    }
}

// YouTube Search Functions
async function handleYouTubeSearch(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const query = formData.get('query');
    
    if (!query.trim()) {
        showError('กรุณาใส่คำค้นหา');
        return;
    }
    
    const resultsDiv = document.getElementById('youtubeResults');
    resultsDiv.innerHTML = '<div class="loading"><div class="loading-spinner"></div>กำลังค้นหา...</div>';
    
    try {
        const result = await apiCall('/youtube/search', 'POST', { 
            query: query.trim(),
            maxResults: 10 
        });
        
        displayYouTubeResults(result.videos, query);
    } catch (error) {
        resultsDiv.innerHTML = `<div class="error-message">เกิดข้อผิดพลาด: ${error.message}</div>`;
    }
}

function displayYouTubeResults(videos, query) {
    const resultsDiv = document.getElementById('youtubeResults');
    
    if (!videos || videos.length === 0) {
        resultsDiv.innerHTML = '<div class="no-results">ไม่พบวิดีโอที่ตรงกับคำค้นหา</div>';
        return;
    }
    
    let html = `<h4>📺 พบ ${videos.length} วิดีโอสำหรับ "${query}"</h4>`;
    
    videos.forEach(video => {
        const thumbnail = video.thumbnail?.high || video.thumbnail?.medium || video.thumbnail?.default || '/assets/no-image.png';
        
        html += `
            <div class="video-item">
                <img src="${thumbnail}" alt="${video.title}" onerror="this.src='/assets/no-image.png'">
                <div class="video-details">
                    <h4>${video.title}</h4>
                    <p style="color: #6c757d; font-size: 0.9em; margin: 5px 0;">
                        ${video.channelTitle || 'Unknown Channel'} • ${formatDate(video.publishedAt)}
                    </p>
                    <a href="${video.url}" target="_blank">ดูบน YouTube</a>
                </div>
            </div>
        `;
    });
    
    resultsDiv.innerHTML = html;
}

// Quiz Generation Functions
async function handleQuizGeneration(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const data = {
        subjectName: formData.get('subjectName'),
        subjectLevel: formData.get('subjectLevel'),
        topicDetails: formData.get('topicDetails'),
        questionCount: parseInt(formData.get('questionCount')),
        difficulty: formData.get('difficulty')
    };
    
    // Validate required fields
    if (!data.subjectName || !data.subjectLevel || !data.topicDetails) {
        showError('กรุณากรอกข้อมูลให้ครบถ้วน');
        return;
    }
    
    // Show loading
    document.getElementById('subjectForm').style.display = 'none';
    document.getElementById('loadingSection').style.display = 'block';
    
    try {
        const result = await apiCall('/quiz/generate', 'POST', data);
        
        if (result.success) {
            currentQuiz = result.quiz;
            sessionStorage.setItem('quizStartTime', new Date().getTime().toString());
            displayQuiz();
        } else {
            throw new Error(result.error || 'ไม่สามารถสร้างแบบทดสอบได้');
        }
    } catch (error) {
        console.error('Quiz generation error:', error);
        showError('เกิดข้อผิดพลาด: ' + error.message);
        
        // Return to form
        document.getElementById('loadingSection').style.display = 'none';
        document.getElementById('subjectForm').style.display = 'block';
    }
}

function displayQuiz() {
    document.getElementById('loadingSection').style.display = 'none';
    document.getElementById('quizSection').style.display = 'block';
    
    document.getElementById('quizTitle').textContent = currentQuiz.title || 'แบบทดสอบ';
    
    const quizContent = document.getElementById('quizContent');
    quizContent.innerHTML = '';
    
    currentQuiz.questions.forEach((question, index) => {
        const questionDiv = document.createElement('div');
        questionDiv.className = 'question';
        
        const questionHtml = `
            <h3>ข้อ ${index + 1}: ${question.question}</h3>
            <ul class="options">
                ${question.options.map((option, optIndex) => `
                    <li>
                        <label>
                            <input type="radio" name="question_${question.id}" value="${optIndex}">
                            ${String.fromCharCode(65 + optIndex)}. ${option}
                        </label>
                    </li>
                `).join('')}
            </ul>
        `;
        
        questionDiv.innerHTML = questionHtml;
        quizContent.appendChild(questionDiv);
    });
}

async function submitQuiz() {
    // Collect answers
    userAnswers = {};
    let answeredCount = 0;
    const startTime = sessionStorage.getItem('quizStartTime');
    const currentTime = new Date().getTime();
    const timeSpent = startTime ? Math.round((currentTime - parseInt(startTime)) / 1000) : 0;
    
    currentQuiz.questions.forEach(question => {
        const selectedOption = document.querySelector(`input[name="question_${question.id}"]:checked`);
        if (selectedOption) {
            userAnswers[question.id] = parseInt(selectedOption.value);
            answeredCount++;
        }
    });
    
    if (answeredCount !== currentQuiz.questions.length) {
        showError('กรุณาตอบคำถามให้ครบทุกข้อ');
        return;
    }
    
    // Calculate score
    let correctCount = 0;
    currentQuiz.questions.forEach(question => {
        if (userAnswers[question.id] === question.correct) {
            correctCount++;
        }
    });

    // Save result to server
    try {
        const resultData = {
            quizTitle: currentQuiz.title,
            totalQuestions: currentQuiz.questions.length,
            correctCount: correctCount,
            timeSpent: timeSpent,
            answers: userAnswers
        };

        await apiCall('/quiz/submit', 'POST', resultData);
        showSuccess('บันทึกผลการทดสอบเรียบร้อย');
    } catch (error) {
        console.error('Error saving result:', error);
        showError('ไม่สามารถบันทึกผลได้ แต่จะแสดงผลให้ดู');
    }
    
    // Display results
    displayResults(correctCount);
}

function displayResults(correctCount) {
    document.getElementById('quizSection').style.display = 'none';
    document.getElementById('resultSection').style.display = 'block';
    
    const totalQuestions = currentQuiz.questions.length;
    const percentage = Math.round((correctCount / totalQuestions) * 100);
    
    document.getElementById('scoreDisplay').textContent = `${correctCount}/${totalQuestions}`;
    document.getElementById('scoreText').textContent = `คะแนนของคุณ (${percentage}%)`;
    
    // Show detailed review
    const reviewDiv = document.getElementById('answerReview');
    reviewDiv.innerHTML = '<h3>🔍 เฉลยและคำอธิบาย</h3>';
    
    currentQuiz.questions.forEach((question, index) => {
        const userAnswer = userAnswers[question.id];
        const isCorrect = userAnswer === question.correct;
        
        const reviewItem = document.createElement('div');
        reviewItem.className = `answer-review ${isCorrect ? '' : 'incorrect'}`;
        
        reviewItem.innerHTML = `
            <h4>ข้อ ${index + 1}: ${question.question}</h4>
            <p><strong>คำตอบที่ถูกต้อง:</strong> ${String.fromCharCode(65 + question.correct)}. ${question.options[question.correct]}</p>
            <p><strong>คำตอบของคุณ:</strong> ${userAnswer !== undefined ? String.fromCharCode(65 + userAnswer) + '. ' + question.options[userAnswer] : 'ไม่ได้ตอบ'}</p>
            <p><strong>คำอธิบาย:</strong> ${question.explanation || 'ไม่มีคำอธิบาย'}</p>
            <div style="margin-top: 10px;">
                ${isCorrect ? '✅ <span style="color: #10b981;">ถูกต้อง</span>' : '❌ <span style="color: #ef4444;">ผิด</span>'}
            </div>
        `;
        
        reviewDiv.appendChild(reviewItem);
    });
}

function startOver() {
    document.getElementById('resultSection').style.display = 'none';
    document.getElementById('subjectForm').style.display = 'block';
    
    // Reset form
    const form = document.getElementById('quizGenerationForm');
    if (form) form.reset();
    
    currentQuiz = null;
    userAnswers = {};
    sessionStorage.removeItem('quizStartTime');
}

// Job Market Analysis Functions
async function handleJobMarketAnalysis(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const data = Object.fromEntries(formData.entries());
    
    const analysisDiv = document.getElementById('jobAnalysis');
    analysisDiv.innerHTML = '<div class="loading"><div class="loading-spinner"></div>กำลังวิเคราะห์ตลาดแรงงาน...</div>';
    
    try {
        const result = await apiCall('/analyze-job-market', 'POST', data);
        displayJobAnalysis(result, data.country, data.industry);
    } catch (error) {
        analysisDiv.innerHTML = `<div class="error-message">เกิดข้อผิดพลาด: ${error.message}</div>`;
    }
}

function displayJobAnalysis(result, country, industry) {
    const analysisDiv = document.getElementById('jobAnalysis');
    
    if (!result.success || !result.data) {
        analysisDiv.innerHTML = '<div class="error-message">ไม่สามารถวิเคราะห์ตลาดแรงงานได้</div>';
        return;
    }
    
    let html = `<h4>💼 ความต้องการแรงงานใน${getCountryName(country)} - ${getIndustryName(industry)}</h4>`;
    
    result.data.forEach(job => {
        html += `
            <div class="job-demand demand-${job.demand}">
                <div>
                    <strong>${job.position}</strong><br>
                    <small>เงินเดือนเฉลี่ย: ${job.salary}</small>
                </div>
                <div>
                    <span class="demand-level">${job.demandText}</span>
                </div>
            </div>
        `;
    });
    
    analysisDiv.innerHTML = html;
}

// Chart Initialization
function initChart() {
    const ctx = document.getElementById('skillChart');
    if (!ctx) return;
    
    const chartCtx = ctx.getContext('2d');
    
    const currentUser = {
        skills: {
            'Engineering': 85,
            'Design': 70,
            'Science': 60,
            'Marketing': 45,
            'Agriculture': 35
        }
    };
    
    skillChart = new Chart(chartCtx, {
        type: 'radar',
        data: {
            labels: Object.keys(currentUser.skills),
            datasets: [{
                label: 'ระดับทักษะปัจจุบัน',
                data: Object.values(currentUser.skills),
                backgroundColor: 'rgba(102, 126, 234, 0.2)',
                borderColor: 'rgba(102, 126, 234, 1)',
                borderWidth: 2,
                pointRadius: 5,
                pointHoverRadius: 7
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                r: {
                    beginAtZero: true,
                    max: 100,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)'
                    },
                    pointLabels: {
                        color: '#333',
                        font: {
                            size: 11
                        }
                    },
                    ticks: {
                        display: false
                    }
                }
            },
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: '#333',
                        font: {
                            size: 12
                        }
                    }
                }
            }
        }
    });
}

// Statistics Functions
async function showStatistics() {
    try {
        const result = await apiCall('/quiz/statistics');
        
        if (result.success) {
            const stats = result.statistics;
            const statsHtml = `
                <div class="section">
                    <h2>📊 สถิติการทำแบบทดสอบ</h2>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 20px 0;">
                        <div style="background: #e0f2fe; padding: 20px; border-radius: 10px;">
                            <h3>จำนวนครั้งทั้งหมด</h3>
                            <p style="font-size: 2em; font-weight: bold; color: #0277bd;">${stats.totalQuizzes}</p>
                        </div>
                        <div style="background: #e8f5e8; padding: 20px; border-radius: 10px;">
                            <h3>คะแนนเฉลี่ย</h3>
                            <p style="font-size: 2em; font-weight: bold; color: #2e7d32;">${stats.averageScore}%</p>
                        </div>
                        <div style="background: #fff3e0; padding: 20px; border-radius: 10px;">
                            <h3>คะแนนสูงสุด</h3>
                            <p style="font-size: 2em; font-weight: bold; color: #f57c00;">${stats.highestScore || 0}%</p>
                        </div>
                    </div>
                    <button class="btn" onclick="closeStatistics()">ปิด</button>
                </div>
            `;
            
            document.getElementById('subjectForm').innerHTML = statsHtml;
        } else {
            showError('ไม่สามารถโหลดสถิติได้: ' + result.error);
        }
    } catch (error) {
        showError('เกิดข้อผิดพลาด: ' + error.message);
    }
}

function closeStatistics() {
    location.reload();
}

// Test Gemini Connection
async function testGeminiConnection() {
    try {
        showLoading(true);
        const result = await apiCall('/quiz/test-connection');
        
        if (result.success) {
            showSuccess('การเชื่อมต่อ Gemini API สำเร็จ');
        } else {
            showError('การเชื่อมต่อ Gemini API ล้มเหลว: ' + result.error);
        }
    } catch (error) {
        showError('เกิดข้อผิดพลาด: ' + error.message);
    } finally {
        showLoading(false);
    }
}

// Utility Functions
function showLoading(show) {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.style.display = show ? 'flex' : 'none';
    }
}

function showError(message) {
    // Create error notification
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    errorDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 10000;
        max-width: 400px;
        animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(errorDiv);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (errorDiv.parentNode) {
            errorDiv.remove();
        }
    }, 5000);
}

function showSuccess(message) {
    // Create success notification
    const successDiv = document.createElement('div');
    successDiv.className = 'success-message';
    successDiv.textContent = message;
    successDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 10000;
        max-width: 400px;
        animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(successDiv);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        if (successDiv.parentNode) {
            successDiv.remove();
        }
    }, 3000);
}

function formatDate(dateString) {
    if (!dateString) return 'ไม่ทราบวันที่';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'เมื่อวาน';
    if (diffDays < 7) return `${diffDays} วันที่แล้ว`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} สัปดาห์ที่แล้ว`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} เดือนที่แล้ว`;
    
    return `${Math.floor(diffDays / 365)} ปีที่แล้ว`;
}

function getCountryName(country) {
    const names = {
        'Thailand': 'ไทย',
        'Singapore': 'สิงคโปร์',
        'Japan': 'ญี่ปุ่น',
        'United States': 'สหรัฐอเมริกา',
        'Germany': 'เยอรมนี',
        'United Kingdom': 'สหราชอาณาจักร',
        'Australia': 'ออสเตรเลีย',
        'Canada': 'แคนาดา',
        'South Korea': 'เกาหลีใต้',
        'China': 'จีน'
    };
    return names[country] || country;
}

function getIndustryName(industry) {
    const names = {
        'technology': 'เทคโนโลยี',
        'finance': 'การเงิน',
        'healthcare': 'สาธารณสุข',
        'manufacturing': 'การผลิต',
        'Biochemistry': 'ชีวเคมี',
        'Physics': 'ฟิสิกส์',
        'Engineering': 'วิศวกรรมศาสตร์',
        'Computer Science': 'วิทยาการคอมพิวเตอร์',
        'Medical Sciences': 'วิทยาศาสตร์การแพทย์'
    };
    return names[industry] || industry;
}

// Add slide-in animation
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
`;
document.head.appendChild(style);

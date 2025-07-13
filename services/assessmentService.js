class AssessmentService {
  async assessUserKnowledge(data) {
    const { userName, fieldOfInterest, assessmentTopic, currentLevel, work } = data;
    
    // Simulate AI assessment
    let baseScore = Math.floor(Math.random() * 30) + 50; // 50-80 range
    
    // Adjust based on level
    if (currentLevel === 'advanced') baseScore += 15;
    if (currentLevel === 'beginner') baseScore -= 15;
    
    // Ensure score is within bounds
    const score = Math.max(20, Math.min(95, baseScore));
    
    // Generate recommendations
    const recommendations = this.generateRecommendations(assessmentTopic, score, currentLevel);
    
    return {
      success: true,
      score,
      level: currentLevel,
      topic: assessmentTopic,
      recommendations,
      timestamp: new Date().toISOString()
    };
  }

  generateRecommendations(topic, score, level) {
    const recommendations = [];
    
    if (score < 60) {
      recommendations.push(`เริ่มต้นด้วยพื้นฐาน ${topic} จากคอร์สออนไลน์`);
      recommendations.push('ฝึกทำโปรเจคเล็กๆ เพื่อเสริมสร้างความเข้าใจ');
      recommendations.push('หาแหล่งเรียนรู้เพิ่มเติมจากหนังสือและบทความ');
    } else if (score < 80) {
      recommendations.push(`ศึกษา ${topic} ในระดับกลางเพิ่มเติม`);
      recommendations.push('เข้าร่วมชุมชนออนไลน์เพื่อแลกเปลี่ยนประสบการณ์');
      recommendations.push('ลองทำโปรเจคที่ซับซ้อนขึ้น');
    } else {
      recommendations.push(`พิจารณาสอน ${topic} ให้ผู้อื่น`);
      recommendations.push('ศึกษาเทคโนโลยีใหม่ๆ ในสาขานี้');
      recommendations.push('เข้าร่วมการประชุมหรือสัมมนาระดับสูง');
    }
    
    return recommendations;
  }

  async analyzeJobMarket(data) {
    const { country, industry } = data;
    
    // Mock job market data
    const jobData = this.generateJobMarketData(country, industry);
    
    return {
      success: true,
      data: jobData,
      country,
      industry,
      timestamp: new Date().toISOString()
    };
  }

  generateJobMarketData(country, industry) {
    const positions = {
      technology: ['Software Developer', 'Data Scientist', 'DevOps Engineer', 'UX Designer', 'AI Engineer'],
      finance: ['Financial Analyst', 'Risk Manager', 'Investment Banker', 'Fintech Developer'],
      healthcare: ['Health Data Analyst', 'Medical Software Developer', 'Telemedicine Specialist'],
      manufacturing: ['Process Engineer', 'Quality Assurance', 'Automation Specialist'],
      Engineering: ['Mechanical Engineer', 'Civil Engineer', 'Electrical Engineer', 'Chemical Engineer'],
      'Computer Science': ['Full Stack Developer', 'Machine Learning Engineer', 'Cybersecurity Specialist'],
      Physics: ['Research Scientist', 'Data Analyst', 'Optical Engineer'],
      Biochemistry: ['Biochemist', 'Research Associate', 'Quality Control Analyst']
    };

    const jobs = positions[industry] || positions.technology;
    const demandLevels = ['high', 'medium', 'low'];
    const demandTexts = ['สูง', 'ปานกลาง', 'ต่ำ'];
    
    return jobs.slice(0, 5).map(job => {
      const demandIndex = Math.floor(Math.random() * 3);
      const baseSalary = Math.floor(Math.random() * 50 + 30);
      const maxSalary = baseSalary + Math.floor(Math.random() * 50 + 20);
      
      return {
        position: job,
        salary: `${baseSalary}K-${maxSalary}K`,
        demand: demandLevels[demandIndex],
        demandText: demandTexts[demandIndex]
      };
    });
  }
}

module.exports = new AssessmentService();

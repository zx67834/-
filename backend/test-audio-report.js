const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');

const API_BASE = 'http://localhost:7007';

// 测试音频分析
async function testAudioAnalysis() {
  console.log('=== 测试音频分析 ===');
  try {
    // 创建一个简单的音频文件（使用 favicon 作为测试文件）
    const audioPath = path.join(__dirname, '../frontend', 'public', 'favicon.ico');
    
    if (!fs.existsSync(audioPath)) {
      console.error('测试文件不存在');
      return;
    }
    
    const formData = new FormData();
    formData.append('audio', fs.createReadStream(audioPath));
    
    const response = await axios.post(`${API_BASE}/api/analyze/audio`, formData, {
      headers: {
        ...formData.getHeaders()
      }
    });
    
    console.log('音频分析成功:', response.data);
  } catch (error) {
    console.error('音频分析失败:', error.response?.data || error.message);
  }
}

// 测试报告生成
async function testReportGeneration() {
  console.log('\n=== 测试报告生成 ===');
  try {
    const response = await axios.post(`${API_BASE}/api/reports`, {
      title: '测试报告',
      severity: 'medium',
      risks: ['测试风险1', '测试风险2'],
      actions: ['测试建议1', '测试建议2'],
      summary: '测试报告摘要',
      modality: 'text',
      content: '测试报告内容',
      authorEmail: 'test@example.com',
      authorName: '测试用户',
      authorRole: '用户'
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('报告生成成功:', response.data);
  } catch (error) {
    console.error('报告生成失败:', error.response?.data || error.message);
  }
}

// 测试获取报告列表
async function testGetReports() {
  console.log('\n=== 测试获取报告列表 ===');
  try {
    const response = await axios.get(`${API_BASE}/api/reports`, {
      params: {
        viewerEmail: 'test@example.com',
        viewerType: 'user'
      }
    });
    
    console.log('获取报告列表成功:', response.data);
  } catch (error) {
    console.error('获取报告列表失败:', error.response?.data || error.message);
  }
}

// 运行测试
async function runTests() {
  await testAudioAnalysis();
  await testReportGeneration();
  await testGetReports();
}

runTests();
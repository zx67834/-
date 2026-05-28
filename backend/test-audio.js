const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');

const API_BASE = 'http://localhost:7007';

// 创建一个简单的测试音频文件
function createTestAudioFile() {
  const audioPath = path.join(__dirname, 'test-audio.mp3');
  
  // 创建一个简单的MP3文件头
  const buffer = Buffer.alloc(10);
  buffer.write('ID3', 0); // ID3 tag
  buffer.writeUInt8(3, 3); // Version 2.3
  buffer.writeUInt8(0, 4); // Revision
  buffer.writeUInt8(0, 5); // Flags
  buffer.writeUInt32BE(0, 6); // Size
  
  fs.writeFileSync(audioPath, buffer);
  return audioPath;
}

// 测试音频分析
async function testAudioAnalysis() {
  console.log('=== 测试音频分析 ===');
  try {
    // 创建测试音频文件
    const audioPath = createTestAudioFile();
    console.log('创建测试音频文件:', audioPath);
    
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
    
    // 清理测试文件
    fs.unlinkSync(audioPath);
    console.log('清理测试文件成功');
  } catch (error) {
    console.error('音频分析失败:', error.response?.data || error.message);
  }
}

// 运行测试
testAudioAnalysis();
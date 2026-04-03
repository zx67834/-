const axios = require('axios');

// 测试健康检查端点
axios.get('http://localhost:7007/api/health')
  .then(response => {
    console.log('健康检查结果:', response.data);
  })
  .catch(error => {
    console.error('健康检查失败:', error.message);
  });

// 测试聊天 API 端点
axios.post('http://localhost:7007/api/chat', {
  message: '你好，这是一个测试'
}, {
  headers: {
    'Content-Type': 'application/json'
  }
})
  .then(response => {
    console.log('聊天 API 测试结果:', response.data);
  })
  .catch(error => {
    console.error('聊天 API 测试失败:', error.message);
  });
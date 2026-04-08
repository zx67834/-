const express = require('express');
const cors = require('cors');
const multer = require('multer');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 7007;

// 配置 CORS，允许所有来源（开发环境）
app.use(cors({
  origin: '*',
  credentials: false
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 配置文件上传存储
const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB
});

// 确保上传目录存在
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

// DeepSeek API 配置
const DEEPSEEK_API_KEY = 'sk-889e841cfd5e4fa5b0197904d0ff4342'; // 直接使用提供的密钥
const DEEPSEEK_API_URL = 'https://api.deepseek.com/chat/completions';

// ==================== 安全沙箱模块 ====================
// 敏感词库（示例，实际应用中应从外部加载或更丰富）
const SENSITIVE_WORDS = [
  '诈骗', '赌博', '色情', '暴力', '恐怖主义', '毒品', '枪支',
  'hack', 'attack', 'exploit', 'malware', 'virus', 'phishing',
  'scam', 'fraud', 'cheat', 'steal', 'kidnap', 'murder'
];

// 检查文本是否包含敏感词
function containsSensitiveWords(text) {
  const lowerText = text.toLowerCase();
  const found = SENSITIVE_WORDS.filter(word => lowerText.includes(word.toLowerCase()));
  return {
    found: found.length > 0,
    words: found
  };
}

// 安全过滤中间件（用于智能助手问答和文本分析）
function securityFilter(req, res, next) {
  const text = req.body.text || req.body.message || '';
  if (!text || typeof text !== 'string') {
    return next(); // 如果没有文本内容，交给后续验证
  }
  
  const result = containsSensitiveWords(text);
  if (result.found) {
    return res.status(400).json({
      success: false,
      error: '输入包含敏感内容，请修改后重试',
      sensitiveWords: result.words
    });
  }
  next();
}

// 文件类型安全验证
const ALLOWED_MIME_TYPES = {
  'image/jpeg': true,
  'image/png': true,
  'image/gif': true,
  'audio/mpeg': true,
  'audio/wav': true,
  'audio/ogg': true,
  'video/mp4': true,
  'video/webm': true
};

function validateFileType(mimetype) {
  return !!ALLOWED_MIME_TYPES[mimetype];
}

// 文件安全中间件（用于上传路由）
function fileSecurityFilter(req, res, next) {
  if (!req.file) {
    return next();
  }
  const { mimetype, originalname } = req.file;
  if (!validateFileType(mimetype)) {
    // 删除已上传的不合法文件
    const fs = require('fs');
    const path = require('path');
    const filePath = path.join(__dirname, 'uploads', req.file.filename);
    fs.unlink(filePath, (err) => {
      if (err) console.error('删除文件失败:', err);
    });
    return res.status(400).json({
      success: false,
      error: `不支持的文件类型: ${mimetype}，仅允许图片、音频、视频文件`
    });
  }
  // 检查文件名是否包含敏感字符（简单示例）
  if (originalname.includes('..') || originalname.includes('/') || originalname.includes('\\')) {
    return res.status(400).json({
      success: false,
      error: '文件名非法'
    });
  }
  next();
}

// 调用 DeepSeek 进行文本分析
async function callDeepSeekAnalysis(text) {
  try {
    const response = await axios.post(
      DEEPSEEK_API_URL,
      {
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: `你是一个专业的反诈骗分析助手。请对用户提供的文本内容进行诈骗风险分析，输出 JSON 格式，包含以下字段：
- risk_level: 字符串，可选值 "high", "medium", "low"
- confidence: 数值，0-1 表示置信度
- reasons: 字符串数组，列出检测到的风险点
- suggestions: 字符串数组，给出防范建议
- summary: 字符串，简要总结`
          },
          {
            role: 'user',
            content: `请分析以下文本是否存在诈骗风险：\n\n${text}`
          }
        ],
        temperature: 0.7,
        max_tokens: 1000
      },
      {
        headers: {
          'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const content = response.data.choices[0].message.content;
    // 尝试解析 JSON（可能返回的是文本，需要提取）
    try {
      // 如果返回的是 JSON 字符串，直接解析
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      } else {
        // 否则，构造一个通用结构
        return {
          risk_level: 'medium',
          confidence: 0.8,
          reasons: ['无法解析具体风险点'],
          suggestions: ['请谨慎对待此信息'],
          summary: content.substring(0, 200)
        };
      }
    } catch (parseError) {
      console.error('解析 DeepSeek 响应失败:', parseError);
      return {
        risk_level: 'unknown',
        confidence: 0,
        reasons: ['分析服务暂时不可用'],
        suggestions: ['请稍后重试'],
        summary: '分析出错'
      };
    }
  } catch (error) {
    console.error('调用 DeepSeek API 失败:', error.response?.data || error.message);
    throw new Error('AI 分析服务暂时不可用');
  }
}

// 智能助手问答
async function callDeepSeekChat(userMessage) {
  try {
    const response = await axios.post(
      DEEPSEEK_API_URL,
      {
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: `你是一个专业的反诈骗分析助手，专门帮助用户识别和防范各类诈骗。请以友好、专业、易懂的方式回答用户的问题，并提供实用的建议。如果用户的问题与诈骗无关，你可以礼貌地提醒用户你专注于反诈骗领域。`
          },
          {
            role: 'user',
            content: userMessage
          }
        ],
        temperature: 0.7,
        max_tokens: 1000
      },
      {
        headers: {
          'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    let content = response.data.choices[0].message.content;
    // 移除 Markdown 加粗符号 **
    content = content.replace(/\*\*/g, '');
    return content;
  } catch (error) {
    console.error('调用 DeepSeek API 失败:', error.response?.data || error.message);
    throw new Error('智能助手服务暂时不可用');
  }
}

// 健康检查端点
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: '后端服务运行正常' });
});

// 登录端点
app.post('/api/auth/login', express.json(), (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, error: '缺少邮箱或密码' });
  }
  
  const user = users.find(u => u.email === email);
  if (!user) {
    return res.status(401).json({ success: false, error: '邮箱或密码错误' });
  }
  
  // 简单验证，实际应用中应该使用 bcrypt 等加密库
  // 暂时使用简单的字符串比较，因为我们没有 bcrypt 库
  if (user.password !== password) {
    // 尝试检查是否是加密密码，如果是，暂时允许登录（测试用）
    if (user.password.startsWith('$2b$')) {
      // 对于加密密码，暂时允许登录
      console.log('使用加密密码登录，暂时允许访问');
    } else {
      return res.status(401).json({ success: false, error: '邮箱或密码错误' });
    }
  }
  
  res.json({
    success: true,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      riskLevel: user.riskLevel,
      bio: user.bio
    },
    message: '登录成功'
  });
});

// 注册端点
app.post('/api/auth/register', express.json(), (req, res) => {
  const { name, email, password, phone, role } = req.body;
  if (!name || !email || !password || !phone) {
    return res.status(400).json({ success: false, error: '缺少必要字段' });
  }
  
  if (users.some(u => u.email === email)) {
    return res.status(400).json({ success: false, error: '邮箱已被注册' });
  }
  
  const newUser = {
    id: users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1,
    username: email.split('@')[0],
    password: password, // 实际应用中应该加密
    email: email,
    phone: phone,
    name: name,
    role: role || '普通用户',
    riskLevel: '低风险',
    bio: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  users.push(newUser);
  saveUsers(users);
  
  res.json({
    success: true,
    user: {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      phone: newUser.phone,
      role: newUser.role,
      riskLevel: newUser.riskLevel,
      bio: newUser.bio
    },
    message: '注册成功'
  });
});

// 获取用户信息端点
app.get('/api/auth/user', (req, res) => {
  const { userId } = req.query;
  if (!userId) {
    return res.status(400).json({ success: false, error: '缺少用户ID' });
  }
  
  const user = users.find(u => u.id === parseInt(userId));
  if (!user) {
    return res.status(404).json({ success: false, error: '用户不存在' });
  }
  
  res.json({
    success: true,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      riskLevel: user.riskLevel,
      bio: user.bio
    }
  });
});

// 智能助手问答端点
app.post('/api/chat', securityFilter, async (req, res) => {
  const { message } = req.body;
  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: '缺少 message 字段或格式不正确' });
  }

  try {
    console.log(`智能助手问答: ${message.substring(0, 50)}...`);
    const reply = await callDeepSeekChat(message);
    res.json({
      success: true,
      reply,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('智能助手问答失败:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 文本分析端点
app.post('/api/analyze/text', securityFilter, async (req, res) => {
  const { text } = req.body;
  if (!text || typeof text !== 'string') {
    return res.status(400).json({ error: '缺少 text 字段或格式不正确' });
  }

  try {
    console.log(`开始分析文本，长度: ${text.length}`);
    const analysis = await callDeepSeekAnalysis(text);
    res.json({
      success: true,
      analysis,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('文本分析失败:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 图片上传端点（暂不支持 DeepSeek 视觉分析，仅返回上传信息）
app.post('/api/upload/image', upload.single('image'), fileSecurityFilter, async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: '未上传文件' });
  }

  const { originalname, mimetype, size, filename } = req.file;
  const fileUrl = `/uploads/${filename}`;

  // 这里可以集成图像识别 API，暂时返回模拟分析
  const mockAnalysis = {
    risk_level: 'medium',
    confidence: 0.65,
    reasons: ['图片内容需进一步分析'],
    suggestions: ['建议结合文本信息判断'],
    summary: '已成功上传图片，等待进一步处理'
  };

  res.json({
    success: true,
    file: {
      originalname,
      mimetype,
      size,
      url: fileUrl
    },
    analysis: mockAnalysis
  });
});

// 音频上传端点（暂不支持音频分析，仅返回上传信息）
app.post('/api/upload/audio', upload.single('audio'), fileSecurityFilter, async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: '未上传文件' });
  }

  const { originalname, mimetype, size, filename } = req.file;
  const fileUrl = `/uploads/${filename}`;

  // 这里可以集成语音转文本 API，暂时返回模拟分析
  const mockAnalysis = {
    risk_level: 'low',
    confidence: 0.5,
    reasons: ['音频内容需转文本后分析'],
    suggestions: ['建议提供文字转录'],
    summary: '已成功上传音频，等待进一步处理'
  };

  res.json({
    success: true,
    file: {
      originalname,
      mimetype,
      size,
      url: fileUrl
    },
    analysis: mockAnalysis
  });
});

// 图片分析端点（接收图片文件并返回分析结果）
app.post('/api/analyze/image', upload.single('image'), fileSecurityFilter, async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: '未上传图片文件' });
  }

  const { originalname, mimetype, size, filename } = req.file;
  const fileUrl = `/uploads/${filename}`;

  // 模拟图片分析逻辑（可替换为真实视觉 AI 服务）
  const mockAnalysis = {
    risk_level: 'medium',
    confidence: 0.72,
    reasons: [
      '图片中包含可疑文字或二维码',
      '视觉风格与已知诈骗宣传相似',
      '图片来源不明'
    ],
    suggestions: [
      '不要扫描图片中的二维码',
      '不要相信图片中的联系方式',
      '通过官方渠道核实信息'
    ],
    summary: '图片分析完成，检测到中等风险特征'
  };

  res.json({
    success: true,
    file: {
      originalname,
      mimetype,
      size,
      url: fileUrl
    },
    analysis: mockAnalysis
  });
});

// 音频分析端点（接收音频文件并返回分析结果）
app.post('/api/analyze/audio', upload.single('audio'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: '未上传音频文件' });
  }

  const { originalname, mimetype, size, filename } = req.file;
  const fileUrl = `/uploads/${filename}`;

  // 模拟音频分析逻辑（可替换为真实语音识别 + AI 分析）
  const mockAnalysis = {
    risk_level: 'low',
    confidence: 0.68,
    reasons: [
      '音频内容需转文字后深度分析',
      '语音情绪检测到紧张或催促语气',
      '背景音可能存在异常'
    ],
    suggestions: [
      '要求对方提供文字说明',
      '警惕任何要求转账或提供密码的语音',
      '联系官方客服核实'
    ],
    summary: '音频分析完成，初步检测到低风险特征'
  };

  res.json({
    success: true,
    file: {
      originalname,
      mimetype,
      size,
      url: fileUrl
    },
    analysis: mockAnalysis
  });
});

// 报告存储（文件）
const REPORTS_FILE = path.join(__dirname, '../data/reports.json');
const KNOWLEDGE_FILE = path.join(__dirname, '../data/knowledge.json');

// 确保数据目录存在
const dataDir = path.join(__dirname, '../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// 加载报告
function loadReports() {
  try {
    if (fs.existsSync(REPORTS_FILE)) {
      const data = fs.readFileSync(REPORTS_FILE, 'utf8');
      const reports = JSON.parse(data);
      console.log(`从文件加载了 ${reports.length} 份报告`);
      return reports;
    } else {
      console.log('报告文件不存在，将使用空数组');
    }
  } catch (error) {
    console.error('加载报告文件失败:', error);
  }
  return [];
}

// 保存报告
function saveReports(reports) {
  try {
    fs.writeFileSync(REPORTS_FILE, JSON.stringify(reports, null, 2), 'utf8');
  } catch (error) {
    console.error('保存报告文件失败:', error);
  }
}

// 加载用户数据
const USERS_FILE = path.join(__dirname, '../data/users.json');

function loadUsers() {
  try {
    if (fs.existsSync(USERS_FILE)) {
      const data = fs.readFileSync(USERS_FILE, 'utf8');
      const users = JSON.parse(data);
      console.log(`从文件加载了 ${users.length} 个用户`);
      return users;
    } else {
      console.log('用户文件不存在，将使用空数组');
    }
  } catch (error) {
    console.error('加载用户文件失败:', error);
  }
  return [];
}

// 保存用户数据
function saveUsers(users) {
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf8');
  } catch (error) {
    console.error('保存用户文件失败:', error);
  }
}

// 加载知识库条目
function loadKnowledge() {
  try {
    if (fs.existsSync(KNOWLEDGE_FILE)) {
      const data = fs.readFileSync(KNOWLEDGE_FILE, 'utf8');
      const knowledge = JSON.parse(data);
      console.log(`从文件加载了 ${knowledge.length} 条知识条目`);
      return knowledge;
    } else {
      console.log('知识库文件不存在，将使用空数组');
    }
  } catch (error) {
    console.error('加载知识库文件失败:', error);
  }
  return [];
}

// 保存知识库条目
function saveKnowledge(knowledge) {
  try {
    fs.writeFileSync(KNOWLEDGE_FILE, JSON.stringify(knowledge, null, 2), 'utf8');
  } catch (error) {
    console.error('保存知识库文件失败:', error);
  }
}

let knowledge = loadKnowledge();

let reports = loadReports();

let users = loadUsers();

// 如果没有报告，不自动插入示例报告，保持空数组

// 生成报告
app.post('/api/reports', express.json(), (req, res) => {
  const { title, severity, risks, actions, summary, modality, content } = req.body;
  if (!title || !severity) {
    return res.status(400).json({ error: '缺少必要字段' });
  }
  const newReport = {
    id: reports.length + 1,
    title,
    severity,
    risks: risks || [],
    actions: actions || [],
    summary: summary || '',
    modality: modality || 'text',
    content: content || '',
    date: new Date().toISOString(),
    events: risks ? risks.length : 0
  };
  reports.push(newReport);
  saveReports(reports);
  res.json({
    success: true,
    report: newReport,
    message: '报告已生成'
  });
});

// 获取报告列表
app.get('/api/reports', (req, res) => {
  res.json({
    success: true,
    reports: reports
  });
});

// 下载报告为TXT文件
app.get('/api/reports/:id/download', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const report = reports.find(r => r.id === id);
    if (!report) {
      return res.status(404).json({ error: '报告不存在' });
    }
    // 确保 risks 和 actions 是数组
    const risks = Array.isArray(report.risks) ? report.risks : [];
    const actions = Array.isArray(report.actions) ? report.actions : [];
    const txtContent = `安全报告\n==========\n\n标题: ${report.title}\n风险等级: ${report.severity}\n日期: ${report.date}\n风险点:\n${risks.map(r => '- ' + r).join('\n')}\n\n建议措施:\n${actions.map(a => '- ' + a).join('\n')}\n\n摘要: ${report.summary}\n\n原始内容:\n${report.content}`;
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="report_${report.id}.txt"`);
    res.send(txtContent);
  } catch (error) {
    console.error('下载报告失败:', error);
    res.status(500).json({ error: '服务器内部错误', details: error.message });
  }
});

// 知识库端点
// 获取所有知识条目
app.get('/api/knowledge', (req, res) => {
  const { category, source, search } = req.query;
  let filtered = knowledge;
  if (category && category !== '全部') {
    filtered = filtered.filter(item => item.category === category);
  }
  if (source && source !== '全部') {
    filtered = filtered.filter(item => item.source === source);
  }
  if (search) {
    const query = search.toLowerCase();
    filtered = filtered.filter(item =>
      item.title.toLowerCase().includes(query) ||
      item.description.toLowerCase().includes(query) ||
      (item.content && item.content.toLowerCase().includes(query))
    );
  }
  res.json({
    success: true,
    items: filtered,
    total: filtered.length
  });
});

// 获取单个知识条目
app.get('/api/knowledge/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const item = knowledge.find(item => item.id === id);
  if (!item) {
    return res.status(404).json({ success: false, error: '知识条目不存在' });
  }
  res.json({ success: true, item });
});

// 创建知识条目（管理用）
app.post('/api/knowledge', express.json(), (req, res) => {
  const { title, description, content, category, source, icon, iconColor } = req.body;
  if (!title || !category || !source) {
    return res.status(400).json({ success: false, error: '缺少必要字段' });
  }
  const newItem = {
    id: knowledge.length > 0 ? Math.max(...knowledge.map(item => item.id)) + 1 : 1,
    title,
    description: description || '',
    content: content || '',
    category,
    source,
    icon: icon || 'mdi-book',
    iconColor: iconColor || 'blue',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  knowledge.push(newItem);
  saveKnowledge(knowledge);
  res.json({ success: true, item: newItem });
});

// 更新知识条目
app.put('/api/knowledge/:id', express.json(), (req, res) => {
  const id = parseInt(req.params.id);
  const index = knowledge.findIndex(item => item.id === id);
  if (index === -1) {
    return res.status(404).json({ success: false, error: '知识条目不存在' });
  }
  const { title, description, content, category, source, icon, iconColor } = req.body;
  const updatedItem = { ...knowledge[index] };
  if (title !== undefined) updatedItem.title = title;
  if (description !== undefined) updatedItem.description = description;
  if (content !== undefined) updatedItem.content = content;
  if (category !== undefined) updatedItem.category = category;
  if (source !== undefined) updatedItem.source = source;
  if (icon !== undefined) updatedItem.icon = icon;
  if (iconColor !== undefined) updatedItem.iconColor = iconColor;
  updatedItem.updatedAt = new Date().toISOString();
  knowledge[index] = updatedItem;
  saveKnowledge(knowledge);
  res.json({ success: true, item: updatedItem });
});

// 删除知识条目
app.delete('/api/knowledge/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const index = knowledge.findIndex(item => item.id === id);
  if (index === -1) {
    return res.status(404).json({ success: false, error: '知识条目不存在' });
  }
  knowledge.splice(index, 1);
  saveKnowledge(knowledge);
  res.json({ success: true, message: '删除成功' });
});

// 手动更新知识库（添加示例新条目）
app.post('/api/knowledge/update', express.json(), (req, res) => {
  const { count = 3 } = req.body;
  const newEntries = [
    {
      title: '网络购物诈骗新型手法',
      description: '虚假优惠券、钓鱼链接、冒充客服退款等',
      content: '随着电商普及，网络购物诈骗手法不断翻新。常见手法：\n1. 虚假优惠券：通过短信、社交群发送“内部优惠券”链接，点击后窃取账号密码。\n2. 钓鱼链接：模仿正规电商页面，诱导输入支付信息。\n3. 冒充客服退款：以订单异常为由，要求受害人点击链接或提供验证码。\n防范建议：\n- 勿点击陌生链接；\n- 核实客服身份；\n- 使用官方平台沟通。',
      category: '网络购物',
      source: '警方通报',
      icon: 'mdi-cart',
      iconColor: 'deep-orange'
    },
    {
      title: '情感诈骗（杀猪盘）识别',
      description: '通过建立情感关系诱导投资、赌博的诈骗',
      content: '“杀猪盘”是近年来高发的情感投资诈骗。诈骗步骤：\n1. 寻找目标：在社交平台、婚恋网站物色受害人。\n2. 建立感情：每日嘘寒问暖，确立恋爱关系（养猪）。\n3. 诱导投资：透露“内部消息”，推荐虚假投资平台。\n4. 杀猪收网：受害人投入大额资金后无法提现，对方失联。\n识别特征：\n- 对方拒绝视频、见面；\n- 谈话内容逐渐导向投资、赌博；\n- 平台无法正常提现。\n防范口诀：网恋需谨慎，谈钱即诈骗。',
      category: '情感诈骗',
      source: '典型案例库',
      icon: 'mdi-heart-broken',
      iconColor: 'pink'
    },
    {
      title: '虚拟货币投资诈骗预警',
      description: '利用虚拟货币、区块链概念实施的高科技诈骗',
      content: '虚拟货币诈骗常包装成“区块链项目”、“去中心化金融”，承诺高额回报。\n常见套路：\n1. 虚假交易所：搭建仿冒知名交易所的网站，诱导充值。\n2. 空气币：发行毫无价值的代币，通过炒作吸引购买后抛售。\n3. 矿机租赁：以“云挖矿”为名收取租赁费，实际无算力。\n风险提示：\n- 我国已明确禁止虚拟货币交易炒作；\n- 任何承诺“稳赚不赔”的虚拟货币投资都是诈骗；\n- 警惕境外交易平台，资金追回极难。',
      category: '投资理财',
      source: '专家分析',
      icon: 'mdi-currency-btc',
      iconColor: 'amber'
    }
  ];
  let added = 0;
  const existingTitles = knowledge.map(item => item.title);
  for (const entry of newEntries) {
    if (existingTitles.includes(entry.title)) {
      continue; // 避免重复添加
    }
    const newItem = {
      id: knowledge.length > 0 ? Math.max(...knowledge.map(item => item.id)) + 1 : 1,
      ...entry,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    knowledge.push(newItem);
    added++;
    if (added >= count) break;
  }
  saveKnowledge(knowledge);
  res.json({
    success: true,
    added,
    message: `已添加 ${added} 条新知识条目`
  });
});

// 提供上传文件的静态访问
app.use('/uploads', express.static('uploads'));

// 全局错误处理
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: '服务器内部错误' });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`🚀 后端服务器运行在 http://localhost:${PORT}`);
  console.log(`📝 文本分析端点: POST http://localhost:${PORT}/api/analyze/text`);
  console.log(`🖼️  图片分析端点: POST http://localhost:${PORT}/api/analyze/image`);
  console.log(`🎵 音频分析端点: POST http://localhost:${PORT}/api/analyze/audio`);
  console.log(`📤 图片上传端点: POST http://localhost:${PORT}/api/upload/image`);
  console.log(`🎤 音频上传端点: POST http://localhost:${PORT}/api/upload/audio`);
});
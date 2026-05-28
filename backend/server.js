const express = require('express');
const cors = require('cors');
const multer = require('multer');
const axios = require('axios');
const OpenAI = require('openai');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegStatic = require('ffmpeg-static');
const fs = require('fs');
const path = require('path');
const guardianResolve = require('./guardianResolve');
const { RISK_CALIBRATION_RULES, normalizeAnalysisRisk } = require('./riskLevelNormalize');
require('dotenv').config();

if (ffmpegStatic) {
  ffmpeg.setFfmpegPath(ffmpegStatic);
}

const QWEN_API_URL = process.env.QWEN_API_URL || 'https://dashscope.aliyuncs.com/compatible-mode/v1';
const DASHSCOPE_API_KEY = process.env.DASHSCOPE_API_KEY || process.env.QWEN_API_KEY || '';
let qwenClient = null;

function getQwenClient() {
  if (!DASHSCOPE_API_KEY) {
    throw new Error('缺少 QWEN_API_KEY 或 DASHSCOPE_API_KEY，无法进行音视频AI分析');
  }
  if (!qwenClient) {
    qwenClient = new OpenAI({
      apiKey: DASHSCOPE_API_KEY,
      baseURL: QWEN_API_URL,
      timeout: 60000,
      maxRetries: 2
    });
  }
  return qwenClient;
}

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

// DeepSeek API 配置（密钥仅放在 backend/.env，勿写入代码）
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || '';
const DEEPSEEK_API_URL = process.env.DEEPSEEK_API_URL || 'https://api.deepseek.com/chat/completions';
const DEEPSEEK_MODEL = process.env.DEEPSEEK_MODEL || 'deepseek-chat';

function requireDeepSeekKey() {
  if (!DEEPSEEK_API_KEY) {
    throw new Error('缺少 DEEPSEEK_API_KEY，请在 backend/.env 中配置');
  }
}

// 文件类型安全验证
const ALLOWED_MIME_TYPES = {
  'image/jpeg': true,
  'image/png': true,
  'image/gif': true,
  'image/webp': true,
  'audio/mpeg': true,
  'audio/mp3': true,
  'audio/wav': true,
  'audio/x-wav': true,
  'audio/wave': true,
  'audio/mp4': true,
  'audio/x-m4a': true,
  'audio/aac': true,
  'audio/webm': true,
  'audio/ogg': true,
  'video/mp4': true,
  'video/webm': true,
  'video/quicktime': true
};

const ALLOWED_EXTENSIONS = {
  '.jpg': true,
  '.jpeg': true,
  '.png': true,
  '.gif': true,
  '.webp': true,
  '.mp3': true,
  '.wav': true,
  '.ogg': true,
  '.m4a': true,
  '.webm': true,
  '.mp4': true,
  '.mov': true
};

function validateFileType(mimetype, originalname = '') {
  if (ALLOWED_MIME_TYPES[mimetype]) return true;
  const ext = path.extname(String(originalname || '')).toLowerCase();
  if (ext && ALLOWED_EXTENSIONS[ext]) return true;
  return false;
}

// 文件安全中间件（用于上传路由）
function fileSecurityFilter(req, res, next) {
  if (!req.file) {
    return next();
  }
  const { mimetype, originalname } = req.file;
  if (!validateFileType(mimetype, originalname)) {
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
  requireDeepSeekKey();
  try {
    const response = await axios.post(
      DEEPSEEK_API_URL,
      {
        model: DEEPSEEK_MODEL,
        messages: [
          {
            role: 'system',
            content: `你是一个专业的反诈骗分析助手。请对用户提供的文本内容进行诈骗风险分析，输出 JSON 格式，包含以下字段：
- risk_level: 字符串，可选值 "high", "medium", "low"
- confidence: 数值，0-1 表示置信度
- reasons: 字符串数组，列出检测到的风险点
- suggestions: 字符串数组，给出防范建议
- summary: 字符串，简要总结

${RISK_CALIBRATION_RULES}`
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
        return normalizeAnalysisRisk(JSON.parse(jsonMatch[0]));
      } else {
        // 否则，构造一个通用结构
        return normalizeAnalysisRisk({
          risk_level: 'medium',
          confidence: 0.8,
          reasons: ['无法解析具体风险点'],
          suggestions: ['请谨慎对待此信息'],
          summary: content.substring(0, 200)
        });
      }
    } catch (parseError) {
      console.error('解析 DeepSeek 响应失败:', parseError);
      return normalizeAnalysisRisk({
        risk_level: 'unknown',
        confidence: 0,
        reasons: ['分析服务暂时不可用'],
        suggestions: ['请稍后重试'],
        summary: '分析出错'
      });
    }
  } catch (error) {
    console.error('调用 DeepSeek API 失败:', error.response?.data || error.message);
    throw new Error('AI 分析服务暂时不可用');
  }
}

// 智能助手问答
async function callDeepSeekChat(userMessage) {
  requireDeepSeekKey();
  try {
    const response = await axios.post(
      DEEPSEEK_API_URL,
      {
        model: DEEPSEEK_MODEL,
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

// 报告存储（文件）
const REPORTS_FILE = path.join(__dirname, '../data/reports.json');
const KNOWLEDGE_FILE = path.join(__dirname, '../data/knowledge.json');
const USERS_FILE = path.join(__dirname, '../data/users.json');
const RISK_EVENTS_FILE = path.join(__dirname, '../data/risk-events.json');
const NOTIFICATIONS_FILE = path.join(__dirname, '../data/notifications.json');
const GUARDIAN_LINKS_FILE = path.join(__dirname, '../data/guardian-links.json');

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

function loadRiskEvents() {
  try {
    if (fs.existsSync(RISK_EVENTS_FILE)) {
      const data = fs.readFileSync(RISK_EVENTS_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('加载风险事件文件失败:', error);
  }
  return [];
}

function saveRiskEvents(events) {
  try {
    fs.writeFileSync(RISK_EVENTS_FILE, JSON.stringify(events, null, 2), 'utf8');
  } catch (error) {
    console.error('保存风险事件文件失败:', error);
  }
}

function loadNotifications() {
  try {
    if (fs.existsSync(NOTIFICATIONS_FILE)) {
      const data = fs.readFileSync(NOTIFICATIONS_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('加载通知文件失败:', error);
  }
  return [];
}

function saveNotifications(notificationList) {
  try {
    fs.writeFileSync(NOTIFICATIONS_FILE, JSON.stringify(notificationList, null, 2), 'utf8');
  } catch (error) {
    console.error('保存通知文件失败:', error);
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

// 加载数据
let knowledge = loadKnowledge();
let reports = loadReports();
let users = loadUsers();
let riskEvents = loadRiskEvents();
let notifications = loadNotifications();

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

  const emailNorm = String(email).trim().toLowerCase();
  const user = users.find((u) => String(u.email || '').trim().toLowerCase() === emailNorm);
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
  
  // 确定用户类型
  let userType = user.userType || '用户';
  // 如果userType不存在但role包含"监护人"，则设置为监护人
  if (userType === '用户' && user.role && user.role.includes('监护人')) {
    userType = '监护人';
  }
  
  res.json({
    success: true,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      userType: userType,
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
  
  const regEmailNorm = String(email).trim().toLowerCase();
  if (users.some((u) => String(u.email || '').trim().toLowerCase() === regEmailNorm)) {
    return res.status(400).json({ success: false, error: '邮箱已被注册' });
  }
  
  // 解析用户类型和角色
  let userType = '用户';
  let roleDetail = role || '普通用户';
  
  if (role && role.includes(' - ')) {
    const parts = role.split(' - ');
    userType = parts[0];
    roleDetail = parts[1];
  }
  
  // 确保userType正确设置
  if (role && role.includes('监护人')) {
    userType = '监护人';
  }
  
  const newUser = {
    id: users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1,
    username: email.split('@')[0],
    password: password, // 实际应用中应该加密
    email: email,
    phone: phone,
    name: name,
    userType: userType,
    role: roleDetail,
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
      userType: newUser.userType,
      role: newUser.role,
      riskLevel: newUser.riskLevel,
      bio: newUser.bio
    },
    message: '注册成功'
  });
});

// 数据同步：按 users.json 清理失效用户关联数据
app.post('/api/admin/sync-user-data', express.json(), (req, res) => {
  try {
    users = loadUsers();
    reports = loadReports();
    riskEvents = loadRiskEvents();
    notifications = loadNotifications();
    const links = guardianResolve.loadGuardianLinks(fs, GUARDIAN_LINKS_FILE);

    const validEmails = new Set(
      (Array.isArray(users) ? users : [])
        .map((u) => normalizeReportAuthorEmail(u.email))
        .filter(Boolean)
    );

    const reportsBefore = Array.isArray(reports) ? reports.length : 0;
    reports = (Array.isArray(reports) ? reports : []).filter((r) => {
      const ae = normalizeReportAuthorEmail(r.authorEmail);
      return !ae || validEmails.has(ae);
    });
    saveReports(reports);

    const riskBefore = Array.isArray(riskEvents) ? riskEvents.length : 0;
    riskEvents = (Array.isArray(riskEvents) ? riskEvents : []).filter((e) => {
      const ue = normalizeReportAuthorEmail(e.userEmail);
      return !ue || validEmails.has(ue);
    });
    saveRiskEvents(riskEvents);

    const notificationsBefore = Array.isArray(notifications) ? notifications.length : 0;
    notifications = (Array.isArray(notifications) ? notifications : []).filter((n) => {
      const to = normalizeReportAuthorEmail(n.to);
      return !to || validEmails.has(to);
    });
    saveNotifications(notifications);

    const linksBefore = Array.isArray(links) ? links.length : 0;
    const nextLinks = (Array.isArray(links) ? links : []).filter((item) => {
      const g = normalizeReportAuthorEmail(item.guardianEmail);
      const w = normalizeReportAuthorEmail(item.wardEmail);
      if (!g || !w) return false;
      return validEmails.has(g) && validEmails.has(w);
    });
    guardianResolve.saveGuardianLinks(fs, GUARDIAN_LINKS_FILE, nextLinks);

    res.json({
      success: true,
      message: '用户关联数据同步完成',
      stats: {
        validUsers: validEmails.size,
        reportsRemoved: reportsBefore - reports.length,
        riskEventsRemoved: riskBefore - riskEvents.length,
        notificationsRemoved: notificationsBefore - notifications.length,
        guardianLinksRemoved: linksBefore - nextLinks.length
      }
    });
  } catch (error) {
    console.error('同步用户数据失败:', error);
    res.status(500).json({
      success: false,
      error: '同步用户数据失败',
      detail: error.message
    });
  }
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

// 中风险工作流：强拦截确认页 + 用户短信提醒 + 后台风险累计
app.post('/api/risk/workflow/medium', express.json(), (req, res) => {
  const { userEmail, userName, summary, risks } = req.body || {};
  if (!userEmail) {
    return res.status(400).json({ success: false, error: '缺少 userEmail' });
  }

  const event = {
    id: riskEvents.length > 0 ? Math.max(...riskEvents.map(item => item.id || 0)) + 1 : 1,
    severity: 'medium',
    userEmail,
    userName: userName || '',
    summary: summary || '检测到中风险行为',
    risks: Array.isArray(risks) ? risks : [],
    createdAt: new Date().toISOString()
  };
  riskEvents.push(event);
  saveRiskEvents(riskEvents);

  const mediumRiskCount = riskEvents.filter(item => item.userEmail === userEmail && item.severity === 'medium').length;
  const sms = {
    id: notifications.length > 0 ? Math.max(...notifications.map(item => item.id || 0)) + 1 : 1,
    type: 'sms',
    to: userEmail,
    title: '中风险提醒',
    content: `检测到中风险行为，请本人确认操作。累计中风险次数：${mediumRiskCount}`,
    createdAt: new Date().toISOString()
  };
  notifications.push(sms);
  saveNotifications(notifications);

  res.json({
    success: true,
    event,
    mediumRiskCount,
    sms
  });
});

// 高风险工作流：优先已绑定监护人 -> 服务端绑定表 -> 占位监护人账户 -> 通知记录（演示环境不写真实短信）
app.post('/api/risk/workflow/high', express.json(), (req, res) => {
  const { userEmail, userName, userPhone, summary, risks } = req.body || {};
  if (!userEmail) {
    return res.status(400).json({ success: false, error: '缺少 userEmail' });
  }

  const now = new Date().toISOString();
  const event = {
    id: riskEvents.length > 0 ? Math.max(...riskEvents.map(item => item.id || 0)) + 1 : 1,
    severity: 'high',
    userEmail,
    userName: userName || '',
    summary: summary || '检测到高风险行为',
    risks: Array.isArray(risks) ? risks : [],
    createdAt: now
  };
  riskEvents.push(event);
  saveRiskEvents(riskEvents);

  const {
    guardian,
    guardianCreated,
    createdGuardianPassword,
    persistUsers
  } = guardianResolve.resolveGuardian({
    fs,
    guardianLinksFile: GUARDIAN_LINKS_FILE,
    users,
    userEmail,
    userName,
    userPhone,
    nowIso: now,
    reqBody: req.body
  });

  if (persistUsers) {
    saveUsers(users);
  }

  const wardLabel =
    userName && String(userName).trim() && userName !== '当前用户'
      ? `「${String(userName).trim()}」(${userEmail})`
      : `(${userEmail})`;
  const guardianNotice = {
    id: notifications.length > 0 ? Math.max(...notifications.map(item => item.id || 0)) + 1 : 1,
    type: 'guardian-notify',
    to: guardian.email,
    title: '高风险核验通知',
    content: `被监护人${wardLabel}触发高风险检测，请尽快联系本人核实，勿轻信转账或索要验证码。`,
    createdAt: now
  };
  notifications.push(guardianNotice);
  saveNotifications(notifications);

  res.json({
    success: true,
    event,
    guardianCreated,
    guardianAccount: {
      email: guardian.email,
      password: guardianCreated ? createdGuardianPassword : null,
      name: guardian.name
    },
    notification: guardianNotice,
    notificationHint:
      '当前为演示模式：通知仅写入服务端记录（notifications.json），不会发送真实短信或邮件；已绑定监护人时将通知到其账号邮箱。'
  });
});

app.post('/api/guardian/link', express.json(), (req, res) => {
  const body = req.body || {};
  if (!body.guardianEmail || !body.wardEmail) {
    return res.status(400).json({ success: false, error: '缺少 guardianEmail 或 wardEmail' });
  }
  const links = guardianResolve.loadGuardianLinks(fs, GUARDIAN_LINKS_FILE);
  const next = guardianResolve.upsertGuardianLink(links, body);
  guardianResolve.saveGuardianLinks(fs, GUARDIAN_LINKS_FILE, next);
  res.json({ success: true });
});

app.post('/api/guardian/unlink', express.json(), (req, res) => {
  const { guardianEmail, wardEmail } = req.body || {};
  if (!guardianEmail || !wardEmail) {
    return res.status(400).json({ success: false, error: '缺少 guardianEmail 或 wardEmail' });
  }
  const links = guardianResolve.loadGuardianLinks(fs, GUARDIAN_LINKS_FILE);
  const next = guardianResolve.removeGuardianLink(links, guardianEmail, wardEmail);
  guardianResolve.saveGuardianLinks(fs, GUARDIAN_LINKS_FILE, next);
  res.json({ success: true });
});

app.get('/api/guardian/links', (req, res) => {
  const guardianEmail = String(req.query.guardianEmail || '').trim().toLowerCase();
  const wardEmail = String(req.query.wardEmail || '').trim().toLowerCase();
  const links = guardianResolve.loadGuardianLinks(fs, GUARDIAN_LINKS_FILE);
  const filteredLinks = links.filter((item) => {
    const g = String(item.guardianEmail || '').trim().toLowerCase();
    const w = String(item.wardEmail || '').trim().toLowerCase();
    if (guardianEmail && g !== guardianEmail) return false;
    if (wardEmail && w !== wardEmail) return false;
    return true;
  });

  // 兜底：当 guardian-links 没有数据时，尝试从 users 的 guardedUserEmail 关系推导。
  const fallbackItems = [];
  const guardianCandidates = users.filter((u) => {
    const typeHit = String(u.userType || '') === '监护人';
    const roleHit = String(u.role || '').includes('监护人');
    return typeHit || roleHit;
  });

  for (const gUser of guardianCandidates) {
    const gEmail = String(gUser.email || '').trim();
    const gNorm = gEmail.toLowerCase();
    const wNorm = String(gUser.guardedUserEmail || '').trim().toLowerCase();
    if (!gNorm || !wNorm) continue;
    if (guardianEmail && gNorm !== guardianEmail) continue;
    if (wardEmail && wNorm !== wardEmail) continue;

    const wardUser = guardianResolve.findUserByEmail(users, wNorm);
    fallbackItems.push({
      guardianEmail: gEmail,
      guardianName: gUser.name || '监护人',
      guardianPhone: gUser.phone || '',
      wardEmail: wardUser?.email || gUser.guardedUserEmail,
      wardName: wardUser?.name || '被监护人',
      relationship: gUser.role || '家长',
      riskLevel: wardUser?.riskLevel || '低风险',
      verifiedAt: gUser.updatedAt || gUser.createdAt || new Date().toISOString(),
      source: 'users_fallback'
    });
  }

  const mergedMap = new Map();
  [...fallbackItems, ...filteredLinks].forEach((item) => {
    const key = `${String(item.guardianEmail || '').trim().toLowerCase()}::${String(item.wardEmail || '').trim().toLowerCase()}`;
    if (!key || key === '::') return;
    mergedMap.set(key, item);
  });

  const items = [...mergedMap.values()];
  res.json({ success: true, items });
});

app.get('/api/risk/events', (req, res) => {
  res.json({
    success: true,
    events: riskEvents
  });
});

app.get('/api/notifications', (req, res) => {
  const email = String(req.query.email || '').trim().toLowerCase();
  if (!email) {
    return res.status(400).json({ success: false, error: '缺少 email 参数' });
  }
  const items = notifications.filter((n) => {
    const to = String(n.to || '').trim().toLowerCase();
    return to === email;
  });
  items.sort((a, b) => {
    const ta = new Date(a.createdAt || 0).getTime();
    const tb = new Date(b.createdAt || 0).getTime();
    return tb - ta;
  });
  res.json({ success: true, items });
});

// 智能助手问答端点
app.post('/api/chat', async (req, res) => {
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
app.post('/api/analyze/text', async (req, res) => {
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
app.post('/api/analyze/audio', upload.single('audio'), fileSecurityFilter, async (req, res) => {
  let tempFiles = [];

  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: '未上传音频文件' });
    }

    const originalPath = path.resolve(req.file.path);
    let audioPath = originalPath;
    tempFiles.push(originalPath);

    if (!fs.existsSync(originalPath)) {
      throw new Error(`上传音频不存在: ${originalPath}`);
    }

    const standardPath = `${originalPath}_standard.wav`;
    await convertAudioToWav(originalPath, standardPath);
    if (!fs.existsSync(standardPath)) {
      throw new Error('音频格式转换失败');
    }
    tempFiles.push(standardPath);
    audioPath = standardPath;

    const stat = fs.statSync(audioPath);
    if (stat.size > 8 * 1024 * 1024) {
      const trimmedPath = `${originalPath}_trimmed.wav`;
      await trimAudio(audioPath, trimmedPath, 30);
      if (!fs.existsSync(trimmedPath)) {
        throw new Error('音频截取失败');
      }
      tempFiles.push(trimmedPath);
      audioPath = trimmedPath;
    }

    const audioBuffer = fs.readFileSync(audioPath);
    const audioBase64 = audioBuffer.toString('base64');
    const analysis = await analyzeAudioWithQwen(audioBase64);

    res.json({
      success: true,
      file: {
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        url: `/uploads/${req.file.filename}`
      },
      analysis
    });
  } catch (err) {
    console.error('音频分析失败:', err);
    res.status(500).json({
      success: false,
      error: err.message || '音频分析失败'
    });
  } finally {
    cleanupFiles(tempFiles);
  }
});

// 视频分析端点（接收视频文件并返回分析结果）
app.post('/api/analyze/video', upload.single('video'), fileSecurityFilter, async (req, res) => {
  let tempFiles = [];
  let frameDir = '';

  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: '未上传视频文件' });
    }

    const videoPath = path.resolve(req.file.path);
    tempFiles.push(videoPath);
    if (!fs.existsSync(videoPath)) {
      throw new Error(`上传视频不存在: ${videoPath}`);
    }

    frameDir = path.join(path.dirname(videoPath), `${req.file.filename}_frames`);
    if (!fs.existsSync(frameDir)) fs.mkdirSync(frameDir, { recursive: true });
    const audioPath = path.join(path.dirname(videoPath), `${req.file.filename}_audio.wav`);
    tempFiles.push(audioPath);

    await Promise.all([
      extractFramesFromVideo(videoPath, frameDir),
      extractAudioFromVideo(videoPath, audioPath)
    ]);

    const frameFiles = fs.readdirSync(frameDir).filter((f) => f.endsWith('.jpg'));
    const firstFrame = frameFiles.length ? path.join(frameDir, frameFiles[0]) : '';
    let frameAnalysis = null;
    let audioAnalysis = null;

    if (firstFrame && fs.existsSync(firstFrame)) {
      const frameBase64 = fs.readFileSync(firstFrame).toString('base64');
      frameAnalysis = await analyzeFrameWithQwen(frameBase64);
    }
    if (fs.existsSync(audioPath)) {
      const audioBase64 = fs.readFileSync(audioPath).toString('base64');
      audioAnalysis = await analyzeAudioWithQwen(audioBase64);
    }

    if (!frameAnalysis && !audioAnalysis) {
      throw new Error('视频画面和音频均未提取成功');
    }

    const merged = mergeFrameAndAudioAnalysis(
      frameAnalysis || fallbackAnalysis('未提取到可用视频帧'),
      audioAnalysis || fallbackAnalysis('未提取到可用视频音频')
    );

    res.json({
      success: true,
      file: {
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        url: `/uploads/${req.file.filename}`
      },
      analysis: merged,
      details: {
        frame: frameAnalysis,
        audio: audioAnalysis
      }
    });
  } catch (err) {
    console.error('视频分析失败:', err);
    res.status(500).json({
      success: false,
      error: err.message || '视频分析失败'
    });
  } finally {
    cleanupFiles(tempFiles);
    if (frameDir && fs.existsSync(frameDir)) {
      fs.rmSync(frameDir, { recursive: true, force: true });
    }
  }
});

function fallbackAnalysis(summary) {
  return {
    risk_level: 'medium',
    confidence: 0.5,
    reasons: ['分析流程异常，需要人工复核'],
    suggestions: ['请结合上下文进行人工研判'],
    summary: summary || '分析失败'
  };
}

function parseAIResponse(rawContent) {
  try {
    let cleaned = String(rawContent || '')
      .trim()
      .replace(/^```json\s*/i, '')
      .replace(/\s*```$/, '')
      .trim();
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    cleaned = jsonMatch ? jsonMatch[0] : cleaned;
    const parsed = JSON.parse(cleaned);
    if (!parsed || typeof parsed !== 'object') return fallbackAnalysis('AI返回异常');
    return {
      risk_level: parsed.risk_level || 'medium',
      confidence: Number(parsed.confidence || 0.5),
      reasons: Array.isArray(parsed.reasons) ? parsed.reasons : ['未返回风险原因'],
      suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions : ['请人工复核'],
      summary: String(parsed.summary || '分析完成')
    };
  } catch (err) {
    return fallbackAnalysis('AI响应解析失败');
  }
}

async function convertAudioToWav(inputPath, outputPath) {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .audioCodec('pcm_s16le')
      .audioChannels(1)
      .audioFrequency(16000)
      .audioBitrate(128)
      .format('wav')
      .on('end', resolve)
      .on('error', reject)
      .save(outputPath);
  });
}

async function trimAudio(inputPath, outputPath, seconds) {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .setStartTime(0)
      .duration(seconds || 30)
      .audioCodec('pcm_s16le')
      .audioChannels(1)
      .audioFrequency(16000)
      .audioBitrate(128)
      .format('wav')
      .on('end', resolve)
      .on('error', reject)
      .save(outputPath);
  });
}

async function extractFramesFromVideo(videoPath, frameDir) {
  return new Promise((resolve, reject) => {
    ffmpeg(videoPath)
      .fps(0.2)
      .frames(5)
      .output(path.join(frameDir, 'frame-%03d.jpg'))
      .on('end', resolve)
      .on('error', reject)
      .run();
  });
}

async function extractAudioFromVideo(videoPath, audioPath) {
  return new Promise((resolve, reject) => {
    ffmpeg(videoPath)
      .noVideo()
      .audioCodec('pcm_s16le')
      .audioChannels(1)
      .audioFrequency(16000)
      .audioBitrate(128)
      .format('wav')
      .on('end', resolve)
      .on('error', reject)
      .save(audioPath);
  });
}

async function analyzeAudioWithQwen(base64Audio) {
  const client = getQwenClient();
  const completion = await client.chat.completions.create({
    model: 'qwen3.5-omni-plus',
    messages: [
      {
        role: 'system',
        content: `你是专业反诈音频分析专家。
请严格只返回 JSON，字段必须包含：risk_level, confidence, reasons, suggestions, summary。
输出要求：
1) reasons 必须提供 4-8 条，且每条都要具体，不要泛化描述。
2) 每条 reasons 尽量包含：可疑话术/行为特征 + 风险解释 + 可能后果。
3) 优先识别：冒充公检法、虚假客服、诱导转账、索要验证码、屏幕共享、紧急恐吓、合成语音伪装亲友等。
4) suggestions 要与 reasons 一一对应，给出可执行动作（如“挂断后拨打官方热线核验”）。
5) summary 用 50-120 字，概括主要诈骗套路与处理建议。
仅返回 JSON 对象，不要 markdown、不加反引号。`
      },
      {
        role: 'user',
        content: [
          { type: 'input_audio', input_audio: { data: base64Audio, format: 'wav' } },
          { type: 'text', text: '请详细分析这段音频中的电信诈骗风险点，给出可操作建议。' }
        ]
      }
    ],
    temperature: 0.05,
    max_tokens: 1500
  });
  return parseAIResponse(completion?.choices?.[0]?.message?.content);
}

async function analyzeFrameWithQwen(base64Frame) {
  const client = getQwenClient();
  const completion = await client.chat.completions.create({
    model: 'qwen3.5-omni-plus',
    messages: [
      {
        role: 'system',
        content: `你是专业反诈视频画面分析专家。
请严格只返回 JSON，字段必须包含：risk_level, confidence, reasons, suggestions, summary。
输出要求：
1) reasons 提供 4-8 条，描述要具体到画面元素（按钮文案、金额、二维码、页面布局、品牌仿冒痕迹等）。
2) 每条 reasons 要包含：视觉证据 + 为什么可疑 + 受害风险。
3) 优先识别：仿冒政务/银行页面、紧急转账提示、中奖返利诱导、客服伪装、钓鱼二维码、异常收款账户信息。
4) suggestions 对应 reasons，给出立即可执行动作（停止操作、官方渠道核验、保留证据等）。
5) summary 用 50-120 字总结核心风险和处置优先级。
特别约束：你分析的是“视频画面/视频截图”，回答中不要出现“图片/照片/图像”字样，统一称为“视频画面/视频截图”。
仅返回 JSON 对象，不要 markdown、不加反引号。`
      },
      {
        role: 'user',
        content: [
          { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${base64Frame}` } },
          { type: 'text', text: '请详细分析这张视频截图中的反诈风险点并给出处置建议。' }
        ]
      }
    ],
    temperature: 0.05,
    max_tokens: 1500
  });
  return parseAIResponse(completion?.choices?.[0]?.message?.content);
}

function normalizeVideoWording(s) {
  const str = String(s || '');
  if (!str) return '';
  // 兜底：模型偶尔会把“视频截图”说成“图片”
  return str.replace(/图片|照片|图像/g, '视频画面');
}

function mergeFrameAndAudioAnalysis(frame, audio) {
  const levelWeight = { high: 3, medium: 2, low: 1 };
  const f = frame || fallbackAnalysis('画面分析缺失');
  const a = audio || fallbackAnalysis('音频分析缺失');

  let risk_level = 'low';
  if (f.risk_level === 'high' && a.risk_level === 'high') risk_level = 'high';
  else if (f.risk_level === 'high' || a.risk_level === 'high') risk_level = 'medium';
  else if (f.risk_level === 'medium' || a.risk_level === 'medium') risk_level = 'medium';

  const confidence = Number((((f.confidence || 0.5) + (a.confidence || 0.5)) / 2).toFixed(2));
  const reasons = [
    ...new Set([
      ...(f.reasons || []).map((x) => `[画面] ${normalizeVideoWording(x)}`),
      ...(a.reasons || []).map((x) => `[音频] ${x}`)
    ])
  ];
  const suggestions = [
    ...new Set([...(f.suggestions || []).map((x) => normalizeVideoWording(x)), ...(a.suggestions || [])])
  ];

  return {
    risk_level,
    confidence,
    reasons,
    suggestions,
    summary: normalizeVideoWording(`视频综合分析完成：画面(${f.risk_level})，音频(${a.risk_level})。`),
    fusion_logic: {
      frame_risk: f.risk_level,
      audio_risk: a.risk_level,
      frame_weight: levelWeight[f.risk_level] || 1,
      audio_weight: levelWeight[a.risk_level] || 1
    }
  };
}

function cleanupFiles(files) {
  (files || []).forEach((f) => {
    try {
      if (f && fs.existsSync(f)) fs.unlinkSync(f);
    } catch (err) {
      console.warn('清理临时文件失败:', f);
    }
  });
}

function normalizeReportAuthorEmail(email) {
  return String(email || '').trim().toLowerCase();
}

/** 监护人视角：其绑定关系中的被监护人邮箱集合 */
function wardEmailSetForGuardian(guardianEmail) {
  const g = normalizeReportAuthorEmail(guardianEmail);
  const links = guardianResolve.loadGuardianLinks(fs, GUARDIAN_LINKS_FILE);
  const set = new Set();
  for (const item of links) {
    if (normalizeReportAuthorEmail(item.guardianEmail) === g) {
      const w = normalizeReportAuthorEmail(item.wardEmail);
      if (w) set.add(w);
    }
  }
  return set;
}

// 生成报告（含图片/音视频时在 content 与各 *Url 字段存 uploads 相对路径，便于历史回看）
app.post('/api/reports', express.json(), (req, res) => {
  reports = loadReports();
  const {
    title,
    severity,
    risks,
    actions,
    summary,
    modality,
    content,
    imageUrl,
    videoUrl,
    audioUrl,
    fileInfo,
    transcription,
    authorEmail,
    authorName,
    authorRole
  } = req.body;
  if (!title || !severity) {
    return res.status(400).json({ error: '缺少必要字段' });
  }
  const mod = modality || 'text';
  const contentStr = typeof content === 'string' ? content : (content != null ? String(content) : '');
  const numericIds = reports.map((r) => Number(r.id)).filter((n) => Number.isFinite(n));
  const nextNumericId = numericIds.length ? Math.max(...numericIds) + 1 : 1;
  const newReport = {
    id: nextNumericId,
    title,
    severity,
    risks: risks || [],
    actions: actions || [],
    summary: summary || '',
    modality: mod,
    content: contentStr,
    imageUrl: imageUrl || (mod === 'image' ? contentStr : '') || '',
    videoUrl: videoUrl || (mod === 'video' ? contentStr : '') || '',
    audioUrl: audioUrl || (mod === 'audio' ? contentStr : '') || '',
    fileInfo: fileInfo && typeof fileInfo === 'object' ? fileInfo : {},
    transcription: typeof transcription === 'string' ? transcription : '',
    authorEmail: normalizeReportAuthorEmail(authorEmail),
    authorName: typeof authorName === 'string' ? authorName.trim() : '',
    authorRole: typeof authorRole === 'string' ? authorRole.trim() : '',
    date: new Date().toISOString(),
    events: Array.isArray(risks) ? risks.length : 0
  };
  reports.push(newReport);
  saveReports(reports);
  res.json({
    success: true,
    report: newReport,
    message: '报告已生成'
  });
});

// 获取报告列表（可选 viewerEmail + viewerType 按账号/监护关系筛选，便于监护人端同步且区分被监护人）
app.get('/api/reports', (req, res) => {
  reports = loadReports();
  let list = Array.isArray(reports) ? [...reports] : [];
  const viewerEmail = normalizeReportAuthorEmail(req.query.viewerEmail);
  const viewerType = String(req.query.viewerType || '').trim().toLowerCase();

  if (viewerEmail && viewerType === 'guardian') {
    const wards = wardEmailSetForGuardian(viewerEmail);
    // 监护人端：汇总“自己生成 + 所绑定被监护人生成”的报告
    list = list.filter((r) => {
      const ae = normalizeReportAuthorEmail(r.authorEmail);
      if (!ae) return false;
      return ae === viewerEmail || wards.has(ae);
    });
  } else if (viewerEmail && (viewerType === 'user' || viewerType === 'ward')) {
    // 被监护人/用户端：仅本人生成（authorEmail 与当前登录一致），不含无归属历史记录
    list = list.filter((r) => {
      const ae = normalizeReportAuthorEmail(r.authorEmail);
      return !!ae && ae === viewerEmail;
    });
  } else {
    // 未带有效 viewer 参数：不返回全量，避免未登录泄漏他人报告
    list = [];
  }

  res.json({
    success: true,
    reports: list
  });
});

// 删除单份报告（仅本人或监护人可删）
app.delete('/api/reports/:id', express.json(), (req, res) => {
  reports = loadReports();
  const idParam = req.params.id;
  const reportIndex = reports.findIndex((r) => String(r.id) === String(idParam));
  if (reportIndex < 0) {
    return res.status(404).json({ success: false, error: '报告不存在' });
  }

  const viewerEmail = normalizeReportAuthorEmail(req.query.viewerEmail || req.body?.viewerEmail);
  const viewerType = String(req.query.viewerType || req.body?.viewerType || '').trim().toLowerCase();
  if (!viewerEmail || !viewerType) {
    return res.status(400).json({ success: false, error: '缺少 viewerEmail 或 viewerType' });
  }

  const target = reports[reportIndex];
  const targetAuthor = normalizeReportAuthorEmail(target.authorEmail);
  const canDeleteAsOwner = !!targetAuthor && targetAuthor === viewerEmail;
  const canDeleteAsGuardian = viewerType === 'guardian' && (() => {
    const wardSet = wardEmailSetForGuardian(viewerEmail);
    return !!targetAuthor && wardSet.has(targetAuthor);
  })();

  if (!(canDeleteAsOwner || canDeleteAsGuardian)) {
    return res.status(403).json({ success: false, error: '无权限删除此报告' });
  }

  const [removed] = reports.splice(reportIndex, 1);
  saveReports(reports);
  res.json({
    success: true,
    message: '报告删除成功',
    removed
  });
});

// 账号注销（删除用户及关联数据）
app.delete('/api/auth/user', express.json(), (req, res) => {
  try {
    const userEmail = normalizeReportAuthorEmail(req.body?.email || req.query?.email);
    if (!userEmail) {
      return res.status(400).json({ success: false, error: '缺少邮箱' });
    }

    if (!Array.isArray(users)) {
      users = loadUsers();
    }
    const userIndex = users.findIndex(
      (u) => normalizeReportAuthorEmail(u.email) === userEmail
    );
    if (userIndex < 0) {
      return res.status(404).json({ success: false, error: '用户不存在' });
    }

    const removedUser = users[userIndex];
    users.splice(userIndex, 1);
    saveUsers(users);

    // 删除该账号生成的报告
    const reportsSource = loadReports();
    const reportsSafe = Array.isArray(reportsSource) ? reportsSource : [];
    reports = reportsSafe.filter(
      (r) => normalizeReportAuthorEmail(r.authorEmail) !== userEmail
    );
    saveReports(reports);

    // 删除相关风险事件与通知（兜底非数组）
    const riskEventsSafe = Array.isArray(riskEvents) ? riskEvents : loadRiskEvents();
    riskEvents = (Array.isArray(riskEventsSafe) ? riskEventsSafe : []).filter(
      (e) => normalizeReportAuthorEmail(e.userEmail) !== userEmail
    );
    saveRiskEvents(riskEvents);

    const notificationsSafe = Array.isArray(notifications) ? notifications : loadNotifications();
    notifications = (Array.isArray(notificationsSafe) ? notificationsSafe : []).filter(
      (n) => normalizeReportAuthorEmail(n.to) !== userEmail
    );
    saveNotifications(notifications);

    // 删除与该账号相关的监护关系
    const links = guardianResolve.loadGuardianLinks(fs, GUARDIAN_LINKS_FILE);
    const nextLinks = (Array.isArray(links) ? links : []).filter((link) => {
      const g = normalizeReportAuthorEmail(link.guardianEmail);
      const w = normalizeReportAuthorEmail(link.wardEmail);
      return g !== userEmail && w !== userEmail;
    });
    guardianResolve.saveGuardianLinks(fs, GUARDIAN_LINKS_FILE, nextLinks);

    res.json({
      success: true,
      message: '账号已注销',
      removedUser: {
        id: removedUser.id,
        email: removedUser.email,
        name: removedUser.name
      }
    });
  } catch (error) {
    console.error('注销账号失败:', error);
    res.status(500).json({
      success: false,
      error: '注销账号失败，请稍后重试',
      detail: error.message
    });
  }
});

// 下载报告为TXT文件
app.get('/api/reports/:id/download', (req, res) => {
  try {
    reports = loadReports();
    const idParam = req.params.id;
    const report = reports.find((r) => String(r.id) === String(idParam));
    if (!report) {
      return res.status(404).json({ error: '报告不存在' });
    }
    // 确保 risks 和 actions 是数组
    const risks = Array.isArray(report.risks) ? report.risks : [];
    const actions = Array.isArray(report.actions) ? report.actions : [];
    const mediaLine = [
      report.imageUrl && `图片地址: ${report.imageUrl}`,
      report.videoUrl && `视频地址: ${report.videoUrl}`,
      report.audioUrl && `音频地址: ${report.audioUrl}`
    ].filter(Boolean).join('\n');
    const trans = report.transcription ? `\n语音转写:\n${report.transcription}` : '';
    const rawBlock = mediaLine
      ? `原始内容（媒体）:\n${mediaLine}\n${report.content ? `说明/路径:\n${report.content}` : ''}${trans}`
      : `原始内容:\n${report.content || ''}${trans}`;
    const who = [report.authorName, report.authorEmail].filter(Boolean).join(' · ');
    const whoLine = who ? `\n生成账号: ${who}\n` : '';
    const txtContent = `安全报告\n==========\n\n标题: ${report.title}\n风险等级: ${report.severity}\n日期: ${report.date}${whoLine}\n风险点:\n${risks.map(r => '- ' + r).join('\n')}\n\n建议措施:\n${actions.map(a => '- ' + a).join('\n')}\n\n摘要: ${report.summary}\n\n${rawBlock}`;
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
      content: '随着电商普及，网络购物诈骗手法不断翻新。常见手法：\n1. 虚假优惠券：通过短信、社交群发送"内部优惠券"链接，点击后窃取账号密码。\n2. 钓鱼链接：模仿正规电商页面，诱导输入支付信息。\n3. 冒充客服退款：以订单异常为由，要求受害人点击链接或提供验证码。\n防范建议：\n- 勿点击陌生链接；\n- 核实客服身份；\n- 使用官方平台沟通。',
      category: '网络购物',
      source: '警方通报',
      icon: 'mdi-cart',
      iconColor: 'deep-orange'
    },
    {
      title: '情感诈骗（杀猪盘）识别',
      description: '通过建立情感关系诱导投资、赌博的诈骗',
      content: '"杀猪盘"是近年来高发的情感投资诈骗。诈骗步骤：\n1. 寻找目标：在社交平台、婚恋网站物色受害人。\n2. 建立感情：每日嘘寒问暖，确立恋爱关系（养猪）。\n3. 诱导投资：透露"内部消息"，推荐虚假投资平台。\n4. 杀猪收网：受害人投入大额资金后无法提现，对方失联。\n识别特征：\n- 对方拒绝视频、见面；\n- 谈话内容逐渐导向投资、赌博；\n- 平台无法正常提现。\n防范口诀：网恋需谨慎，谈钱即诈骗。',
      category: '情感诈骗',
      source: '典型案例库',
      icon: 'mdi-heart-broken',
      iconColor: 'pink'
    },
    {
      title: '虚拟货币投资诈骗预警',
      description: '利用虚拟货币、区块链概念实施的高科技诈骗',
      content: '虚拟货币诈骗常包装成"区块链项目"、"去中心化金融"，承诺高额回报。\n常见套路：\n1. 虚假交易所：搭建仿冒知名交易所的网站，诱导充值。\n2. 空气币：发行毫无价值的代币，通过炒作吸引购买后抛售。\n3. 矿机租赁：以"云挖矿"为名收取租赁费，实际无算力。\n风险提示：\n- 我国已明确禁止虚拟货币交易炒作；\n- 任何承诺"稳赚不赔"的虚拟货币投资都是诈骗；\n- 警惕境外交易平台，资金追回极难。',
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
// 将可公开资料统一放到 backend/data 下
app.use('/data-assets', express.static(path.join(__dirname, 'data')));

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
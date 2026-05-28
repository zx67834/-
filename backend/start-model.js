const express = require('express');
const cors = require('cors');
const multer = require('multer');
const OpenAI = require('openai');
const fs = require('fs');
const path = require('path');
const guardianResolve = require('./guardianResolve');
const { RISK_CALIBRATION_RULES, normalizeAnalysisRisk } = require('./riskLevelNormalize');
require('dotenv').config();
const axios = require('axios');
const ffmpeg = require('fluent-ffmpeg');
ffmpeg.setFfmpegPath(path.join(__dirname, 'ffmpeg.exe'));
const knowledgeRepository = require('./storage/knowledgeRepository');
const reportRepository = require('./storage/reportRepository');
const riskEventRepository = require('./storage/riskEventRepository');
const notificationRepository = require('./storage/notificationRepository');
const userRepository = require('./storage/userRepository');

const app = express();
const PORT = process.env.PORT || 7007;
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
  'audio/x-pn-wav': true,
  'audio/ogg': true,
  'audio/webm': true,
  'audio/mp4': true,
  'audio/x-m4a': true,
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

// ==================== 1. 跨域配置 ====================
app.use(cors({
  origin: ['http://localhost:8008', 'http://127.0.0.1:8008'],
  credentials: false,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));

// ==================== 2. 文件上传配置 ====================
const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: 50 * 1024 * 1024 }
});

// 确保目录存在
if (!fs.existsSync('uploads')) fs.mkdirSync('uploads');
if (!fs.existsSync('data')) fs.mkdirSync('data', { recursive: true });
if (!fs.existsSync('uploads/images')) fs.mkdirSync('uploads/images', { recursive: true });
if (!fs.existsSync('uploads/frames')) fs.mkdirSync('uploads/frames', { recursive: true });

// ==================== 3. 模型配置 ====================
const DEFAULT_MODEL = process.env.DEFAULT_MODEL || 'qwen';
console.log(`📢 正在启动服务，默认模型: ${DEFAULT_MODEL}`);

// 模型配置对象
const modelConfigs = {
  deepseek: {
    apiKey: process.env.DEEPSEEK_API_KEY,
    apiUrl: process.env.DEEPSEEK_API_URL,
    model: process.env.DEEPSEEK_MODEL,
    type: 'deepseek'
  },
  qwen: {
    apiKey: process.env.QWEN_API_KEY,
    apiUrl: process.env.QWEN_API_URL,
    model: process.env.QWEN_MODEL,
    type: 'openai-compatible'
  },
  gpt: {
    apiKey: process.env.GPT_API_KEY,
    apiUrl: process.env.GPT_API_URL,
    model: process.env.GPT_MODEL,
    type: 'openai-compatible'
  },
  claude: {
    apiKey: process.env.CLAUDE_API_KEY,
    apiUrl: process.env.CLAUDE_API_URL,
    model: process.env.CLAUDE_MODEL,
    type: 'claude'
  }
};

// 验证模型配置
function validateModelConfig(model) {
  const config = modelConfigs[model];
  if (!config) {
    console.error(`❌ 错误：模型 ${model} 配置不存在`);
    return false;
  }
  if (!config.apiKey || config.apiKey === 'your-api-key') {
    console.error(`❌ 错误：请在.env文件中配置有效的 ${model.toUpperCase()}_API_KEY`);
    return false;
  }
  return true;
}

// 初始化模型客户端
let modelClient = null;
let currentModel = DEFAULT_MODEL;

function initModelClient(model) {
  if (!validateModelConfig(model)) {
    process.exit(1);
  }
  
  const config = modelConfigs[model];
  
  if (config.type === 'openai-compatible') {
    modelClient = new OpenAI({
      apiKey: config.apiKey,
      baseURL: config.apiUrl,
      timeout: 60000,
      maxRetries: 3
    });
  } else if (config.type === 'deepseek') {
    // DeepSeek 使用 axios 直接调用
    modelClient = {
      type: 'deepseek',
      config: config
    };
  } else if (config.type === 'claude') {
    // Claude 使用 axios 直接调用
    modelClient = {
      type: 'claude',
      config: config
    };
  }
  
  currentModel = model;
  console.log(`✅ 已初始化模型客户端: ${model} (${config.model})`);
}

// 初始化默认模型
initModelClient(DEFAULT_MODEL);

// 校验文件类型
function validateFileType(mimetype, originalname = '') {
  if (ALLOWED_MIME_TYPES[mimetype]) return true;
  // 微信/部分手机上传时 mime 可能不稳定，使用扩展名兜底
  const ext = path.extname(String(originalname || '')).toLowerCase();
  if (ext && ALLOWED_EXTENSIONS[ext]) return true;
  return false;
}

// ==================== 4. 文件安全过滤中间件 ====================
function fileSecurityFilter(req, res, next) {
  if (!req.file) {
    return next();
  }
  const { mimetype, originalname, size } = req.file;

  // 1. 校验文件类型
  if (!validateFileType(mimetype, originalname)) {
    // 删除已上传的非法文件
    fs.unlink(req.file.path, (err) => {
      if (err) console.error('删除非法文件失败:', err);
    });
    return res.status(400).json({
      success: false,
      error: `不支持的文件类型: ${mimetype}，仅允许图片、音频、视频文件`
    });
  }

  // 2. 校验文件名（防路径穿越）
  if (originalname.includes('..') || originalname.includes('/') || originalname.includes('\\')) {
    return res.status(400).json({
      success: false,
      error: '文件名非法'
    });
  }

  // 3. 校验文件大小（非空）
  if (size === 0) {
    fs.unlink(req.file.path, (err) => {
      if (err) console.error('删除空文件失败:', err);
    });
    return res.status(400).json({
      success: false,
      error: '上传文件为空，请重新上传'
    });
  }

  next();
}

// ==================== 5. 模型调用函数 ====================
async function callModelChat(message, model = currentModel) {
  const config = modelConfigs[model];
  
  if (config.type === 'openai-compatible') {
    const completion = await modelClient.chat.completions.create({
      model: config.model,
      messages: [
        {
          role: 'system',
          content: '你是专业的反诈智能助手，专注于电信诈骗识别、防范知识解答，回答专业、易懂、友好。'
        },
        { role: 'user', content: message }
      ],
      temperature: 0.7,
      max_tokens: 2048
    });
    
    if (!completion?.choices?.[0]?.message?.content) {
      throw new Error(`${model} 返回空响应`);
    }
    
    return completion.choices[0].message.content;
  } else if (config.type === 'deepseek') {
    const response = await axios.post(
      config.apiUrl,
      {
        model: config.model,
        messages: [
          {
            role: 'system',
            content: '你是专业的反诈智能助手，专注于电信诈骗识别、防范知识解答，回答专业、易懂、友好。'
          },
          {
            role: 'user',
            content: message
          }
        ],
        temperature: 0.7,
        max_tokens: 1000
      },
      {
        headers: {
          'Authorization': `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (!response.data.choices?.[0]?.message?.content) {
      throw new Error('DeepSeek 返回空响应');
    }
    
    let content = response.data.choices[0].message.content;
    content = content.replace(/\*\*/g, '');
    return content;
  } else if (config.type === 'claude') {
    const response = await axios.post(
      `${config.apiUrl}/messages`,
      {
        model: config.model,
        messages: [
          {
            role: 'user',
            content: message
          }
        ],
        system: '你是专业的反诈智能助手，专注于电信诈骗识别、防范知识解答，回答专业、易懂、友好。',
        max_tokens: 2048
      },
      {
        headers: {
          'x-api-key': config.apiKey,
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (!response.data.content?.[0]?.text) {
      throw new Error('Claude 返回空响应');
    }
    
    return response.data.content[0].text;
  }
  
  throw new Error(`不支持的模型类型: ${config.type}`);
}

async function callModelAnalysis(content, type = 'text', model = currentModel) {
  const config = modelConfigs[model];
  
  if (config.type === 'openai-compatible') {
    let messages = [
      {
        role: 'system',
        content: `你是专业反诈分析助手。
请严格只返回JSON格式，不要任何多余内容、markdown、反引号、注释、说明。
必须包含字段：
risk_level: high/medium/low
confidence: 0~1
reasons: 字符串数组
suggestions: 字符串数组
summary: 字符串
只返回JSON，不要任何其他字符。

${RISK_CALIBRATION_RULES}`
      }
    ];
    
    if (type === 'text') {
      messages.push({
        role: 'user',
        content: `分析以下文本是否存在电信诈骗风险，并按照要求返回JSON：
${content}`
      });
    } else if (type === 'image') {
      messages.push({
        role: 'user',
        content: [
          { type: 'text', text: '分析这张图片是否存在电信诈骗风险' },
          { type: 'image_url', image_url: { url: content } }
        ]
      });
    }
    
    const completion = await modelClient.chat.completions.create({
      model: config.model,
      messages: messages,
      temperature: 0.05,
      max_tokens: 1500
    });
    
    if (!completion?.choices?.[0]?.message?.content) {
      throw new Error(`${model} 返回空响应`);
    }
    
    let raw = completion.choices[0].message.content.trim();
    raw = raw.replace(/^```json\s*/, '').replace(/\s*```$/, '').trim();
    raw = raw.replace(/^`+|`+$/g, '').trim();
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    const cleanContent = jsonMatch ? jsonMatch[0] : raw;
    let analysis;
    try {
      analysis = JSON.parse(cleanContent);
    } catch (e) {
      console.error('解析 openai-compatible 分析 JSON 失败:', e);
      analysis = {
        risk_level: 'medium',
        confidence: 0.5,
        reasons: ['模型返回格式异常'],
        suggestions: ['请人工复核内容'],
        summary: '分析结果解析失败'
      };
    }
    return normalizeAnalysisRisk(analysis);
  } else if (config.type === 'deepseek') {
    const response = await axios.post(
      config.apiUrl,
      {
        model: config.model,
        messages: [
          {
            role: 'system',
            content: `你是专业的反诈骗分析助手。请对用户提供的内容进行诈骗风险分析，输出 JSON 格式，包含以下字段：
- risk_level: 字符串，可选值 "high", "medium", "low"
- confidence: 数值，0-1 表示置信度
- reasons: 字符串数组，列出检测到的风险点
- suggestions: 字符串数组，给出防范建议
- summary: 字符串，简要总结

${RISK_CALIBRATION_RULES}`
          },
          {
            role: 'user',
            content: `请分析以下内容是否存在诈骗风险：\n\n${content}`
          }
        ],
        temperature: 0.7,
        max_tokens: 1000
      },
      {
        headers: {
          'Authorization': `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    const responseContent = response.data.choices[0].message.content;
    const jsonMatch = responseContent.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return normalizeAnalysisRisk(JSON.parse(jsonMatch[0]));
    } else {
      return normalizeAnalysisRisk({
        risk_level: 'medium',
        confidence: 0.8,
        reasons: ['无法解析具体风险点'],
        suggestions: ['请谨慎对待此信息'],
        summary: responseContent.substring(0, 200)
      });
    }
  } else if (config.type === 'claude') {
    const response = await axios.post(
      `${config.apiUrl}/messages`,
      {
        model: config.model,
        messages: [
          {
            role: 'user',
            content: `分析以下内容是否存在电信诈骗风险，并按照要求返回JSON：
${content}`
          }
        ],
        system: `你是专业反诈分析助手。
请严格只返回JSON格式，不要任何多余内容、markdown、反引号、注释、说明。
必须包含字段：
risk_level: high/medium/low
confidence: 0~1
reasons: 字符串数组
suggestions: 字符串数组
summary: 字符串
只返回JSON，不要任何其他字符。

${RISK_CALIBRATION_RULES}`,
        max_tokens: 1500
      },
      {
        headers: {
          'x-api-key': config.apiKey,
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (!response.data.content?.[0]?.text) {
      throw new Error('Claude 返回空响应');
    }
    
    let raw = response.data.content[0].text.trim();
    raw = raw.replace(/^```json\s*/, '').replace(/\s*```$/, '').trim();
    raw = raw.replace(/^`+|`+$/g, '').trim();
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    const cleanContent = jsonMatch ? jsonMatch[0] : raw;
    let analysis;
    try {
      analysis = JSON.parse(cleanContent);
    } catch (e) {
      analysis = {
        risk_level: 'medium',
        confidence: 0.5,
        reasons: ['Claude 返回解析失败'],
        suggestions: ['请人工复核'],
        summary: '分析解析异常'
      };
    }
    return normalizeAnalysisRisk(analysis);
  }
  
  throw new Error(`不支持的模型类型: ${config.type}`);
}

function parseModelJsonSafely(rawContent) {
  try {
    let raw = String(rawContent || '').trim();
    raw = raw.replace(/^```json\s*/, '').replace(/\s*```$/, '').trim();
    raw = raw.replace(/^`+|`+$/g, '').trim();
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    const cleanContent = jsonMatch ? jsonMatch[0] : raw;
    return normalizeAnalysisRisk(JSON.parse(cleanContent));
  } catch (err) {
    console.error('解析模型JSON失败:', err);
    return normalizeAnalysisRisk({
      risk_level: 'medium',
      confidence: 0.5,
      reasons: ['模型返回格式异常'],
      suggestions: ['请人工复核内容'],
      summary: '分析结果解析失败'
    });
  }
}

async function analyzeAudioWithModel(audioDataUrl, audioTranscript = '', model = currentModel) {
  const config = modelConfigs[model];
  if (!config) {
    throw new Error(`模型 ${model} 配置不存在`);
  }

  if (config.type === 'openai-compatible') {
    const completion = await modelClient.chat.completions.create({
      model: config.model,
      messages: [
        {
          role: 'system',
          content: `你是专业反诈音频分析助手。
请严格只返回JSON格式，不要任何多余内容。
必须包含字段：
- risk_level: high/medium/low
- confidence: 0~1
- reasons: 字符串数组（诈骗话术、诱导转账等风险点）
- suggestions: 字符串数组（防范建议）
- summary: 字符串（简要总结）
只返回JSON，不要任何其他字符。

${RISK_CALIBRATION_RULES}`
        },
        {
          role: 'user',
          content: [
            {
              type: 'input_audio',
              input_audio: {
                data: audioDataUrl,
                format: 'wav'
              }
            },
            {
              type: 'text',
              text: audioTranscript
                ? `请结合音频和以下转写文本进行反诈分析：\n${audioTranscript}`
                : '请直接分析这段音频中的诈骗风险，如内容不清晰请明确说明不确定性。'
            }
          ]
        }
      ],
      temperature: 0.05,
      max_tokens: 1800
    });

    if (!completion?.choices?.[0]?.message?.content) {
      throw new Error(`${model} 返回空响应`);
    }
    return parseModelJsonSafely(completion.choices[0].message.content);
  }

  if (audioTranscript) {
    return callModelAnalysis(audioTranscript, 'text', model);
  }

  return normalizeAnalysisRisk({
    risk_level: 'medium',
    confidence: 0.5,
    reasons: ['当前模型暂不支持直接音频输入，且音频转写失败'],
    suggestions: ['请切换支持语音的模型，或上传更清晰的音频'],
    summary: '音频可读性不足，无法完成有效风险评估'
  });
}

// ==================== 7. 核心API端点 ====================

// 健康检查端点
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: '后端服务运行正常',
    currentModel: currentModel,
    availableModels: Object.keys(modelConfigs)
  });
});

// 模型切换端点
app.post('/api/model/switch', express.json(), (req, res) => {
  const { model } = req.body;
  
  if (!model || !modelConfigs[model]) {
    return res.status(400).json({
      success: false,
      error: `无效的模型名称。可用模型: ${Object.keys(modelConfigs).join(', ')}`
    });
  }
  
  if (!validateModelConfig(model)) {
    return res.status(400).json({
      success: false,
      error: `模型 ${model} 配置无效，请检查.env文件`
    });
  }
  
  try {
    initModelClient(model);
    res.json({
      success: true,
      message: `已成功切换到模型: ${model}`,
      currentModel: currentModel
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: `切换模型失败: ${error.message}`
    });
  }
});

// 智能助手问答端点
app.post('/api/chat', async (req, res) => {
  try {
    const { message, model } = req.body;
    // 参数校验
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ success: false, error: '缺少有效message' });
    }

    console.log(`[AI对话] 用户提问：${message.substring(0, 100)}...`);

    // 调用模型
    const reply = await callModelChat(message, model || currentModel);
    res.json({
      success: true,
      reply,
      timestamp: new Date().toISOString(),
      model: model || currentModel
    });

  } catch (error) {
    console.error('[AI对话] 错误详情：', error);
    res.status(500).json({
      success: false,
      error: 'AI服务暂时不可用，请稍后重试',
      details: error.message
    });
  }
});

// 文本分析端点
app.post('/api/analyze/text', async (req, res) => {
  try {
    const { text, model } = req.body;

    // 1. 参数校验
    if (!text || typeof text !== 'string' || text.trim() === '') {
      return res.status(400).json({
        success: false,
        error: '请输入有效的文本内容'
      });
    }

    console.log(`📝 开始AI分析文本: ${text.substring(0, 100)}...`);

    // 2. 调用模型分析
    const analysis = await callModelAnalysis(text, 'text', model || currentModel);

    // 3. 返回结果
    res.json({
      success: true,
      analysis: analysis,
      text: {
        length: text.length,
        preview: text.substring(0, 200) + (text.length > 200 ? '...' : '')
      },
      model: model || currentModel
    });

  } catch (err) {
    console.error("❌ 文本AI分析失败:", err);
    res.status(500).json({
      success: false,
      error: "文本AI分析失败",
      details: err.message
    });
  }
});

// 图片分析端点
app.post('/api/analyze/image', upload.single('image'), fileSecurityFilter, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: '未上传图片' });
    }

    // 生成唯一文件名
    const uniqueFileName = `${Date.now()}_${req.file.originalname.replace(/\s+/g, '_')}`;
    const savePath = path.join(__dirname, 'uploads/images', uniqueFileName);

    // 移动文件
    fs.renameSync(req.file.path, savePath);
    const imageUrl = `/uploads/images/${uniqueFileName}`;

    console.log("🖼️ 开始分析图片:", savePath);

    // 转 base64
    const imageBuffer = fs.readFileSync(savePath);
    const imageBase64 = `data:${req.file.mimetype};base64,${imageBuffer.toString('base64')}`;

    // 调用模型
    const analysis = await callModelAnalysis(imageBase64, 'image', req.body.model || currentModel);

    res.json({
      success: true,
      file: {
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        url: imageUrl
      },
      analysis: analysis,
      model: req.body.model || currentModel
    });

  } catch (err) {
    console.error("❌ 图片分析失败:", err);
    res.status(500).json({
      success: false,
      error: "图片分析失败",
      details: err.message
    });
  }
});

// 音频分析端点
app.post('/api/analyze/audio', upload.single('audio'), fileSecurityFilter, async (req, res) => {
  let standardizedAudioPath = '';
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: '未上传音频' });
    }

    const audioPath = path.join(__dirname, req.file.path);
    console.log("🎵 开始AI分析音频:", audioPath);

    // 1. 音频转文字
    let audioText = "";
    const targetModel = req.body.model || currentModel;
    const targetConfig = modelConfigs[targetModel];
    try {
      if (targetConfig?.type === 'openai-compatible') {
        const transcribeResponse = await modelClient.audio.transcriptions.create({
          file: fs.createReadStream(audioPath),
          model: "whisper-1",
          response_format: "text"
        });
        audioText = transcribeResponse || "";
        console.log("🎤 音频转文字结果:", audioText.substring(0, 100) + "...");
      } else {
        // 其他模型暂时使用模拟转文字
        audioText = "音频内容需要分析";
      }
    } catch (transErr) {
      console.error("音频转文字失败，将直接分析音频文件:", transErr);
    }

    // 2. 音频标准化后，优先做“音频直传分析 + 转写兜底”
    let finalAudioPath = audioPath;
    standardizedAudioPath = `${audioPath}_standard.wav`;
    try {
      await new Promise((resolve, reject) => {
        ffmpeg(audioPath)
          .audioCodec('pcm_s16le')
          .audioChannels(1)
          .audioFrequency(16000)
          .audioBitrate(128)
          .format('wav')
          .on('end', resolve)
          .on('error', reject)
          .save(standardizedAudioPath);
      });
      if (fs.existsSync(standardizedAudioPath)) {
        finalAudioPath = standardizedAudioPath;
      }
    } catch (audioConvertErr) {
      console.warn('音频标准化失败，回退原文件:', audioConvertErr.message);
    }

    const audioBuffer = fs.readFileSync(finalAudioPath);
    const audioDataUrl = `data:audio/wav;base64,${audioBuffer.toString('base64')}`;
    const analysis = await analyzeAudioWithModel(audioDataUrl, audioText, targetModel);

    // 3. 返回结果
    res.json({
      success: true,
      file: {
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        url: `/uploads/${req.file.filename}`
      },
      analysis: analysis,
      transcription: audioText,
      model: targetModel
    });

  } catch (err) {
    console.error("❌ 音频AI分析失败:", err);
    res.json({
      success: true,
      file: req.file ? {
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        url: `/uploads/${req.file.filename}`
      } : null,
      analysis: normalizeAnalysisRisk({
        risk_level: 'medium',
        confidence: 0.5,
        reasons: ['音频AI服务连接异常，未能完成完整语音识别'],
        suggestions: ['请检查网络后重试，或更换更清晰的音频文件'],
        summary: '音频内容解析异常，本次结果为保守评估'
      }),
      transcription: '',
      model: req.body?.model || currentModel,
      degraded: true,
      degradedReason: err.message || '音频AI分析失败'
    });
  } finally {
    if (standardizedAudioPath && fs.existsSync(standardizedAudioPath)) {
      fs.unlinkSync(standardizedAudioPath);
    }
  }
});

// 视频分析端点
app.post('/api/analyze/video', upload.single('video'), fileSecurityFilter, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: '未上传视频' });
    }

    const videoPath = path.join(__dirname, req.file.path);
    console.log("🎬 开始AI分析视频:", videoPath);

    // 1. 提取视频关键帧
    const frameDir = path.join(__dirname, 'uploads/frames', req.file.filename);
    if (!fs.existsSync(frameDir)) fs.mkdirSync(frameDir, { recursive: true });

    // 生成关键帧
    await new Promise((resolve, reject) => {
      ffmpeg(videoPath)
        .on('end', resolve)
        .on('error', reject)
        .fps(0.2) // 每5秒1帧
        .frames(5) // 最多5帧
        .output(path.join(frameDir, 'frame-%03d.jpg'))
        .run();
    });

    // 2. 读取关键帧并转为base64
    const frameFiles = fs.readdirSync(frameDir).filter(f => f.endsWith('.jpg'));
    if (frameFiles.length === 0) {
      throw new Error('视频关键帧提取失败');
    }
    const firstFramePath = path.join(frameDir, frameFiles[0]);
    const frameBuffer = fs.readFileSync(firstFramePath);
    const base64Frame = `data:image/jpeg;base64,${frameBuffer.toString('base64')}`;

    // 3. 调用模型分析
    const analysis = await callModelAnalysis(base64Frame, 'image', req.body.model || currentModel);

    // 4. 返回结果
    res.json({
      success: true,
      file: {
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        url: `/uploads/${req.file.filename}`
      },
      analysis: analysis,
      frames: {
        count: frameFiles.length,
        path: `/uploads/frames/${req.file.filename}`
      },
      model: req.body.model || currentModel
    });

  } catch (err) {
    console.error("❌ 视频AI分析失败:", err);
    res.status(500).json({
      success: false,
      error: "视频AI分析失败",
      details: err.message
    });
  }
});

// ==================== 8. 报告和知识库端点 ====================

// 报告存储
const REPORTS_FILE = path.join(__dirname, '../data/reports.json');
const KNOWLEDGE_FILE = path.join(__dirname, '../data/knowledge.json');
const USERS_FILE = path.join(__dirname, '../data/users.json');
const RISK_EVENTS_FILE = path.join(__dirname, '../data/risk-events.json');
const NOTIFICATIONS_FILE = path.join(__dirname, '../data/notifications.json');
const GUARDIAN_LINKS_FILE = path.join(__dirname, '../data/guardian-links.json');

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

function normalizeReportAuthorEmail(email) {
  return String(email || '').trim().toLowerCase();
}

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

let knowledge = loadKnowledge();
let reports = loadReports();
let users = loadUsers();
let riskEvents = loadRiskEvents();
let notifications = loadNotifications();

function filterKnowledgeItems(items, filters = {}) {
  let filtered = Array.isArray(items) ? [...items] : [];
  const { category, source, search } = filters;
  if (category && category !== '全部') {
    filtered = filtered.filter(item => item.category === category);
  }
  if (source && source !== '全部') {
    filtered = filtered.filter(item => item.source === source);
  }
  if (search) {
    const query = String(search).toLowerCase();
    filtered = filtered.filter(item =>
      String(item.title || '').toLowerCase().includes(query) ||
      String(item.description || '').toLowerCase().includes(query) ||
      String(item.content || '').toLowerCase().includes(query)
    );
  }
  return filtered;
}

async function loadKnowledgeForRequest(filters = {}) {
  if (knowledgeRepository.mysqlEnabled()) {
    try {
      const items = await knowledgeRepository.list(filters);
      if (!filters.category && !filters.source && !filters.search) {
        knowledge = items;
      }
      return items;
    } catch (error) {
      console.error('MySQL 知识库读取失败，回退 JSON:', error.message);
    }
  }
  return filterKnowledgeItems(knowledge, filters);
}

async function syncKnowledgeSnapshot() {
  if (!knowledgeRepository.mysqlEnabled()) return;
  try {
    knowledge = await knowledgeRepository.list();
    saveKnowledge(knowledge);
  } catch (error) {
    console.error('MySQL 知识库同步到 JSON 失败:', error.message);
  }
}

async function loadReportsForRequest() {
  if (reportRepository.mysqlEnabled()) {
    try {
      reports = await reportRepository.list();
      return reports;
    } catch (error) {
      console.error('MySQL 报告读取失败，回退 JSON:', error.message);
    }
  }
  reports = loadReports();
  return Array.isArray(reports) ? reports : [];
}

async function findReportForRequest(id) {
  if (reportRepository.mysqlEnabled()) {
    try {
      const report = await reportRepository.findById(id);
      if (report) return report;
    } catch (error) {
      console.error('MySQL 报告详情读取失败，回退 JSON:', error.message);
    }
  }
  reports = Array.isArray(reports) && reports.length ? reports : loadReports();
  return reports.find(r => String(r.id) === String(id)) || null;
}

async function loadRiskEventsForRequest() {
  if (riskEventRepository.mysqlEnabled()) {
    try {
      riskEvents = await riskEventRepository.list();
      return riskEvents;
    } catch (error) {
      console.error('MySQL 风险事件读取失败，回退 JSON:', error.message);
    }
  }
  riskEvents = loadRiskEvents();
  return Array.isArray(riskEvents) ? riskEvents : [];
}

async function createRiskEventForRequest(input) {
  if (riskEventRepository.mysqlEnabled()) {
    try {
      const saved = await riskEventRepository.create(input);
      riskEvents = await riskEventRepository.list();
      saveRiskEvents(riskEvents);
      return saved;
    } catch (error) {
      console.error('MySQL 风险事件写入失败，回退 JSON:', error.message);
    }
  }

  riskEvents = Array.isArray(riskEvents) && riskEvents.length ? riskEvents : loadRiskEvents();
  const nextId = riskEvents.length > 0 ? Math.max(...riskEvents.map(item => item.id || 0)) + 1 : 1;
  const event = {
    ...input,
    id: input.id || nextId
  };
  riskEvents.push(event);
  saveRiskEvents(riskEvents);
  return event;
}

async function loadNotificationsForRequest() {
  if (notificationRepository.mysqlEnabled()) {
    try {
      notifications = await notificationRepository.list();
      return notifications;
    } catch (error) {
      console.error('MySQL 通知读取失败，回退 JSON:', error.message);
    }
  }
  notifications = loadNotifications();
  return Array.isArray(notifications) ? notifications : [];
}

async function createNotificationForRequest(input) {
  if (notificationRepository.mysqlEnabled()) {
    try {
      const saved = await notificationRepository.create(input);
      notifications = await notificationRepository.list();
      saveNotifications(notifications);
      return saved;
    } catch (error) {
      console.error('MySQL 通知写入失败，回退 JSON:', error.message);
    }
  }

  notifications = Array.isArray(notifications) && notifications.length ? notifications : loadNotifications();
  const nextId = notifications.length > 0 ? Math.max(...notifications.map(item => item.id || 0)) + 1 : 1;
  const item = {
    ...input,
    id: input.id || nextId
  };
  notifications.push(item);
  saveNotifications(notifications);
  return item;
}

async function loadUsersForRequest() {
  if (userRepository.mysqlEnabled()) {
    try {
      users = await userRepository.list();
      return users;
    } catch (error) {
      console.error('MySQL 用户读取失败，回退 JSON:', error.message);
    }
  }
  users = loadUsers();
  return Array.isArray(users) ? users : [];
}

async function syncUsersSnapshot() {
  if (!userRepository.mysqlEnabled()) return;
  try {
    users = await userRepository.list();
    saveUsers(users);
  } catch (error) {
    console.error('MySQL 用户同步到 JSON 失败:', error.message);
  }
}

async function findUserForRequest(email) {
  const normalized = userRepository.normalizeEmail(email);
  if (userRepository.mysqlEnabled()) {
    try {
      const user = await userRepository.findByEmail(normalized);
      if (user) return user;
    } catch (error) {
      console.error('MySQL 用户查询失败，回退 JSON:', error.message);
    }
  }
  await loadUsersForRequest();
  return users.find((u) => userRepository.normalizeEmail(u.email) === normalized) || null;
}

function parseRegisterRole(role) {
  let userType = '用户';
  let roleDetail = role || '普通用户';
  if (role && String(role).includes(' - ')) {
    const parts = String(role).split(' - ');
    userType = parts[0];
    roleDetail = parts[1];
  }
  if (role && String(role).includes('监护人')) {
    userType = '监护人';
  }
  return { userType, roleDetail };
}

// ==================== 8.1 认证端点 ====================
app.post('/api/auth/login', express.json(), async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ success: false, error: '缺少邮箱或密码' });
  }

  const user = await findUserForRequest(email);
  if (!user) {
    return res.status(401).json({ success: false, error: '邮箱或密码错误' });
  }

  if (!userRepository.passwordsMatch(user.password, password)) {
    return res.status(401).json({ success: false, error: '邮箱或密码错误' });
  }

  return res.json({
    success: true,
    user: userRepository.toPublicUser(user),
    message: '登录成功'
  });
});

app.post('/api/auth/register', express.json(), async (req, res) => {
  const { name, email, password, phone, role } = req.body || {};
  if (!name || !email || !password || !phone) {
    return res.status(400).json({ success: false, error: '缺少必要字段' });
  }

  const emailNorm = userRepository.normalizeEmail(email);
  const existing = await findUserForRequest(emailNorm);
  if (existing) {
    return res.status(400).json({ success: false, error: '邮箱已被注册' });
  }

  const { userType, roleDetail } = parseRegisterRole(role);
  const now = new Date().toISOString();
  await loadUsersForRequest();
  const newUser = {
    id: users.length > 0 ? Math.max(...users.map((u) => u.id || 0)) + 1 : 1,
    username: String(email).split('@')[0],
    password,
    email: emailNorm,
    phone,
    name,
    userType,
    role: roleDetail,
    riskLevel: '低风险',
    bio: '',
    createdAt: now,
    updatedAt: now
  };

  if (userRepository.mysqlEnabled()) {
    try {
      const saved = await userRepository.create(newUser);
      await syncUsersSnapshot();
      return res.json({
        success: true,
        user: userRepository.toPublicUser(saved),
        message: '注册成功'
      });
    } catch (error) {
      console.error('MySQL 用户注册失败，回退 JSON:', error.message);
    }
  }

  users.push(newUser);
  saveUsers(users);

  return res.json({
    success: true,
    user: userRepository.toPublicUser(newUser),
    message: '注册成功'
  });
});

app.put('/api/auth/user', express.json(), async (req, res) => {
  try {
    const body = req.body || {};
    const originalEmail = userRepository.normalizeEmail(body.originalEmail || body.email);
    if (!originalEmail) {
      return res.status(400).json({ success: false, error: '缺少邮箱' });
    }

    const existing = await findUserForRequest(originalEmail);
    if (!existing) {
      return res.status(404).json({ success: false, error: '用户不存在' });
    }

    const nextEmail = body.newEmail
      ? userRepository.normalizeEmail(body.newEmail)
      : userRepository.normalizeEmail(body.email) || originalEmail;
    if (nextEmail !== originalEmail) {
      const conflict = await findUserForRequest(nextEmail);
      if (conflict) {
        return res.status(400).json({ success: false, error: '该邮箱已被使用' });
      }
    }

    const patch = {
      name: body.name !== undefined ? body.name : existing.name,
      phone: body.phone !== undefined ? body.phone : existing.phone,
      bio: body.bio !== undefined ? body.bio : existing.bio,
      userType: body.userType !== undefined ? body.userType : existing.userType,
      role: body.role !== undefined ? body.role : existing.role,
      riskLevel: body.riskLevel !== undefined ? body.riskLevel : existing.riskLevel,
      email: nextEmail
    };
    if (body.password) {
      patch.password = body.password;
    }

    if (userRepository.mysqlEnabled()) {
      try {
        const saved = await userRepository.updateByEmail(originalEmail, patch);
        if (!saved) {
          return res.status(404).json({ success: false, error: '用户不存在' });
        }
        await syncUsersSnapshot();
        return res.json({
          success: true,
          user: userRepository.toPublicUser(saved),
          message: '资料已更新'
        });
      } catch (error) {
        console.error('MySQL 用户更新失败，回退 JSON:', error.message);
      }
    }

    const index = users.findIndex(
      (u) => userRepository.normalizeEmail(u.email) === originalEmail
    );
    if (index < 0) {
      return res.status(404).json({ success: false, error: '用户不存在' });
    }
    users[index] = {
      ...users[index],
      ...patch,
      updatedAt: new Date().toISOString()
    };
    saveUsers(users);

    return res.json({
      success: true,
      user: userRepository.toPublicUser(users[index]),
      message: '资料已更新'
    });
  } catch (error) {
    console.error('更新用户失败:', error);
    return res.status(500).json({
      success: false,
      error: '更新用户失败',
      detail: error.message
    });
  }
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

// 账号注销（删除用户及关联数据）
app.delete('/api/auth/user', express.json(), async (req, res) => {
  try {
    const userEmail = userRepository.normalizeEmail(req.body?.email || req.query?.email);
    if (!userEmail) {
      return res.status(400).json({ success: false, error: '缺少邮箱' });
    }

    const removedUser = await findUserForRequest(userEmail);
    if (!removedUser) {
      return res.status(404).json({ success: false, error: '用户不存在' });
    }

    if (userRepository.mysqlEnabled()) {
      try {
        const ok = await userRepository.removeByEmail(userEmail);
        if (!ok) {
          return res.status(404).json({ success: false, error: '用户不存在' });
        }
        await syncUsersSnapshot();
        reports = await loadReportsForRequest();
        saveReports(reports);
        riskEvents = await loadRiskEventsForRequest();
        saveRiskEvents(riskEvents);
        notifications = await loadNotificationsForRequest();
        saveNotifications(notifications);
        const links = guardianResolve.loadGuardianLinks(fs, GUARDIAN_LINKS_FILE);
        const nextLinks = (Array.isArray(links) ? links : []).filter((link) => {
          const g = userRepository.normalizeEmail(link.guardianEmail);
          const w = userRepository.normalizeEmail(link.wardEmail);
          return g !== userEmail && w !== userEmail;
        });
        guardianResolve.saveGuardianLinks(fs, GUARDIAN_LINKS_FILE, nextLinks);
        return res.json({
          success: true,
          message: '账号已注销',
          removedUser: {
            id: removedUser.id,
            email: removedUser.email,
            name: removedUser.name
          }
        });
      } catch (error) {
        console.error('MySQL 用户注销失败，回退 JSON:', error.message);
      }
    }

    await loadUsersForRequest();
    const userIndex = users.findIndex(
      (u) => userRepository.normalizeEmail(u.email) === userEmail
    );
    if (userIndex < 0) {
      return res.status(404).json({ success: false, error: '用户不存在' });
    }
    users.splice(userIndex, 1);
    users = userRepository.renumberUsersList(users);
    saveUsers(users);

    const reportsSource = loadReports();
    const reportsSafe = Array.isArray(reportsSource) ? reportsSource : [];
    reports = reportsSafe.filter(
      (r) => userRepository.normalizeEmail(r.authorEmail) !== userEmail
    );
    saveReports(reports);

    const riskEventsSafe = Array.isArray(riskEvents) ? riskEvents : loadRiskEvents();
    riskEvents = (Array.isArray(riskEventsSafe) ? riskEventsSafe : []).filter(
      (e) => userRepository.normalizeEmail(e.userEmail) !== userEmail
    );
    saveRiskEvents(riskEvents);

    const notificationsSafe = Array.isArray(notifications) ? notifications : loadNotifications();
    notifications = (Array.isArray(notificationsSafe) ? notificationsSafe : []).filter(
      (n) => userRepository.normalizeEmail(n.to) !== userEmail
    );
    saveNotifications(notifications);

    const links = guardianResolve.loadGuardianLinks(fs, GUARDIAN_LINKS_FILE);
    const nextLinks = (Array.isArray(links) ? links : []).filter((link) => {
      const g = userRepository.normalizeEmail(link.guardianEmail);
      const w = userRepository.normalizeEmail(link.wardEmail);
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

// 生成报告（与 server.js 一致：持久化生成者邮箱/姓名，便于列表与监护人汇总）
app.post('/api/reports', express.json(), async (req, res) => {
  try {
    reports = await loadReportsForRequest();
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

    let savedReport = newReport;
    if (reportRepository.mysqlEnabled()) {
      try {
        savedReport = await reportRepository.create(newReport);
      } catch (error) {
        console.error('MySQL 报告创建失败，回退 JSON:', error.message);
      }
    }
    reports.push(savedReport);
    saveReports(reports);

    res.json({
      success: true,
      report: savedReport,
      message: '报告已生成'
    });
  } catch (err) {
    console.error("❌ 报告生成失败:", err);
    res.status(500).json({
      success: false,
      error: "报告生成失败",
      details: err.message
    });
  }
});

// 获取报告列表
app.get('/api/reports', async (req, res) => {
  reports = await loadReportsForRequest();
  let list = Array.isArray(reports) ? [...reports] : [];
  const viewerEmail = normalizeReportAuthorEmail(req.query.viewerEmail);
  const viewerType = String(req.query.viewerType || '').trim().toLowerCase();

  if (viewerEmail && viewerType === 'guardian') {
    const wards = wardEmailSetForGuardian(viewerEmail);
    list = list.filter((r) => {
      const ae = normalizeReportAuthorEmail(r.authorEmail);
      return ae && wards.has(ae);
    });
  } else if (viewerEmail && (viewerType === 'user' || viewerType === 'ward')) {
    list = list.filter((r) => {
      const ae = normalizeReportAuthorEmail(r.authorEmail);
      return !!ae && ae === viewerEmail;
    });
  } else {
    list = [];
  }

  // 格式化报告数据
  const formattedReports = list.map(report => {
    let originalData = report.content;
    let preview = '';

    if (report.modality === 'image') {
      originalData = report.content;
      preview = `图片：${report.fileInfo?.originalname || '未知图片'} (${report.fileInfo?.size ? (report.fileInfo.size / 1024).toFixed(2) : 0}KB)`;
    } else if (report.modality === 'text') {
      originalData = report.content;
      preview = report.content.substring(0, 200) + (report.content.length > 200 ? '...' : '');
    } else {
      preview = `[${report.modality}] 原始数据`;
    }

    return {
      ...report,
      originalData,
      preview
    };
  });

  res.json({
    success: true,
    reports: formattedReports
  });
});

// 删除单份报告（仅本人或监护人可删）
app.delete('/api/reports/:id', express.json(), async (req, res) => {
  reports = await loadReportsForRequest();
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
  if (reportRepository.mysqlEnabled()) {
    try {
      await reportRepository.remove(idParam);
    } catch (error) {
      console.error('MySQL 报告删除失败，仅更新 JSON:', error.message);
    }
  }
  saveReports(reports);
  res.json({
    success: true,
    message: '报告删除成功',
    removed
  });
});

// 下载报告为TXT文件
app.get('/api/reports/:id/download', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const report = await findReportForRequest(id);
    if (!report) {
      return res.status(404).json({ error: '报告不存在' });
    }

    // 确保 risks 和 actions 是数组
    const risks = Array.isArray(report.risks) ? report.risks : [];
    const actions = Array.isArray(report.actions) ? report.actions : [];

    // 处理不同类型的原始内容
    let contentText = '';
    if (report.modality === 'image') {
      contentText = `图片URL：${report.content || '未知'}\n` +
        `文件名：${report.fileInfo?.originalname || '未知'}\n` +
        `文件类型：${report.fileInfo?.mimetype || '未知'}\n` +
        `文件大小：${(report.fileInfo?.size / 1024).toFixed(2) || 0} KB`;
    } else {
      contentText = report.content || '无';
    }

    // 构造TXT内容
    const txtContent = `安全报告
==========

标题: ${report.title}
风险等级: ${report.severity}
数据类型: ${report.modality}
日期: ${report.date}

风险点:
${risks.map(r => '- ' + r).join('\n') || '- 无'}

建议措施:
${actions.map(a => '- ' + a).join('\n') || '- 无'}

摘要: ${report.summary || '无'}

原始数据:
${contentText}`;

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
app.get('/api/knowledge', async (req, res) => {
  const { category, source, search } = req.query;
  const filtered = await loadKnowledgeForRequest({ category, source, search });
  res.json({
    success: true,
    items: filtered,
    total: filtered.length
  });
});

// 获取单个知识条目
app.get('/api/knowledge/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  let item = null;
  if (knowledgeRepository.mysqlEnabled()) {
    try {
      item = await knowledgeRepository.findById(id);
    } catch (error) {
      console.error('MySQL 知识条目读取失败，回退 JSON:', error.message);
    }
  }
  if (!item) {
    item = knowledge.find(item => item.id === id);
  }
  if (!item) {
    return res.status(404).json({ success: false, error: '知识条目不存在' });
  }
  res.json({ success: true, item });
});

// 创建知识条目
app.post('/api/knowledge', express.json(), async (req, res) => {
  const { title, description, content, category, source, icon, iconColor } = req.body;
  if (!title || !category || !source) {
    return res.status(400).json({ success: false, error: '缺少必要字段' });
  }
  let newItem = {
    id: knowledge.length > 0 ? Math.max(...knowledge.map(item => item.id || 0)) + 1 : 1,
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
  if (knowledgeRepository.mysqlEnabled()) {
    try {
      newItem = await knowledgeRepository.create(newItem);
    } catch (error) {
      console.error('MySQL 知识条目创建失败，回退 JSON:', error.message);
    }
  }
  knowledge.push(newItem);
  saveKnowledge(knowledge);
  res.json({ success: true, item: newItem });
});

// 更新知识条目
app.put('/api/knowledge/:id', express.json(), async (req, res) => {
  const id = parseInt(req.params.id);
  let index = knowledge.findIndex(item => item.id === id);
  if (index === -1 && knowledgeRepository.mysqlEnabled()) {
    await syncKnowledgeSnapshot();
    index = knowledge.findIndex(item => item.id === id);
  }
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
  if (knowledgeRepository.mysqlEnabled()) {
    try {
      const dbItem = await knowledgeRepository.update(id, updatedItem);
      if (dbItem) Object.assign(updatedItem, dbItem);
    } catch (error) {
      console.error('MySQL 知识条目更新失败，回退 JSON:', error.message);
    }
  }
  knowledge[index] = updatedItem;
  saveKnowledge(knowledge);
  res.json({ success: true, item: updatedItem });
});

// 删除知识条目
app.delete('/api/knowledge/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  let index = knowledge.findIndex(item => item.id === id);
  if (index === -1 && knowledgeRepository.mysqlEnabled()) {
    await syncKnowledgeSnapshot();
    index = knowledge.findIndex(item => item.id === id);
  }
  if (index === -1) {
    return res.status(404).json({ success: false, error: '知识条目不存在' });
  }
  if (knowledgeRepository.mysqlEnabled()) {
    try {
      await knowledgeRepository.remove(id);
    } catch (error) {
      console.error('MySQL 知识条目删除失败，仅更新 JSON:', error.message);
    }
  }
  knowledge.splice(index, 1);
  saveKnowledge(knowledge);
  res.json({ success: true, message: '删除成功' });
});

// 手动更新知识库
app.post('/api/knowledge/update', express.json(), async (req, res) => {
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
    let savedItem = newItem;
    if (knowledgeRepository.mysqlEnabled()) {
      try {
        savedItem = await knowledgeRepository.create(newItem);
      } catch (error) {
        console.error('MySQL 知识条目批量新增失败，回退 JSON:', error.message);
      }
    }
    knowledge.push(savedItem);
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

// ==================== 8.5 风险工作流（与前端反诈检测联动） ====================
app.post('/api/risk/workflow/medium', express.json(), async (req, res) => {
  const { userEmail, userName, summary, risks } = req.body || {};
  if (!userEmail) {
    return res.status(400).json({ success: false, error: '缺少 userEmail' });
  }

  await loadRiskEventsForRequest();
  await loadNotificationsForRequest();

  const event = {
    severity: 'medium',
    userEmail,
    userName: userName || '',
    summary: summary || '检测到中风险行为',
    risks: Array.isArray(risks) ? risks : [],
    createdAt: new Date().toISOString()
  };
  const savedEvent = await createRiskEventForRequest(event);

  const mediumRiskCount = riskEvents.filter(item => item.userEmail === userEmail && item.severity === 'medium').length;
  const sms = {
    type: 'sms',
    to: userEmail,
    userEmail,
    title: '中风险提醒',
    content: `检测到中风险行为，请本人确认操作。累计中风险次数：${mediumRiskCount}`,
    riskEventId: savedEvent.id,
    createdAt: new Date().toISOString()
  };
  const savedSms = await createNotificationForRequest(sms);

  res.json({
    success: true,
    event: savedEvent,
    mediumRiskCount,
    sms: savedSms
  });
});

app.post('/api/risk/workflow/high', express.json(), async (req, res) => {
  const { userEmail, userName, userPhone, summary, risks } = req.body || {};
  if (!userEmail) {
    return res.status(400).json({ success: false, error: '缺少 userEmail' });
  }

  const now = new Date().toISOString();
  await loadRiskEventsForRequest();
  await loadNotificationsForRequest();

  const event = {
    severity: 'high',
    userEmail,
    userName: userName || '',
    summary: summary || '检测到高风险行为',
    risks: Array.isArray(risks) ? risks : [],
    createdAt: now
  };
  const savedEvent = await createRiskEventForRequest(event);

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
    type: 'guardian-notify',
    to: guardian.email,
    userEmail,
    guardianEmail: guardian.email,
    title: '高风险核验通知',
    content: `被监护人${wardLabel}触发高风险检测，请尽快联系本人核实，勿轻信转账或索要验证码。`,
    riskEventId: savedEvent.id,
    createdAt: now
  };
  const savedGuardianNotice = await createNotificationForRequest(guardianNotice);

  res.json({
    success: true,
    event: savedEvent,
    guardianCreated,
    guardianAccount: {
      email: guardian.email,
      password: guardianCreated ? createdGuardianPassword : null,
      name: guardian.name
    },
    notification: savedGuardianNotice,
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

app.get('/api/risk/events', async (req, res) => {
  const events = await loadRiskEventsForRequest();
  res.json({
    success: true,
    events
  });
});

app.get('/api/notifications', async (req, res) => {
  const email = String(req.query.email || '').trim().toLowerCase();
  if (!email) {
    return res.status(400).json({ success: false, error: '缺少 email 参数' });
  }
  const notificationItems = await loadNotificationsForRequest();
  const items = notificationItems.filter((n) => {
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

// ==================== 9. 静态文件访问 ====================
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
// 将可公开资料统一放到 backend/data 下
app.use('/data-assets', express.static(path.join(__dirname, 'data')));

// ==================== 10. 全局错误处理 ====================
app.use((err, req, res, next) => {
  console.error('[全局错误]', err.stack);
  res.status(500).json({
    success: false,
    error: '服务器内部错误'
  });
});

// ==================== 11. 启动服务 ====================
app.listen(PORT, () => {
  console.log(`✅ 后端服务启动成功：http://localhost:${PORT}`);
  console.log(`✅ 当前使用模型：${currentModel} (${modelConfigs[currentModel].model})`);
  console.log(`✅ 健康检查：GET http://localhost:${PORT}/api/health`);
  console.log(`✅ 模型切换：POST http://localhost:${PORT}/api/model/switch`);
  console.log(`✅ 对话接口：POST http://localhost:${PORT}/api/chat`);
  console.log(`✅ 文本分析：POST http://localhost:${PORT}/api/analyze/text`);
  console.log(`✅ 图片分析：POST http://localhost:${PORT}/api/analyze/image`);
  console.log(`✅ 音频分析：POST http://localhost:${PORT}/api/analyze/audio`);
  console.log(`✅ 视频分析：POST http://localhost:${PORT}/api/analyze/video`);
  console.log(`✅ 风险工作流：POST http://localhost:${PORT}/api/risk/workflow/medium | /high`);
});

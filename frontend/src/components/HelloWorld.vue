<template>
  <v-container class="quickstart-page" fluid>
    <div class="quickstart-shell">
      <div class="mb-6 text-center">
        <h1 class="page-title">反诈检测</h1>
        <div class="page-subtitle">上传可疑内容进行智能分析，识别诈骗风险</div>
      </div>

      <!-- 分析结果展示区域 -->
      <v-card v-if="analysisResult" class="result-panel" elevation="2">
        <v-card-title class="text-h5">
          <v-icon start color="primary">mdi-chart-bar</v-icon>
          分析结果
        </v-card-title>
        <v-card-text>
          <v-alert :type="analysisResult.severity === 'high' ? 'error' : (analysisResult.severity === 'medium' ? 'warning' : 'success')" class="mb-4">
            <strong>风险等级: {{ analysisResult.severity === 'high' ? '高风险' : (analysisResult.severity === 'medium' ? '中风险' : '低风险') }}</strong>
            <div>{{ analysisResult.message }}</div>
          </v-alert>

          <v-row align="stretch">
            <v-col cols="12" md="6">
              <v-card variant="outlined" class="pa-3">
                <v-card-title class="text-h6">检测到的风险点</v-card-title>
                <v-card-text>
                  <v-list>
                    <v-list-item v-for="(risk, index) in analysisResult.risks" :key="index">
                      <v-list-item-title>{{ risk }}</v-list-item-title>
                    </v-list-item>
                  </v-list>
                </v-card-text>
              </v-card>
            </v-col>
            <v-col cols="12" md="6">
              <v-card variant="outlined" class="pa-3">
                <v-card-title class="text-h6">建议措施</v-card-title>
                <v-card-text>
                  <v-list>
                    <v-list-item v-for="(action, index) in analysisResult.actions" :key="index">
                      <v-list-item-title>{{ action }}</v-list-item-title>
                    </v-list-item>
                  </v-list>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>
          <v-row class="mt-4">
            <v-col cols="12" class="text-center">
              <v-btn color="secondary" :loading="generatingReport" @click="generateReport">
                <v-icon start>mdi-file-document</v-icon>
                生成安全报告
              </v-btn>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>

      <v-card v-else class="result-panel" variant="outlined">
        <v-card-text class="text-center py-8">
          <v-icon size="64" color="grey-lighten-1">mdi-chart-line</v-icon>
          <div class="text-h6 mt-2">等待分析结果</div>
          <div class="text-body-2">上传内容并点击分析后，结果将显示在这里</div>
        </v-card-text>
      </v-card>

      <v-card class="mt-5 result-panel" variant="outlined">
        <v-card-title class="text-h6">
          <v-icon start color="primary">mdi-progress-clock</v-icon>
          反诈检测流程
        </v-card-title>
        <v-card-text>
          <div class="process-main">{{ processInfo.message }}</div>
          <div v-if="analyzing || elapsedSeconds > 0" class="process-elapsed">实时耗时：{{ elapsedSeconds }}s</div>
          <div v-if="processInfo.model" class="process-meta">
            <span>模型：{{ processInfo.model }}</span>
            <span v-if="processInfo.durationMs >= 0">耗时：{{ processInfo.durationMs }} ms</span>
          </div>
          <div v-if="processLogs.length" class="process-log-box">
            <div v-for="(log, idx) in processLogs" :key="`p-${idx}`" class="process-log-line">{{ log }}</div>
          </div>
        </v-card-text>
      </v-card>

      <v-card class="mt-5 main-panel" elevation="2">
        <v-card-text>
          <!-- 快捷提示问题 -->
          <div v-if="!uploadedFile" class="quick-questions mb-4">
            <div class="quick-questions-title">快速检测</div>
            <div class="quick-questions-scroll">
              <div class="quick-questions-list">
                <v-chip
                  v-for="(question, index) in quickQuestions"
                  :key="index"
                  class="quick-question-chip"
                  @click="useQuickQuestion(question)"
                >
                  {{ question }}
                </v-chip>
              </div>
            </div>
          </div>

          <!-- 统一输入区域 -->
          <div class="input-area">
            <!-- 文本输入 -->
            <div class="text-input-section">
              <v-textarea
                v-model="textContent"
                placeholder="输入文本或上传文件进行检测..."
                rows="4"
                variant="outlined"
                density="comfortable"
                hide-details
              ></v-textarea>
              
              <!-- 底部功能栏 -->
              <div class="function-bar">
                <div class="function-buttons">
                  <v-btn icon @click="triggerFileUpload('image')" variant="tonal">
                    <v-icon>mdi-image</v-icon>
                  </v-btn>
                  <v-btn icon @click="triggerFileUpload('audio')" variant="tonal">
                    <v-icon>mdi-microphone</v-icon>
                  </v-btn>
                  <v-btn icon @click="triggerFileUpload('video')" variant="tonal">
                    <v-icon>mdi-video</v-icon>
                  </v-btn>
                </div>
                <v-btn color="primary" class="analyze-btn" @click="analyzeContent" :loading="analyzing">
                  <span>分析</span>
                  <v-icon end>mdi-send</v-icon>
                </v-btn>
              </div>
            </div>

            <!-- 上传预览区域 -->
            <div v-if="uploadedFile" class="upload-preview">
              <v-card class="preview-card" variant="outlined">
                <div v-if="isImageFile" class="preview-image">
                  <img :src="filePreviewUrl" alt="预览" />
                </div>
                <div v-else class="preview-file">
                  <v-icon size="48" :color="getFileTypeColor(uploadedFile.type)">
                    {{ getFileTypeIcon(uploadedFile.type) }}
                  </v-icon>
                </div>
                <div class="preview-info">
                  <div class="preview-name">{{ uploadedFile.name }}</div>
                  <div class="preview-size">{{ formatFileSize(uploadedFile.size) }}</div>
                </div>
                <v-btn icon class="remove-btn" @click="clearUploadedFile">
                  <v-icon color="error">mdi-close-circle</v-icon>
                </v-btn>
              </v-card>
            </div>

            <!-- 状态提示 -->
            <v-alert v-if="uploadStatus" :type="uploadStatus.type" class="mt-4">
              {{ uploadStatus.message }}
            </v-alert>
          </div>
        </v-card-text>
      </v-card>
    </div>

    <!-- 隐藏的文件输入元素 -->
    <input
      ref="imageInput"
      type="file"
      accept="image/*"
      style="display: none"
      @change="(e) => handleFileSelect(e, 'image')"
    />
    <input
      ref="audioInput"
      type="file"
      accept="audio/*"
      style="display: none"
      @change="(e) => handleFileSelect(e, 'audio')"
    />
    <input
      ref="videoInput"
      type="file"
      accept="video/*"
      style="display: none"
      @change="(e) => handleFileSelect(e, 'video')"
    />

    <v-dialog v-model="showMediumRiskDialog" max-width="560" persistent>
      <v-card>
        <v-card-title class="text-h6">
          <v-icon start color="warning">mdi-shield-alert</v-icon>
          中风险拦截确认
        </v-card-title>
        <v-card-text>
          <p class="mb-2">系统检测到中风险行为，已触发本人短信提醒并累计风险记录。</p>
          <p class="mb-2">累计中风险次数：{{ mediumRiskCount }}</p>
          <p class="text-medium-emphasis">请确认是否继续当前操作。</p>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" color="error" @click="cancelMediumRiskAction">取消并返回</v-btn>
          <v-btn color="warning" @click="confirmMediumRiskAction">确认继续</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="showHighRiskDialog" max-width="560" persistent>
      <v-card>
        <v-card-title class="text-h6">
          <v-icon start color="error">mdi-shield-lock</v-icon>
          <span v-if="highRiskDialogSuccess">高风险拦截确认</span>
          <span v-else>高风险流程异常</span>
        </v-card-title>
        <v-card-text>
          <template v-if="highRiskDialogSuccess">
            <template v-if="isGuardianMode">
              <p class="mb-2">系统检测到高风险行为，请提高警惕并立即核验相关信息。</p>
            </template>
            <template v-else>
              <p class="mb-2">系统检测到高风险行为，已触发监护人核验流程并向监护人发送通知。</p>
              <p v-if="highRiskGuardianCreated" class="mb-2">
                已创建系统占位监护人账户：<strong>{{ highRiskGuardianEmail }}</strong>
                <template v-if="highRiskGuardianPassword"> / {{ highRiskGuardianPassword }}</template>
              </p>
              <p v-else class="mb-2">
                已向您<strong>已绑定的监护人</strong>写入通知记录：<strong>{{ highRiskGuardianEmail }}</strong>
                <span class="text-medium-emphasis">（未再新建占位账号）</span>
              </p>
            </template>
          </template>
          <p v-else class="mb-0">{{ highRiskErrorMessage }}</p>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <template v-if="highRiskDialogSuccess">
            <v-btn color="error" @click="closeHighRiskDialog">知道了</v-btn>
          </template>
          <v-btn v-else color="primary" @click="closeHighRiskDialog">知道了</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

/** 开发环境默认走 Vite 代理（同源 /api → localhost:7007）；生产可设 VITE_API_BASE_URL */
const API_BASE = (() => {
  const raw = import.meta.env.VITE_API_BASE_URL
  if (raw !== undefined && String(raw).trim() !== '') {
    return String(raw).replace(/\/$/, '')
  }
  return import.meta.env.DEV ? '' : 'http://127.0.0.1:7007'
})()

function apiUrl(path) {
  const p = path.startsWith('/') ? path : `/${path}`
  return `${API_BASE}${p}`
}
const textContent = ref('')
const analyzing = ref(false)
const analysisResult = ref(null)
const uploadStatus = ref(null)
const uploadedFile = ref(null)
const currentFileType = ref('text')
/** 最近一次成功分析的多媒体（服务端 uploads 路径），生成安全报告时写入 JSON */
const lastAnalyzedSource = ref({
  modality: 'text',
  url: '',
  file: null,
  transcription: ''
})
const showMediumRiskDialog = ref(false)
const mediumRiskCount = ref(0)
const showHighRiskDialog = ref(false)
const highRiskDialogSuccess = ref(true)
const highRiskGuardianCreated = ref(false)
const highRiskGuardianEmail = ref('')
const highRiskGuardianPassword = ref('')
const highRiskErrorMessage = ref('')
const highRiskNotificationHint = ref('')
const isGuardianMode = computed(() => String(route.path || '').startsWith('/guardian'))
const processInfo = ref({ message: '尚未开始检测流程', model: '', durationMs: -1 })
const processLogs = ref([])
const detectStartedAt = ref(0)
const elapsedSeconds = ref(0)
const lastUsedModel = ref('')
let processTicker = null
let stageTimers = []

// 快捷提示问题
const quickQuestions = [
  '恭喜您中奖了',
  '请问您需要贷款吗',
  '您的银行卡有异常',
  '这是您的快递单号'
]

// 使用快捷提示问题
function useQuickQuestion(question) {
  textContent.value = question
}

function updateProcessInfo(message, model = '', durationMs = -1) {
  processInfo.value = {
    message: message || '流程状态未知',
    model: model || '',
    durationMs: Number.isFinite(durationMs) ? Math.max(0, Math.round(durationMs)) : -1
  }
}

function appendProcessLog(text) {
  if (!text) return
  const timeLabel = new Date().toTimeString().slice(0, 8)
  processLogs.value = [...processLogs.value, `${timeLabel} · ${text}`]
}

function clearStageTimers() {
  if (!stageTimers.length) return
  stageTimers.forEach((id) => clearTimeout(id))
  stageTimers = []
}

function startProcessTicker() {
  stopProcessTicker()
  detectStartedAt.value = Date.now()
  elapsedSeconds.value = 0
  processTicker = setInterval(() => {
    elapsedSeconds.value = Math.max(0, Math.floor((Date.now() - detectStartedAt.value) / 1000))
  }, 300)
}

function stopProcessTicker() {
  if (processTicker) {
    clearInterval(processTicker)
    processTicker = null
  }
  if (detectStartedAt.value) {
    elapsedSeconds.value = Math.max(0, Math.floor((Date.now() - detectStartedAt.value) / 1000))
  }
}

function getProcessStages(type) {
  if (type === 'text') {
    return ['我先读一遍文本内容。', '我在提取可疑关键词和诱导话术。', '我在判断是否存在诈骗套路链路。', '我在生成风险等级和建议。']
  }
  if (type === 'image') {
    return ['我先检查图片格式并读取内容。', '我在识别图片里的文字和关键信息。', '我在判断是否有诈骗页面/诱导信息。', '我在输出风险结论和建议。']
  }
  if (type === 'audio') {
    return ['我先处理音频内容。', '我在提取对话中的高危话术。', '我在判断是否有冒充和诱导行为。', '我在输出风险结论和建议。']
  }
  return ['我先提取视频关键内容。', '我在识别画面和字幕中的风险线索。', '我在综合判断诈骗引导路径。', '我在输出风险结论和建议。']
}

function playProcessStages(type) {
  clearStageTimers()
  getProcessStages(type).forEach((text, idx) => {
    const timerId = setTimeout(() => {
      if (!analyzing.value) return
      updateProcessInfo(text)
      appendProcessLog(text)
    }, idx * 700)
    stageTimers.push(timerId)
  })
}

function beginProcess(type) {
  processLogs.value = []
  updateProcessInfo(`开始${getFileTypeLabel(type)}检测流程...`)
  appendProcessLog(`开始${getFileTypeLabel(type)}检测任务`)
  startProcessTicker()
  playProcessStages(type)
}

function finishProcessSuccess(modelName, startedAt, tip) {
  lastUsedModel.value = String(modelName || '')
  updateProcessInfo('检测流程已完成', modelName || '', Date.now() - startedAt)
  appendProcessLog(tip || '模型分析完成，结果已生成')
}

// 隐藏的文件输入元素
const imageInput = ref(null)
const audioInput = ref(null)
const videoInput = ref(null)

// 计算属性：是否是图片文件
const isImageFile = computed(() => {
  return uploadedFile.value && uploadedFile.value.type.startsWith('image/')
})

// 计算属性：文件预览URL
const filePreviewUrl = computed(() => {
  if (uploadedFile.value && uploadedFile.value.type.startsWith('image/')) {
    return URL.createObjectURL(uploadedFile.value)
  }
  return ''
})

// 触发文件上传
function triggerFileUpload(type) {
  currentFileType.value = type
  switch (type) {
    case 'image':
      nextTick(() => imageInput.value?.click())
      break
    case 'audio':
      nextTick(() => audioInput.value?.click())
      break
    case 'video':
      nextTick(() => videoInput.value?.click())
      break
  }
}

// 处理文件选择
function handleFileSelect(event, type) {
  const file = event.target.files[0]
  if (file) {
    uploadedFile.value = file
    currentFileType.value = type
    lastAnalyzedSource.value = { modality: type, url: '', file: null, transcription: '' }
    uploadStatus.value = {
      type: 'success',
      message: `${getFileTypeLabel(type)} "${file.name}" 已成功上传`
    }
  }
}

// 清除上传的文件
function clearUploadedFile() {
  uploadedFile.value = null
  uploadStatus.value = null
  currentFileType.value = 'text'
  lastAnalyzedSource.value = { modality: 'text', url: '', file: null, transcription: '' }
}

// 获取文件类型标签
function getFileTypeLabel(type) {
  const labels = {
    text: '文本',
    image: '图片',
    audio: '音频',
    video: '视频'
  }
  return labels[type] || '文件'
}

// 获取文件类型颜色
function getFileTypeColor(fileType) {
  if (fileType.startsWith('image/')) return 'primary'
  if (fileType.startsWith('audio/')) return 'success'
  if (fileType.startsWith('video/')) return 'warning'
  return 'secondary'
}

// 获取文件类型图标
function getFileTypeIcon(fileType) {
  if (fileType.startsWith('image/')) return 'mdi-image'
  if (fileType.startsWith('audio/')) return 'mdi-microphone'
  if (fileType.startsWith('video/')) return 'mdi-video'
  return 'mdi-file'
}

function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

async function analyzeContent() {
  if (uploadedFile.value) {
    // 分析上传的文件
    switch (currentFileType.value) {
      case 'image':
        await analyzeImage()
        break
      case 'audio':
        await analyzeAudio()
        break
      case 'video':
        await analyzeVideo()
        break
    }
  } else if (textContent.value.trim()) {
    // 分析文本
    await analyzeText()
  } else {
    uploadStatus.value = {
      type: 'error',
      message: '请输入文本或上传文件'
    }
  }
}

async function analyzeImage() {
  if (!uploadedFile.value) {
    uploadStatus.value = {
      type: 'error',
      message: '请先上传图片'
    }
    return
  }

  analyzing.value = true
  const startedAt = Date.now()
  beginProcess('image')
  uploadStatus.value = {
    type: 'info',
    message: '正在分析图片...'
  }

  try {
    const formData = new FormData()
    formData.append('image', uploadedFile.value)

    const response = await fetch(apiUrl('/api/analyze/image'), {
      method: 'POST',
      body: formData
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || '图片分析请求失败')
    }

    if (!data.success) {
      throw new Error(data.error || '图片分析服务返回错误')
    }

    const analysis = data.analysis
    const file = data.file || {}
    lastAnalyzedSource.value = {
      modality: 'image',
      url: file.url || '',
      file,
      transcription: data.transcription || analysis.transcription || ''
    }
    analysisResult.value = {
      severity: analysis.risk_level === 'high' ? 'high' : (analysis.risk_level === 'medium' ? 'medium' : 'low'),
      message: analysis.summary || '图片分析完成',
      risks: analysis.reasons || [],
      actions: analysis.suggestions || []
    }
    finishProcessSuccess(data.model, startedAt, '图片分析完成，已输出风险结果')
    uploadStatus.value = {
      type: 'success',
      message: '图片分析完成，风险等级：' + analysis.risk_level
    }
    await runRiskWorkflowAfterReportPaint(analysisResult.value)
  } catch (error) {
    console.error('图片分析失败:', error)
    uploadStatus.value = {
      type: 'error',
      message: '图片分析失败: ' + error.message
    }
    analysisResult.value = {
      severity: 'medium',
      message: '图片分析服务暂时不可用',
      risks: ['服务连接异常'],
      actions: ['请检查网络或稍后重试']
    }
    updateProcessInfo(`流程失败：${error.message || '分析失败'}`)
    appendProcessLog(`流程失败：${error.message || '分析失败'}`)
    await runRiskWorkflowAfterReportPaint(analysisResult.value)
  } finally {
    analyzing.value = false
    stopProcessTicker()
    clearStageTimers()
  }
}

async function analyzeAudio() {
  if (!uploadedFile.value) {
    uploadStatus.value = {
      type: 'error',
      message: '请先上传音频'
    }
    return
  }

  analyzing.value = true
  const startedAt = Date.now()
  beginProcess('audio')
  uploadStatus.value = {
    type: 'info',
    message: '正在分析音频...'
  }

  try {
    const formData = new FormData()
    formData.append('audio', uploadedFile.value)

    const response = await fetch(apiUrl('/api/analyze/audio'), {
      method: 'POST',
      body: formData
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || '音频分析请求失败')
    }

    if (!data.success) {
      throw new Error(data.error || '音频分析服务返回错误')
    }

    const analysis = data.analysis
    const file = data.file || {}
    lastAnalyzedSource.value = {
      modality: 'audio',
      url: file.url || '',
      file,
      transcription: data.transcription || analysis.transcription || ''
    }
    analysisResult.value = {
      severity: analysis.risk_level === 'high' ? 'high' : (analysis.risk_level === 'medium' ? 'medium' : 'low'),
      message: analysis.summary || '音频分析完成',
      risks: analysis.reasons || [],
      actions: analysis.suggestions || []
    }
    finishProcessSuccess(data.model, startedAt, '音频分析完成，已输出风险结果')
    uploadStatus.value = {
      type: 'success',
      message: '音频分析完成，风险等级：' + analysis.risk_level
    }
    await runRiskWorkflowAfterReportPaint(analysisResult.value)
  } catch (error) {
    console.error('音频分析失败:', error)
    uploadStatus.value = {
      type: 'error',
      message: '音频分析失败: ' + error.message
    }
    analysisResult.value = {
      severity: 'medium',
      message: '音频分析服务暂时不可用',
      risks: ['服务连接异常'],
      actions: ['请检查网络或稍后重试']
    }
    updateProcessInfo(`流程失败：${error.message || '分析失败'}`)
    appendProcessLog(`流程失败：${error.message || '分析失败'}`)
    await runRiskWorkflowAfterReportPaint(analysisResult.value)
  } finally {
    analyzing.value = false
    stopProcessTicker()
    clearStageTimers()
  }
}

async function analyzeVideo() {
  if (!uploadedFile.value) {
    uploadStatus.value = {
      type: 'error',
      message: '请先上传视频'
    }
    return
  }

  analyzing.value = true
  const startedAt = Date.now()
  beginProcess('video')
  uploadStatus.value = {
    type: 'info',
    message: '正在分析视频...'
  }

  try {
    const formData = new FormData()
    formData.append('video', uploadedFile.value)

    const response = await fetch(apiUrl('/api/analyze/video'), {
      method: 'POST',
      body: formData
    })

    const data = await response.json()
    if (!response.ok) {
      throw new Error(data.error || '视频分析请求失败')
    }
    if (!data.success) {
      throw new Error(data.error || '视频分析服务返回错误')
    }

    const analysis = data.analysis
    const file = data.file || {}
    lastAnalyzedSource.value = {
      modality: 'video',
      url: file.url || '',
      file,
      transcription: data.transcription || analysis.transcription || ''
    }
    analysisResult.value = {
      severity: analysis.risk_level === 'high' ? 'high' : (analysis.risk_level === 'medium' ? 'medium' : 'low'),
      message: analysis.summary || '视频分析完成',
      risks: analysis.reasons || [],
      actions: analysis.suggestions || []
    }
    finishProcessSuccess(data.model, startedAt, '视频分析完成，已输出风险结果')
    uploadStatus.value = {
      type: 'success',
      message: '视频分析完成，风险等级：' + (analysis.risk_level || 'unknown')
    }
    await runRiskWorkflowAfterReportPaint(analysisResult.value)
  } catch (error) {
    console.error('视频分析失败:', error)
    uploadStatus.value = {
      type: 'error',
      message: '视频分析失败: ' + error.message
    }
    analysisResult.value = {
      severity: 'medium',
      message: '视频分析服务暂时不可用',
      risks: ['服务连接异常'],
      actions: ['请检查网络或稍后重试']
    }
    updateProcessInfo(`流程失败：${error.message || '分析失败'}`)
    appendProcessLog(`流程失败：${error.message || '分析失败'}`)
    await runRiskWorkflowAfterReportPaint(analysisResult.value)
  } finally {
    analyzing.value = false
    stopProcessTicker()
    clearStageTimers()
  }
}

async function analyzeText() {
  if (!textContent.value.trim()) {
    uploadStatus.value = {
      type: 'error',
      message: '请输入文本内容'
    }
    return
  }

  analyzing.value = true
  const startedAt = Date.now()
  beginProcess('text')
  uploadStatus.value = {
    type: 'info',
    message: '正在调用 AI 分析服务...'
  }

  try {
    const response = await fetch(apiUrl('/api/analyze/text'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text: textContent.value })
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || '分析请求失败')
    }

    if (!data.success) {
      throw new Error(data.error || '分析服务返回错误')
    }

    const analysis = data.analysis
    lastAnalyzedSource.value = { modality: 'text', url: '', file: null, transcription: '' }
    analysisResult.value = {
      severity: analysis.risk_level === 'high' ? 'high' : (analysis.risk_level === 'medium' ? 'medium' : 'low'),
      message: analysis.summary || '分析完成',
      risks: analysis.reasons || [],
      actions: analysis.suggestions || []
    }
    finishProcessSuccess(data.model, startedAt, '文本分析完成，已输出风险结果')
    uploadStatus.value = {
      type: 'success',
      message: '文本分析完成，风险等级：' + analysis.risk_level
    }
    await runRiskWorkflowAfterReportPaint(analysisResult.value)
  } catch (error) {
    console.error('分析失败:', error)
    uploadStatus.value = {
      type: 'error',
      message: '分析失败: ' + error.message
    }
    analysisResult.value = {
      severity: 'medium',
      message: '分析服务暂时不可用，使用模拟结果',
      risks: ['服务连接异常'],
      actions: ['请检查网络或稍后重试']
    }
    updateProcessInfo(`流程失败：${error.message || '分析失败'}`)
    appendProcessLog(`流程失败：${error.message || '分析失败'}`)
    await runRiskWorkflowAfterReportPaint(analysisResult.value)
  } finally {
    analyzing.value = false
    stopProcessTicker()
    clearStageTimers()
  }
}

const generatingReport = ref(false)

function getActiveAccount() {
  try {
    const accounts = JSON.parse(localStorage.getItem('web_user_accounts') || '[]')
    const activeIndex = Number(localStorage.getItem('web_active_user_account_index') || 0)
    if (!Array.isArray(accounts)) return null
    return accounts[activeIndex] || accounts[0] || null
  } catch (error) {
    console.warn('读取当前账号失败:', error)
    return null
  }
}

function getBoundGuardiansForWard(wardEmail) {
  if (!wardEmail) return []
  const w = String(wardEmail).trim().toLowerCase()
  try {
    const links = JSON.parse(localStorage.getItem('web_guardian_links') || '[]')
    if (!Array.isArray(links)) return []
    return links
      .filter((item) => String(item.wardEmail || '').trim().toLowerCase() === w)
      .map((item) => ({
        guardianEmail: item.guardianEmail,
        guardianName: item.guardianName,
        guardianPhone: item.guardianPhone
      }))
  } catch {
    return []
  }
}

async function readRiskWorkflowJson(response) {
  const text = await response.text()
  const trimmed = text.trim()
  if (!trimmed || trimmed.startsWith('<')) {
    throw new Error('无法连接风险服务，请确认后端已在 7007 端口启动。')
  }
  try {
    return JSON.parse(text)
  } catch {
    throw new Error('风险服务返回异常，请稍后重试。')
  }
}

/** 先结束加载、让检测报告渲染到页面上，再执行中/高风险弹窗（低风险不弹窗） */
async function runRiskWorkflowAfterReportPaint(result) {
  if (!result) return
  analyzing.value = false
  await nextTick()
  if (result.severity === 'low') {
    return
  }
  await new Promise((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(resolve))
  })
  await applyRiskWorkflow(result)
}

async function applyRiskWorkflow(result) {
  if (!result || result.severity === 'low') return
  const account = getActiveAccount()
  const userEmail = account?.email || ''
  const userName = account?.name || '当前用户'
  const userPhone = account?.phone || ''

  if (result.severity === 'medium') {
    try {
      const response = await fetch(apiUrl('/api/risk/workflow/medium'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userEmail,
          userName,
          summary: result.message,
          risks: result.risks || []
        })
      })
      const data = await readRiskWorkflowJson(response)
      if (response.ok && data.success) {
        mediumRiskCount.value = data.mediumRiskCount || 0
      }
    } catch (error) {
      console.error('中风险流程执行失败:', error)
    }
    showMediumRiskDialog.value = true
    return
  }

  if (result.severity === 'high') {
    if (isGuardianMode.value) {
      highRiskGuardianCreated.value = false
      highRiskGuardianEmail.value = ''
      highRiskGuardianPassword.value = ''
      highRiskNotificationHint.value = ''
      highRiskDialogSuccess.value = true
      showHighRiskDialog.value = true
      return
    }
    try {
      const response = await fetch(apiUrl('/api/risk/workflow/high'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userEmail,
          userName,
          userPhone,
          summary: result.message,
          risks: result.risks || [],
          boundGuardians: getBoundGuardiansForWard(userEmail)
        })
      })
      const data = await readRiskWorkflowJson(response)
      if (!response.ok || !data.success) {
        throw new Error(data.error || '高风险流程执行失败')
      }

      highRiskGuardianCreated.value = !!data.guardianCreated
      highRiskGuardianEmail.value = data.guardianAccount?.email || ''
      highRiskGuardianPassword.value = data.guardianAccount?.password || ''
      highRiskNotificationHint.value = data.notificationHint || ''
      highRiskDialogSuccess.value = true
      showHighRiskDialog.value = true
    } catch (error) {
      console.error('高风险流程执行失败:', error)
      highRiskDialogSuccess.value = false
      highRiskNotificationHint.value = ''
      highRiskErrorMessage.value = error?.message || '高风险流程执行失败'
      showHighRiskDialog.value = true
    }
  }
}

function confirmMediumRiskAction() {
  showMediumRiskDialog.value = false
}

function cancelMediumRiskAction() {
  showMediumRiskDialog.value = false
  router.push('/user/dashboard')
}

function closeHighRiskDialog() {
  showHighRiskDialog.value = false
}

async function generateReport() {
  if (!analysisResult.value) {
    return
  }

  const modality = currentFileType.value
  let content = ''
  let imageUrl = ''
  let videoUrl = ''
  let audioUrl = ''
  let fileInfo = {}
  let transcription = ''

  if (modality === 'text') {
    content = textContent.value.trim()
  } else {
    content = String(lastAnalyzedSource.value.url || '').trim()
    fileInfo = lastAnalyzedSource.value.file || {}
    transcription = String(lastAnalyzedSource.value.transcription || '').trim()
    if (modality === 'image') imageUrl = content
    if (modality === 'video') videoUrl = content
    if (modality === 'audio') audioUrl = content
    if (!content) {
      alert('多媒体报告缺少已上传文件的地址，请重新完成一次分析后再生成报告。')
      return
    }
  }

  generatingReport.value = true
  try {
    const act = getActiveAccount()
    const authorEmail = String(act?.email || '').trim()
    if (!authorEmail) {
      alert('未读取到当前登录邮箱，请先重新登录后再生成安全报告。')
      return
    }
    const authorName = act?.name || ''
    const authorRole = act?.userType || act?.role || ''

    const severityLabel = analysisResult.value.severity === 'high'
      ? '高风险'
      : analysisResult.value.severity === 'medium'
        ? '中风险'
        : '低风险'
    const score = analysisResult.value.severity === 'high' ? 85 : analysisResult.value.severity === 'medium' ? 65 : 45
    const riskLines = (analysisResult.value.risks || []).map((x, i) => `${i + 1}. ${x}`).join('\n') || '无'
    const actionLines = (analysisResult.value.actions || []).map((x, i) => `${i + 1}. ${x}`).join('\n') || '无'
    const thoughtLines = processLogs.value.length
      ? processLogs.value.map((x, i) => `${i + 1}. ${x}`).join('\n')
      : '（本次未记录检测过程）'
    const detectorInput = modality === 'text'
      ? (textContent.value.trim() || '（无）')
      : (uploadedFile.value?.name ? `附件：${uploadedFile.value.name}` : content || '（无）')
    const reportContent = `【检测对象】
${detectorInput}

【调度模型】
${lastUsedModel.value || processInfo.value.model || 'qwen'}

【风险结论】
等级：${severityLabel}
评分：${score}

【风险点】
${riskLines}

【建议措施】
${actionLines}

【反诈检测流程思考过程】
${thoughtLines}`

    const response = await fetch(apiUrl('/api/reports'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: `安全报告 - ${new Date().toLocaleDateString('zh-CN')}`,
        severity: analysisResult.value.severity,
        risks: analysisResult.value.risks,
        actions: analysisResult.value.actions,
        summary: '',
        modality,
        content: reportContent,
        imageUrl,
        videoUrl,
        audioUrl,
        fileInfo,
        transcription,
        authorEmail,
        authorName,
        authorRole
      })
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || '报告生成失败')
    }

    if (!data.success) {
      throw new Error(data.error || '报告生成服务返回错误')
    }

    alert('报告已生成！可在安全报告页面查看。')
  } catch (error) {
    console.error('生成报告失败:', error)
    alert('生成报告失败: ' + error.message)
  } finally {
    generatingReport.value = false
  }
}
</script>

<style scoped>
.quickstart-page {
  display: flex;
  justify-content: center;
  padding: 24px 16px 36px;
  min-height: 100%;
}

.quickstart-shell {
  width: 100%;
  max-width: 900px;
  display: flex;
  flex-direction: column;
}

.main-panel {
  order: 1;
}

.result-panel {
  order: 2;
}

.page-title {
  font-size: 36px;
  line-height: 1.2;
  font-weight: 700;
  background: linear-gradient(135deg, #1e2f59 0%, #3b82f6 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.page-subtitle {
  margin-top: 12px;
  color: #64748b;
  font-size: 15px;
}

.main-panel,
.result-panel {
  border-radius: 20px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
  background: white;
}

.quick-questions {
  margin-bottom: 20px;
}

.quick-questions-title {
  font-size: 14px;
  font-weight: 600;
  color: #64748b;
  margin-bottom: 12px;
}

.quick-questions-scroll {
  overflow-x: auto;
  overflow-y: hidden;
  margin: 0 -24px;
  padding: 0 24px;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
}

.quick-questions-scroll::-webkit-scrollbar {
  display: none;
}

.quick-questions-list {
  display: flex;
  gap: 10px;
  padding: 4px 0;
}

.quick-question-chip {
  background: #f1f5f9 !important;
  color: #475569 !important;
  border: 1px solid #e2e8f0 !important;
  padding: 8px 16px !important;
  border-radius: 24px !important;
  font-size: 14px !important;
  font-weight: 500 !important;
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.quick-question-chip:hover {
  background: #e0f2fe !important;
  color: #0369a1 !important;
  border-color: #0ea5e9 !important;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(14, 165, 233, 0.2);
}

.input-area {
  position: relative;
}

.text-input-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.function-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 0;
}

.function-buttons {
  display: flex;
  gap: 8px;
}

.function-buttons .v-btn {
  border-radius: 12px !important;
  color: #64748b !important;
  background: #f8fafc !important;
  border: 1px solid #e2e8f0 !important;
  transition: all 0.2s ease;
}

.function-buttons .v-btn:hover {
  color: #3b82f6 !important;
  background: #eff6ff !important;
  border-color: #3b82f6 !important;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
}

.analyze-btn {
  border-radius: 12px !important;
  padding: 12px 24px !important;
  font-weight: 600 !important;
  gap: 8px;
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%) !important;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
  transition: all 0.2s ease;
}

.analyze-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(59, 130, 246, 0.4);
}

.upload-preview {
  margin-top: 16px;
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.preview-card {
  position: relative;
  border-radius: 16px;
  overflow: hidden;
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 16px;
  background: #f8fafc;
}

.preview-image {
  width: 100px;
  height: 100px;
  border-radius: 12px;
  overflow: hidden;
  flex-shrink: 0;
  border: 2px solid #e2e8f0;
}

.preview-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.preview-file {
  width: 100px;
  height: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  background: #e2e8f0;
  flex-shrink: 0;
}

.preview-info {
  flex: 1;
  min-width: 0;
}

.preview-name {
  font-weight: 600;
  color: #1e293b;
  font-size: 15px;
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.preview-size {
  color: #64748b;
  font-size: 13px;
}

.remove-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  background: white !important;
  border-radius: 50% !important;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.v-card {
  border-radius: 20px;
}
.process-main {
  font-size: 15px;
  color: #334155;
}
.process-elapsed {
  margin-top: 8px;
  font-size: 13px;
  color: #64748b;
}
.process-meta {
  margin-top: 8px;
  display: flex;
  gap: 16px;
  color: #2563eb;
  font-size: 13px;
}
.process-log-box {
  margin-top: 10px;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  background: #f8fafc;
  padding: 10px;
  max-height: 180px;
  overflow: auto;
}
.process-log-line {
  font-size: 13px;
  color: #475569;
  line-height: 1.6;
}

.v-card-text {
  padding: 24px;
}

.v-textarea {
  border-radius: 16px !important;
  background: #f8fafc !important;
}

.v-textarea textarea {
  font-size: 15px !important;
  line-height: 1.6 !important;
}

.v-textarea fieldset {
  border-color: #e2e8f0 !important;
}

.v-textarea:hover fieldset {
  border-color: #3b82f6 !important;
}

@media (max-width: 960px) {
  .quickstart-page {
    padding: 16px 12px 24px;
  }

  .page-title {
    font-size: 28px;
  }

  .v-card-text {
    padding: 20px;
  }

  .quick-questions-list {
    padding-left: 4px;
    padding-right: 4px;
  }
}

@media (max-width: 600px) {
  .preview-card {
    padding: 12px;
  }

  .preview-image,
  .preview-file {
    width: 80px;
    height: 80px;
  }

  .analyze-btn {
    padding: 10px 20px !important;
  }
}
</style>

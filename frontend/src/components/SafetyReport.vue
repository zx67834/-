<template>
  <!-- 单一根节点：父级 layout 对 router-view 使用 transition mode="out-in"，多根片段会导致离场白屏 -->
  <div class="safety-report-root">
  <v-container class="page-shell" max-width="1280">
    <v-row>
      <v-col cols="12">
        <h1 class="text-h4 mb-4">安全报告</h1>
        <p class="text-body-1">查看自动生成的安全监测报告，了解风险趋势与防御建议。</p>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12" md="4">
        <v-card color="primary" variant="tonal">
          <v-card-title class="d-flex align-center">
            <v-icon start>mdi-file-chart</v-icon>
            报告总数
          </v-card-title>
          <v-card-text>
            <div class="text-h2 text-center">{{ reportCount }}</div>
            <p class="text-center">份安全报告</p>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="4">
        <v-card color="error" variant="tonal">
          <v-card-title class="d-flex align-center">
            <v-icon start>mdi-alert</v-icon>
            高风险报告
          </v-card-title>
          <v-card-text>
            <div class="text-h2 text-center">{{ highRiskReports }}</div>
            <p class="text-center">份高风险</p>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="4">
        <v-card color="success" variant="tonal">
          <v-card-title class="d-flex align-center">
            <v-icon start>mdi-trending-up</v-icon>
            风险下降
          </v-card-title>
          <v-card-text>
            <div class="text-h2 text-center">{{ riskDecrease }}%</div>
            <p class="text-center">近30天风险降低</p>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12">
        <v-card>
          <v-card-title class="d-flex align-center flex-wrap" style="gap: 8px;">
            <span class="d-flex align-center">
              <v-icon start>mdi-calendar</v-icon>
              报告列表
            </span>
            <v-spacer />
            <v-btn
              size="small"
              variant="tonal"
              color="primary"
              :loading="listLoading"
              prepend-icon="mdi-refresh"
              @click="loadReports"
            >
              同步
            </v-btn>
          </v-card-title>
          <v-card-text>
            <p v-if="viewerScopeHint" class="text-caption text-medium-emphasis mb-2">{{ viewerScopeHint }}</p>
            <v-data-table :headers="tableHeaders" :items="reports" items-per-page="5">
              <template v-slot:item.date="{ item }">
                {{ formatDate(item.date) }}
              </template>
              <template v-slot:item.riskLevel="{ item }">
                <v-chip :color="getRiskColor(item.riskLevel)" size="small">
                  {{ item.riskLevel }}
                </v-chip>
              </template>
              <template v-slot:item.actions="{ item }">
                <v-btn size="small" variant="text" @click="viewReport(item)">查看</v-btn>
                <v-btn size="small" variant="text" @click="downloadReport(item)">下载</v-btn>
                <v-btn size="small" variant="text" @click="shareReport(item)">分享</v-btn>
                <v-btn
                  v-if="isGuardianReports"
                  size="small"
                  variant="text"
                  color="error"
                  :loading="deletingReportId === item.id"
                  @click="deleteReport(item)"
                >
                  删除
                </v-btn>
              </template>
            </v-data-table>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-row class="align-stretch">
      <v-col cols="12" md="6">
        <v-card class="h-100">
          <v-card-title>报告生成配置</v-card-title>
          <v-card-text>
            <v-select v-model="frequency" :items="frequencies" label="生成频率" variant="outlined"></v-select>
            <v-checkbox v-model="autoGenerate" label="自动生成日报" hide-details></v-checkbox>
            <v-checkbox v-model="includeCharts" label="包含图表" hide-details></v-checkbox>
            <v-checkbox v-model="includeRecommendations" label="包含防御建议" hide-details></v-checkbox>
            <v-checkbox v-model="sendEmail" label="邮件发送" hide-details></v-checkbox>
            <v-btn color="primary" class="mt-4">保存配置</v-btn>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="6">
        <v-card class="h-100">
          <v-card-title>报告预览</v-card-title>
          <v-card-text>
            <v-card variant="outlined" class="h-100">
              <v-card-title class="text-body-1">《安全监测报告》样例</v-card-title>
              <v-card-text>
                <p><strong>报告期：</strong>2025年3月1日 - 2025年3月31日</p>
                <p><strong>风险概览：</strong>检测到可疑活动12次，成功拦截8次。</p>
                <p><strong>主要风险类型：</strong>AI合成语音诈骗、兼职刷单、虚假征信。</p>
                <p><strong>风险评分：</strong>65分（中等风险）</p>
                <p><strong>建议：</strong>加强通话监控，设置更高风险阈值。</p>
              </v-card-text>
              <v-card-actions>
                <v-btn size="small" color="primary" variant="text">生成完整报告</v-btn>
              </v-card-actions>
            </v-card>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12">
        <v-card>
          <v-card-title>风险趋势图表</v-card-title>
          <v-card-text>
            <div class="trend-wrap">
              <svg
                v-if="trendPoints.length > 1"
                class="trend-svg"
                viewBox="0 0 700 260"
                preserveAspectRatio="none"
                role="img"
                aria-label="近7天风险趋势图"
              >
                <polyline
                  class="trend-line"
                  :points="trendPolylinePoints"
                />
                <circle
                  v-for="p in trendPoints"
                  :key="p.label"
                  :cx="p.x"
                  :cy="p.y"
                  r="4"
                  class="trend-dot"
                />
              </svg>
              <div v-else class="trend-empty text-medium-emphasis">
                报告数据不足，暂无法生成趋势图
              </div>
            </div>

            <div class="trend-labels" v-if="trendLabels.length">
              <span v-for="label in trendLabels" :key="label">{{ label }}</span>
            </div>

            <div class="trend-legend">
              <v-chip size="small" color="error" variant="tonal">高风险 {{ severityCounts.high }}</v-chip>
              <v-chip size="small" color="warning" variant="tonal">中风险 {{ severityCounts.medium }}</v-chip>
              <v-chip size="small" color="success" variant="tonal">低风险 {{ severityCounts.low }}</v-chip>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>

  <v-dialog v-model="dialogVisible" max-width="920">
    <v-card v-if="selectedReport">
      <v-card-title class="text-h5">{{ selectedReport.name }}</v-card-title>
      <v-card-subtitle>
        <div>风险等级: {{ selectedReport.riskLevel }} | 生成日期: {{ formatDate(selectedReport.date) }}</div>
        <div v-if="reportAuthorSubtitle" class="text-body-2 mt-1">{{ reportAuthorSubtitle }}</div>
      </v-card-subtitle>
      <v-card-text>
        <v-alert type="info" class="mb-4">
          <strong>摘要:</strong> {{ selectedReport.summary }}
        </v-alert>
        <v-row>
          <v-col cols="6">
            <h4>风险点</h4>
            <ul>
              <li v-for="(risk, idx) in selectedReport.risks" :key="idx">{{ risk }}</li>
            </ul>
          </v-col>
          <v-col cols="6">
            <h4>建议措施</h4>
            <ul>
              <li v-for="(action, idx) in selectedReport.actions" :key="idx">{{ action }}</li>
            </ul>
          </v-col>
        </v-row>
        <v-divider class="my-4"></v-divider>
        <div class="d-flex align-center flex-wrap ga-2 mb-2">
          <h4 class="mb-0">原始内容</h4>
          <v-chip v-if="dialogTypeChipVisible" size="small" variant="tonal" color="primary">
            {{ dialogTypeChipLabel }}
          </v-chip>
        </div>

        <template v-if="showMissingDeclaredMedia">
          <v-alert type="info" density="comfortable" variant="tonal" class="mb-3">
            此报告在记录里标记为「{{ modalityLabel(selectedReport.declaredModality) }}」，但<strong>未保存</strong>可用的媒体地址（常见于旧版生成流程）。
            无法预览图片/音视频原件；请在被监护人账号的<strong>反诈检测</strong>中重新分析并点击<strong>生成安全报告</strong>。
          </v-alert>
          <p v-if="selectedReport.summary" class="text-body-2"><strong>摘要：</strong>{{ selectedReport.summary }}</p>
        </template>

        <template v-else-if="dialogShowsImage && dialogMediaUrl">
          <div class="media-shell">
            <img
              :key="dialogMediaUrl"
              :src="dialogMediaUrl"
              alt="报告原始图片"
              class="media-img"
              referrerpolicy="no-referrer"
            />
          </div>
          <p v-if="selectedReport.fileInfo?.originalname" class="text-caption text-medium-emphasis mt-2">
            文件：{{ selectedReport.fileInfo.originalname }}
          </p>
        </template>

        <template v-else-if="dialogShowsAudio && dialogMediaUrl">
          <audio class="media-av" controls :src="dialogMediaUrl" />
          <p v-if="selectedReport.fileInfo?.originalname" class="text-caption text-medium-emphasis mt-2">
            文件：{{ selectedReport.fileInfo.originalname }}
          </p>
          <pre v-if="selectedReport.transcription" class="report-pre mt-3">{{ selectedReport.transcription }}</pre>
        </template>

        <template v-else-if="dialogShowsVideo && dialogMediaUrl">
          <video class="media-video" controls playsinline :src="dialogMediaUrl" />
          <p v-if="selectedReport.fileInfo?.originalname" class="text-caption text-medium-emphasis mt-2">
            文件：{{ selectedReport.fileInfo.originalname }}
          </p>
        </template>

        <template v-else-if="dialogModalityNorm === 'text'">
          <pre
            v-if="!dialogShowStructuredNarrative && selectedReport.content"
            class="report-pre"
          >{{ selectedReport.content }}</pre>
        </template>

        <template v-else>
          <v-alert type="warning" density="comfortable" variant="tonal" class="mb-3">
            未能解析出可预览的媒体地址。若应有附件，请确认 <code>content</code> / <code>imageUrl</code> 等字段为后端
            <code>/uploads/…</code> 路径且文件仍存在；仅文本请查看下方。
          </v-alert>
          <pre v-if="selectedReport.content" class="report-pre">{{ selectedReport.content }}</pre>
        </template>

        <div v-if="dialogShowStructuredNarrative" class="structured-narrative mt-4">
          <v-divider class="mb-4" />
          <div v-if="dialogNarrativeBlocks.detectTarget" class="mb-4">
            <h4 class="text-subtitle-1 font-weight-bold mb-2">【检测对象】</h4>
            <pre class="report-pre">{{ dialogNarrativeBlocks.detectTarget }}</pre>
          </div>
          <div v-if="dialogNarrativeBlocks.model" class="mb-4">
            <h4 class="text-subtitle-1 font-weight-bold mb-2">【调度模型】</h4>
            <pre class="report-pre">{{ dialogNarrativeBlocks.model }}</pre>
          </div>
          <div v-if="dialogNarrativeBlocks.riskConclusion" class="mb-4">
            <h4 class="text-subtitle-1 font-weight-bold mb-2">【风险结论】</h4>
            <pre class="report-pre">{{ dialogNarrativeBlocks.riskConclusion }}</pre>
          </div>
          <div v-if="dialogNarrativeBlocks.thought" class="mb-2">
            <h4 class="text-subtitle-1 font-weight-bold mb-2">【反诈检测流程思考过程】</h4>
            <pre class="report-pre">{{ dialogNarrativeBlocks.thought }}</pre>
          </div>
        </div>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="primary" @click="dialogVisible = false">关闭</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
  </div>
</template>

<script setup>
import { computed, ref, watch, onMounted, onUnmounted } from 'vue'
import { useRoute, onBeforeRouteLeave } from 'vue-router'

/** 与反诈检测页一致：开发走 Vite 代理；生产可设 VITE_API_BASE_URL */
const API_BASE = (() => {
  const raw = import.meta.env.VITE_API_BASE_URL
  if (raw !== undefined && raw !== null && String(raw).trim() !== '') {
    return String(raw).trim().replace(/\/+$/, '')
  }
  return import.meta.env.DEV ? '' : 'http://127.0.0.1:7007'
})()

function apiUrl(path) {
  const p = path.startsWith('/') ? path : `/${path}`
  return `${API_BASE}${p}`
}

async function readJsonResponse(response, nonJsonErrorMessage) {
  const contentType = response.headers.get('content-type') || ''
  const text = await response.text()
  if (!contentType.includes('application/json')) {
    const shortText = String(text || '').trim().slice(0, 80)
    throw new Error(`${nonJsonErrorMessage}${shortText ? `（响应片段: ${shortText}）` : ''}`)
  }
  return JSON.parse(text)
}

async function requestJsonWithFallback(path, init, nonJsonErrorMessage) {
  const primaryUrl = apiUrl(path)
  const urls = [primaryUrl]
  if (!API_BASE) {
    urls.push(`http://127.0.0.1:7007${path}`)
  }

  let lastError = null
  for (const url of urls) {
    try {
      const response = await fetch(url, init)
      const data = await readJsonResponse(response, nonJsonErrorMessage)
      return { response, data, url }
    } catch (error) {
      lastError = error
    }
  }
  throw lastError || new Error('请求失败')
}

/** 将 reports.json 里存的 /uploads/... 转为浏览器可请求的绝对地址 */
function resolveContentUrl(raw) {
  if (!raw || typeof raw !== 'string') return ''
  const u = raw.trim()
  if (u.startsWith('http://') || u.startsWith('https://') || u.startsWith('data:')) return u
  if (u.startsWith('/')) return `${API_BASE}${u}`
  return `${API_BASE}/${u.replace(/^\/+/, '')}`
}

function inferModality(report) {
  if (String(report.imageUrl || '').trim()) return 'image'
  if (String(report.videoUrl || '').trim()) return 'video'
  if (String(report.audioUrl || '').trim()) return 'audio'
  const c = String(report.content || '').trim()
  const guessFromPath = (path) => {
    if (!path) return null
    const p = coerceMediaPath(path)
    if (!/^\/uploads\//i.test(p) && !/^https?:\/\//i.test(p)) return null
    const lower = p.split('?')[0].toLowerCase()
    if (/\.(mp4|webm|mov|mkv|avi)$/i.test(lower)) return 'video'
    if (/\.(mp3|wav|m4a|aac|ogg|flac)$/i.test(lower)) return 'audio'
    if (/\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(lower)) return 'image'
    return null
  }
  const fromContent = guessFromPath(c)
  if (fromContent) return fromContent
  const explicit = report.modality
  if (explicit && String(explicit).toLowerCase() !== 'text') {
    const ex = String(explicit).toLowerCase()
    if (['image', 'video', 'audio'].includes(ex) && !hasReportMediaPayload(report)) {
      return 'text'
    }
    return ex
  }
  return 'text'
}

function pickRawMediaUrl(modality, report) {
  if (modality === 'image') return report.imageUrl || report.content || ''
  if (modality === 'video') return report.videoUrl || report.content || ''
  if (modality === 'audio') return report.audioUrl || report.content || ''
  return ''
}

function modalityLabel(modality) {
  const m = String(modality || '').toLowerCase()
  if (m === 'image') return '图片'
  if (m === 'video') return '视频'
  if (m === 'audio') return '音频'
  return '文本'
}

/** 统一成可拼接到 API 的路径（补全 uploads 前导 /） */
function coerceMediaPath(str) {
  const s = String(str || '').trim()
  if (!s) return ''
  if (/^https?:\/\//i.test(s)) return s
  if (s.startsWith('/')) return s
  const norm = s.replace(/\\/g, '/')
  if (/^uploads\//i.test(norm)) return `/${norm}`
  return norm
}

/** 从报告正文截取「【标题】」到下一标题之间的内容（与反诈检测生成格式一致） */
function sliceReportSegment(text, startMarker, endMarkers) {
  const s = String(text || '')
  const i = s.indexOf(startMarker)
  if (i < 0) return ''
  const from = i + startMarker.length
  let end = s.length
  for (const m of endMarkers) {
    const j = s.indexOf(m, from)
    if (j >= 0 && j < end) end = j
  }
  return s.slice(from, end).trim()
}

function extractReportNarrativeBlocks(content) {
  const nextAfterTarget = ['【调度模型】', '【风险结论】', '【风险点】', '【建议措施】', '【反诈检测流程思考过程】']
  const nextAfterModel = ['【风险结论】', '【风险点】', '【建议措施】', '【反诈检测流程思考过程】']
  const nextAfterConclusion = ['【风险点】', '【建议措施】', '【反诈检测流程思考过程】']
  const s = String(content || '')
  return {
    detectTarget: sliceReportSegment(s, '【检测对象】', nextAfterTarget),
    model: sliceReportSegment(s, '【调度模型】', nextAfterModel),
    riskConclusion: sliceReportSegment(s, '【风险结论】', nextAfterConclusion),
    thought: sliceReportSegment(s, '【反诈检测流程思考过程】', [])
  }
}

/** 历史数据可能把 JSON 误存进 content */
function tryJsonMediaUrl(content) {
  const c = String(content || '').trim()
  if (!c.startsWith('{')) return ''
  try {
    const o = JSON.parse(c)
    return coerceMediaPath(o.url || o.file?.url || o.imageUrl || o.videoUrl || o.audioUrl || '')
  } catch {
    return ''
  }
}

/** 是否存在任意可解析的 uploads / http 媒体路径（用于识别「标了图片但没存 URL」的脏数据） */
function hasReportMediaPayload(report) {
  if (!report) return false
  for (const ch of [report.imageUrl, report.videoUrl, report.audioUrl, report.content]) {
    const c = String(ch || '').trim()
    if (!c) continue
    if (tryJsonMediaUrl(c)) return true
    const p = coerceMediaPath(c)
    if (/^\/uploads\//i.test(p) || /^https?:\/\//i.test(p)) return true
  }
  return false
}

/** 弹窗打开时按当前行重新解析，避免列表映射时漏掉 URL */
function resolveDialogMediaUrl(r) {
  if (!r) return ''
  const mod = String(r.modality || inferModality(r) || 'text').toLowerCase()
  const reportLike = {
    content: r.content,
    imageUrl: r.imageUrl,
    videoUrl: r.videoUrl,
    audioUrl: r.audioUrl,
    modality: mod
  }
  let raw = pickRawMediaUrl(mod, reportLike)
  raw = coerceMediaPath(raw)
  if (!raw) raw = coerceMediaPath(tryJsonMediaUrl(r.content))
  if (!raw) {
    const fallbacks = [r.imageUrl, r.videoUrl, r.audioUrl, r.content]
    for (const f of fallbacks) {
      const x = coerceMediaPath(String(f || '').trim())
      if (x && (/^\/uploads\//i.test(x) || /^https?:\/\//i.test(x) || /^uploads\//i.test(x))) {
        raw = x
        break
      }
    }
  }
  if (!raw && mod === 'image') {
    const c = coerceMediaPath(String(r.content || '').trim())
    if (/\.(png|jpe?g|gif|webp|bmp|svg)(\?|$)/i.test(c)) raw = c
  }
  if (!raw && String(r.resolvedMediaUrl || '').trim()) return String(r.resolvedMediaUrl).trim()
  return raw ? resolveContentUrl(raw) : ''
}

const reportCount = ref(0)
const highRiskReports = ref(0)
const riskDecrease = ref(0)

const route = useRoute()

function getWebActiveAccount() {
  try {
    const accounts = JSON.parse(localStorage.getItem('web_user_accounts') || '[]')
    const activeIndex = Number(localStorage.getItem('web_active_user_account_index') || 0)
    if (!Array.isArray(accounts)) return null
    return accounts[activeIndex] || accounts[0] || null
  } catch {
    return null
  }
}

const isGuardianReports = computed(() => String(route.path || '').startsWith('/guardian'))

const tableHeaders = computed(() => {
  const whoCol = isGuardianReports.value
    ? { title: '被监护人', key: 'authorDisplay' }
    : { title: '账号名字', key: 'authorDisplay' }
  return [
    { title: '报告日期', key: 'date' },
    { title: '报告名称', key: 'name' },
    whoCol,
    { title: '风险等级', key: 'riskLevel' },
    { title: '风险事件数', key: 'events' },
    { title: '生成方式', key: 'method' },
    { title: '操作', key: 'actions' }
  ]
})

const viewerScopeHint = computed(() => {
  const act = getWebActiveAccount()
  const email = String(act?.email || '').trim()
  if (!email) return '未检测到登录邮箱，无法加载报告列表；请先登录用户端或监护人端账号。'
  if (isGuardianReports.value) {
    return '已与服务器同步：汇总显示您所绑定的全部被监护人生成的报告。若列为未记录，表示该条未保存生成者邮箱/姓名（旧数据），请被监护人登录后重新生成。'
  }
  return '已与服务器同步：仅显示当前登录账号本人生成的安全报告。'
})

const reportAuthorSubtitle = computed(() => {
  const r = selectedReport.value
  if (!r) return ''
  const label = isGuardianReports.value ? '被监护人' : '账号名字'
  const em = String(r.authorEmail || '').trim()
  const nm = String(r.authorName || '').trim()
  if (!em && !nm) return `${label}：未记录（无邮箱/姓名，多为旧数据或生成时未登录）`
  if (nm && em) return `${label}：${nm}（${em}）`
  return `${label}：${em || nm}`
})
const reports = ref([])
const listLoading = ref(false)
const dialogVisible = ref(false)
const selectedReport = ref(null)
const deletingReportId = ref(null)

const dialogMediaUrl = computed(() => resolveDialogMediaUrl(selectedReport.value))

const dialogModalityNorm = computed(() => {
  const r = selectedReport.value
  if (!r) return 'text'
  return String(r.modality || inferModality(r) || 'text').toLowerCase()
})

const dialogShowsImage = computed(() => {
  if (!dialogMediaUrl.value) return false
  const m = dialogModalityNorm.value
  if (m === 'video' || m === 'audio') return false
  if (m === 'image') return true
  if (m === 'text' && /\.(png|jpe?g|gif|webp|bmp|svg)(\?|#|$)/i.test(dialogMediaUrl.value)) return true
  return false
})

const dialogShowsVideo = computed(() => {
  if (!dialogMediaUrl.value) return false
  const m = dialogModalityNorm.value
  if (m === 'image' || m === 'audio') return false
  if (m === 'video') return true
  return /\.(mp4|webm|mov|mkv|avi)(\?|#|$)/i.test(dialogMediaUrl.value)
})

const dialogShowsAudio = computed(() => {
  if (!dialogMediaUrl.value) return false
  const m = dialogModalityNorm.value
  if (m === 'image' || m === 'video') return false
  if (m === 'audio') return true
  return /\.(mp3|wav|m4a|aac|ogg|flac)(\?|#|$)/i.test(dialogMediaUrl.value)
})

const dialogNarrativeBlocks = computed(() => extractReportNarrativeBlocks(selectedReport.value?.content))

/**
 * 以分块展示 content 中的【检测对象】等段落（与媒体分支一致）。
 * 文本：含标准标题时启用，否则仍用整段 pre；媒体：未展示完整 content 时启用。
 */
const dialogShowStructuredNarrative = computed(() => {
  if (!selectedReport.value) return false
  const b = dialogNarrativeBlocks.value
  const has = !!(b.detectTarget || b.model || b.riskConclusion || b.thought)
  if (!has) return false
  if (dialogModalityNorm.value === 'text') return true
  if (showMissingDeclaredMedia.value) return true
  if (dialogShowsImage.value && dialogMediaUrl.value) return true
  if (dialogShowsAudio.value && dialogMediaUrl.value) return true
  if (dialogShowsVideo.value && dialogMediaUrl.value) return true
  return false
})

/** 数据库声明为图片/音视频，但无任何可解析路径（旧数据或异常保存） */
const showMissingDeclaredMedia = computed(() => {
  const r = selectedReport.value
  if (!r) return false
  const dec = String(r.declaredModality || '').toLowerCase()
  if (!['image', 'video', 'audio'].includes(dec)) return false
  return !hasReportMediaPayload(r)
})

const dialogTypeChipVisible = computed(() => {
  const r = selectedReport.value
  if (!r) return false
  const d = String(r.declaredModality || '').toLowerCase()
  if (d && d !== 'text') return true
  return !!(dialogMediaUrl.value && (dialogShowsImage.value || dialogShowsVideo.value || dialogShowsAudio.value))
})

const dialogTypeChipLabel = computed(() => {
  const r = selectedReport.value
  const d = String(r?.declaredModality || '').toLowerCase()
  if (d && d !== 'text') return modalityLabel(d)
  if (dialogShowsImage.value) return modalityLabel('image')
  if (dialogShowsVideo.value) return modalityLabel('video')
  if (dialogShowsAudio.value) return modalityLabel('audio')
  return modalityLabel(dialogModalityNorm.value)
})

const RISK_SCORE = {
  high: 100,
  medium: 60,
  low: 20
}

const frequencies = ['每日', '每周', '每月', '每季度', '每年']
const frequency = ref('每周')
const autoGenerate = ref(true)
const includeCharts = ref(true)
const includeRecommendations = ref(true)
const sendEmail = ref(false)

// 从后端加载报告
function buildReportsFetchUrl() {
  const act = getWebActiveAccount()
  const email = String(act?.email || '').trim()
  const base = apiUrl('/api/reports')
  if (!email) return `${base}?_=${Date.now()}`
  const viewerType = isGuardianReports.value ? 'guardian' : 'user'
  const q = new URLSearchParams({
    viewerEmail: email,
    viewerType,
    _: String(Date.now())
  })
  return `${base}?${q.toString()}`
}

async function loadReports() {
  listLoading.value = true
  try {
    const response = await fetch(buildReportsFetchUrl())
    const data = await response.json()
    if (data.success) {
      const rawList = Array.isArray(data.reports) ? data.reports : []
      // 将后端报告格式映射为前端表格格式
      const viewerAcc = getWebActiveAccount()
      const viewerEmail = String(viewerAcc?.email || '').trim()
      const viewerName = String(viewerAcc?.name || '').trim()
      reports.value = rawList.map((report) => {
        const modality = inferModality(report)
        const rawMedia = pickRawMediaUrl(modality, report)
        const authorEmail = String(report.authorEmail || '').trim()
        const authorName = String(report.authorName || '').trim()
        const whoFallback = isGuardianReports.value
          ? '未记录（无生成账号信息）'
          : '未标注（无生成账号信息）'
        let authorDisplay =
          authorName && authorEmail
            ? `${authorName}（${authorEmail}）`
            : authorEmail || authorName || ''
        // 用户端：历史报告未写入生成者时，列表仍可能展示无归属数据，用当前登录账号作为展示兜底
        if (!authorDisplay && !isGuardianReports.value && (viewerName || viewerEmail)) {
          authorDisplay =
            viewerName && viewerEmail
              ? `${viewerName}（${viewerEmail}）`
              : viewerEmail || viewerName
        }
        if (!authorDisplay) authorDisplay = whoFallback
        return {
          id: report.id,
          name: report.title,
          riskLevel: mapSeverityToChinese(report.severity),
          events: report.events,
          date: new Date(report.date),
          method: '手动生成',
          content: report.content || '',
          severity: report.severity,
          risks: report.risks || [],
          actions: report.actions || [],
          summary: report.summary || '',
          declaredModality: String(report.modality || 'text').toLowerCase(),
          modality: String(modality || 'text').toLowerCase(),
          imageUrl: report.imageUrl || '',
          videoUrl: report.videoUrl || '',
          audioUrl: report.audioUrl || '',
          resolvedMediaUrl: rawMedia ? resolveContentUrl(coerceMediaPath(rawMedia)) : '',
          fileInfo: report.fileInfo && typeof report.fileInfo === 'object' ? report.fileInfo : {},
          transcription: report.transcription || '',
          authorEmail,
          authorName,
          authorRole: String(report.authorRole || '').trim(),
          authorDisplay
        }
      })
      // 更新统计
      reportCount.value = reports.value.length
      highRiskReports.value = reports.value.filter(r => r.riskLevel === '高风险').length
      riskDecrease.value = calcRiskDecrease(reports.value)
    }
  } catch (error) {
    console.error('加载报告失败:', error)
  } finally {
    listLoading.value = false
  }
}

function calcRiskDecrease(items) {
  const now = Date.now()
  const dayMs = 24 * 60 * 60 * 1000
  const recent = items.filter((r) => {
    const t = new Date(r.date).getTime()
    return Number.isFinite(t) && now - t <= 30 * dayMs
  })
  if (recent.length < 2) return 0

  const sorted = [...recent].sort((a, b) => new Date(a.date) - new Date(b.date))
  const head = sorted.slice(0, Math.ceil(sorted.length / 2))
  const tail = sorted.slice(Math.ceil(sorted.length / 2))
  const avg = (arr) =>
    arr.reduce((sum, r) => sum + (RISK_SCORE[r.severity] || 0), 0) / Math.max(arr.length, 1)
  const firstAvg = avg(head)
  const secondAvg = avg(tail)
  if (firstAvg <= 0) return 0
  const decrease = ((firstAvg - secondAvg) / firstAvg) * 100
  return Math.max(0, Math.round(decrease))
}

const severityCounts = computed(() => {
  const base = { high: 0, medium: 0, low: 0 }
  for (const r of reports.value) {
    if (r.severity === 'high') base.high += 1
    else if (r.severity === 'medium') base.medium += 1
    else if (r.severity === 'low') base.low += 1
  }
  return base
})

const trendSeries = computed(() => {
  const dayMs = 24 * 60 * 60 * 1000
  const now = new Date()
  const labels = []
  const bucket = new Map()

  for (let i = 6; i >= 0; i -= 1) {
    const d = new Date(now.getTime() - i * dayMs)
    const key = d.toISOString().slice(0, 10)
    labels.push({
      key,
      text: `${d.getMonth() + 1}/${d.getDate()}`
    })
    bucket.set(key, [])
  }

  for (const r of reports.value) {
    const date = new Date(r.date)
    if (Number.isNaN(date.getTime())) continue
    const key = date.toISOString().slice(0, 10)
    if (bucket.has(key)) {
      bucket.get(key).push(RISK_SCORE[r.severity] || 0)
    }
  }

  return labels.map(({ key, text }) => {
    const arr = bucket.get(key) || []
    const value = arr.length
      ? Math.round(arr.reduce((sum, n) => sum + n, 0) / arr.length)
      : 0
    return { label: text, value }
  })
})

const trendLabels = computed(() => trendSeries.value.map((p) => p.label))

const trendPoints = computed(() => {
  const series = trendSeries.value
  if (!series.length) return []
  const max = Math.max(...series.map((s) => s.value), 100)
  const min = 0
  const width = 700
  const height = 260
  const left = 28
  const right = 28
  const top = 20
  const bottom = 28
  const xStep = (width - left - right) / Math.max(series.length - 1, 1)
  const yScale = (height - top - bottom) / Math.max(max - min, 1)

  return series.map((item, idx) => ({
    label: item.label,
    x: left + idx * xStep,
    y: height - bottom - (item.value - min) * yScale
  }))
})

const trendPolylinePoints = computed(() => (
  trendPoints.value.map((p) => `${p.x},${p.y}`).join(' ')
))

function mapSeverityToChinese(severity) {
  switch (severity) {
    case 'high': return '高风险'
    case 'medium': return '中风险'
    case 'low': return '低风险'
    default: return '未知'
  }
}

const viewReport = (report) => {
  console.log('查看报告', report)
  selectedReport.value = report
  dialogVisible.value = true
}
const downloadReport = async (report) => {
  console.log('下载报告', report)
  try {
    const response = await fetch(apiUrl(`/api/reports/${encodeURIComponent(String(report.id))}/download`))
    if (!response.ok) {
      let errorMsg = `下载失败 (状态码: ${response.status})`
      try {
        const errorData = await response.json()
        if (errorData.error) {
          errorMsg += ` - ${errorData.error}`
        }
      } catch (e) {
        // 忽略解析错误
      }
      throw new Error(errorMsg)
    }
    const blob = await response.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${report.name}.txt`
    a.click()
    URL.revokeObjectURL(url)
  } catch (error) {
    console.error('下载报告失败:', error)
    alert('下载报告失败: ' + error.message)
  }
}
const shareReport = (report) => {
  console.log('分享报告', report)
  if (navigator.share) {
    navigator.share({
      title: report.name,
      text: `风险等级：${report.riskLevel}，事件数：${report.events}`,
      url: window.location.href
    })
  } else {
    alert('分享功能需要现代浏览器支持，已复制报告信息到剪贴板')
    navigator.clipboard.writeText(`${report.name} - 风险等级：${report.riskLevel}`)
  }
}

const deleteReport = async (report) => {
  const act = getWebActiveAccount()
  const email = String(act?.email || '').trim()
  if (!email) {
    alert('未检测到当前登录邮箱，无法删除报告')
    return
  }
  if (!window.confirm(`确认删除报告《${report.name}》？删除后不可恢复。`)) {
    return
  }
  deletingReportId.value = report.id
  try {
    const params = new URLSearchParams({
      viewerEmail: email,
      viewerType: 'guardian'
    })
    const path = `/api/reports/${encodeURIComponent(String(report.id))}?${params.toString()}`
    const { response, data } = await requestJsonWithFallback(
      path,
      {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      },
      '删除接口返回了非 JSON 数据，请检查 API 地址与后端服务状态'
    )
    if (!response.ok || !data.success) {
      throw new Error(data.error || '删除失败')
    }
    if (selectedReport.value?.id === report.id) {
      dialogVisible.value = false
      selectedReport.value = null
    }
    await loadReports()
    alert('报告已删除')
  } catch (error) {
    console.error('删除报告失败:', error)
    alert('删除报告失败: ' + error.message + '\n\n若持续出现 HTML 错页，请重启后端服务后重试。')
  } finally {
    deletingReportId.value = null
  }
}
const formatDate = (date) => {
  const d = date instanceof Date ? date : new Date(date)
  if (Number.isNaN(d.getTime())) return '--'
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(d)
}
const getRiskColor = (level) => {
  switch (level) {
    case '低风险': return 'success'
    case '中风险': return 'warning'
    case '高风险': return 'error'
    default: return 'info'
  }
}

watch(
  () => route.name,
  (name) => {
    if (name === 'UserSafetyReport' || name === 'GuardianSafetyReport') {
      loadReports()
    }
  },
  { immediate: true }
)

function onVisibilityChange() {
  if (typeof document === 'undefined' || document.visibilityState !== 'visible') return
  const n = route.name
  if (n === 'UserSafetyReport' || n === 'GuardianSafetyReport') {
    loadReports()
  }
}

onMounted(() => {
  document.addEventListener('visibilitychange', onVisibilityChange)
})

onUnmounted(() => {
  document.removeEventListener('visibilitychange', onVisibilityChange)
})

onBeforeRouteLeave(() => {
  dialogVisible.value = false
  selectedReport.value = null
})
</script>

<style scoped>
.safety-report-root {
  min-height: 100%;
}

.page-shell :deep(.v-card) {
  border-radius: 14px;
  border: 1px solid #e8edf7;
}

.trend-wrap {
  height: 260px;
  border-radius: 10px;
  background: linear-gradient(180deg, #f8fbff 0%, #f3f6fc 100%);
  border: 1px solid #e8edf7;
  overflow: hidden;
}

.trend-svg {
  width: 100%;
  height: 100%;
  display: block;
}

.trend-line {
  fill: none;
  stroke: #2f64f5;
  stroke-width: 3;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.trend-dot {
  fill: #2f64f5;
}

.trend-empty {
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}

.trend-labels {
  margin-top: 10px;
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #64748b;
}

.trend-legend {
  margin-top: 12px;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.report-pre {
  white-space: pre-wrap;
  background: #f5f5f5;
  padding: 12px;
  border-radius: 8px;
  max-height: 320px;
  overflow-y: auto;
  font-size: 13px;
}

.media-shell {
  background: #0f172a0a;
  border-radius: 12px;
  padding: 12px;
  text-align: center;
}

.media-img {
  max-width: 100%;
  max-height: 420px;
  object-fit: contain;
  border-radius: 8px;
}

.media-av {
  width: 100%;
  max-width: 640px;
}

.media-video {
  width: 100%;
  max-height: 420px;
  border-radius: 8px;
  background: #000;
}
</style>

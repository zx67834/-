<template>
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
        <v-card color="warning" variant="tonal">
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
          <v-card-title>
            <v-icon start>mdi-calendar</v-icon>
            报告列表
          </v-card-title>
          <v-card-text>
            <v-data-table :headers="headers" :items="reports" items-per-page="5">
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
            <div class="d-flex justify-center align-center" style="height: 300px; background-color: #f5f5f5; border-radius: 8px;">
              <div class="text-center">
                <v-icon size="64" color="grey">mdi-chart-line</v-icon>
                <p class="text-caption">风险趋势图表（示例）</p>
                <p class="text-caption">此处可集成ECharts等图表库展示风险变化曲线</p>
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>

  <v-dialog v-model="dialogVisible" max-width="800">
    <v-card v-if="selectedReport">
      <v-card-title class="text-h5">{{ selectedReport.name }}</v-card-title>
      <v-card-subtitle>风险等级: {{ selectedReport.riskLevel }} | 生成日期: {{ formatDate(selectedReport.date) }}</v-card-subtitle>
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
        <h4>原始内容</h4>
        <pre style="white-space: pre-wrap; background: #f5f5f5; padding: 12px; border-radius: 4px; max-height: 300px; overflow-y: auto;">{{ selectedReport.content }}</pre>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="primary" @click="dialogVisible = false">关闭</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const reportCount = ref(0)
const highRiskReports = ref(0)
const riskDecrease = ref(15) // 模拟数据

const headers = [
  { title: '报告日期', key: 'date' },
  { title: '报告名称', key: 'name' },
  { title: '风险等级', key: 'riskLevel' },
  { title: '风险事件数', key: 'events' },
  { title: '生成方式', key: 'method' },
  { title: '操作', key: 'actions' }
]

const reports = ref([])
const dialogVisible = ref(false)
const selectedReport = ref(null)

const frequencies = ['每日', '每周', '每月', '每季度', '每年']
const frequency = ref('每周')
const autoGenerate = ref(true)
const includeCharts = ref(true)
const includeRecommendations = ref(true)
const sendEmail = ref(false)

// 从后端加载报告
async function loadReports() {
  try {
    const response = await fetch('http://localhost:7007/api/reports')
    const data = await response.json()
    if (data.success) {
      // 将后端报告格式映射为前端表格格式
      reports.value = data.reports.map(report => ({
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
        summary: report.summary || ''
      }))
      // 更新统计
      reportCount.value = reports.value.length
      highRiskReports.value = reports.value.filter(r => r.riskLevel === '高风险').length
    }
  } catch (error) {
    console.error('加载报告失败:', error)
  }
}

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
    const response = await fetch(`http://localhost:7007/api/reports/${report.id}/download`)
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
const formatDate = (date) => {
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(date)
}
const getRiskColor = (level) => {
  switch (level) {
    case '低风险': return 'success'
    case '中风险': return 'warning'
    case '高风险': return 'error'
    default: return 'info'
  }
}

onMounted(() => {
  loadReports()
})
</script>

<style scoped>
.page-shell :deep(.v-card) {
  border-radius: 14px;
  border: 1px solid #e8edf7;
}
</style>
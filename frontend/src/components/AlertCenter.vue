<template>
  <v-container class="page-shell" max-width="1280">
    <v-row>
      <v-col cols="12">
        <h1 class="text-h4 mb-4">预警中心</h1>
        <p class="text-body-1">实时监控风险事件，查看历史预警记录，管理干预策略。</p>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12" md="4">
        <v-card color="warning" variant="tonal">
          <v-card-title class="d-flex align-center">
            <v-icon start>mdi-alert-circle</v-icon>
            待处理预警
          </v-card-title>
          <v-card-text>
            <div class="text-h2 text-center">{{ pendingCount }}</div>
            <p class="text-center">个未处理事件</p>
          </v-card-text>
          <v-card-actions>
            <v-btn variant="text" block @click="showPending">查看详情</v-btn>
          </v-card-actions>
        </v-card>
      </v-col>

      <v-col cols="12" md="4">
        <v-card color="error" variant="tonal">
          <v-card-title class="d-flex align-center">
            <v-icon start>mdi-alert-octagon</v-icon>
            高风险预警
          </v-card-title>
          <v-card-text>
            <div class="text-h2 text-center">{{ highRiskCount }}</div>
            <p class="text-center">个高风险事件</p>
          </v-card-text>
          <v-card-actions>
            <v-btn variant="text" block @click="showHighRisk">立即处理</v-btn>
          </v-card-actions>
        </v-card>
      </v-col>

      <v-col cols="12" md="4">
        <v-card color="success" variant="tonal">
          <v-card-title class="d-flex align-center">
            <v-icon start>mdi-check-circle</v-icon>
            已处理预警
          </v-card-title>
          <v-card-text>
            <div class="text-h2 text-center">{{ resolvedCount }}</div>
            <p class="text-center">个已处理事件</p>
          </v-card-text>
          <v-card-actions>
            <v-btn variant="text" block @click="showResolved">查看记录</v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12">
        <v-card>
          <v-card-title>
            <v-icon start>mdi-timeline-clock</v-icon>
            实时预警流水
          </v-card-title>
          <v-card-text>
            <v-timeline side="end" align="start">
              <v-timeline-item v-for="alert in alerts" :key="alert.id" :dot-color="alert.color" size="small">
                <template v-slot:opposite>
                  <span class="text-caption">{{ formatTime(alert.time) }}</span>
                </template>
                <v-card>
                  <v-card-title class="text-body-1">{{ alert.title }}</v-card-title>
                  <v-card-text>
                    <p>{{ alert.description }}</p>
                    <v-chip size="small" :color="alert.color" class="mr-2">{{ alert.type }}</v-chip>
                    <v-chip size="small" variant="outlined">{{ alert.source }}</v-chip>
                  </v-card-text>
                  <v-card-actions>
                    <v-btn size="small" variant="text" @click="handleAlert(alert)">干预</v-btn>
                    <v-btn size="small" variant="text" @click="ignoreAlert(alert)">忽略</v-btn>
                  </v-card-actions>
                </v-card>
              </v-timeline-item>
            </v-timeline>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12">
        <v-card>
          <v-card-title>干预策略配置</v-card-title>
          <v-card-text>
            <v-row>
              <v-col cols="12" md="6">
                <v-select v-model="selectedLevel" :items="levels" label="风险等级" variant="outlined"></v-select>
              </v-col>
              <v-col cols="12" md="6">
                <v-select v-model="selectedAction" :items="actions" label="干预动作" variant="outlined"></v-select>
              </v-col>
            </v-row>
            <v-checkbox v-model="autoBlock" label="自动阻断高风险通话" hide-details></v-checkbox>
            <v-checkbox v-model="autoNotify" label="自动通知监护人" hide-details></v-checkbox>
            <v-checkbox v-model="autoReport" label="自动生成报告" hide-details></v-checkbox>
            <v-btn color="primary" class="mt-4">保存策略</v-btn>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref } from 'vue'

const pendingCount = ref(5)
const highRiskCount = ref(2)
const resolvedCount = ref(12)

const alerts = ref([
  {
    id: 1,
    time: new Date('2025-03-02 09:30:00'),
    title: '检测到可疑AI合成语音',
    description: '通话中出现高频异常声纹，疑似AI变声诈骗',
    type: '语音诈骗',
    source: '实时通话',
    color: 'error'
  },
  {
    id: 2,
    time: new Date('2025-03-02 09:15:00'),
    title: '异常转账请求',
    description: '用户尝试向陌生账户转账5000元，不符合历史行为',
    type: '转账风险',
    source: '银行接口',
    color: 'warning'
  },
  {
    id: 3,
    time: new Date('2025-03-02 08:45:00'),
    title: '兼职刷单链接点击',
    description: '用户点击了高风险的兼职刷单广告链接',
    type: '刷单诈骗',
    source: '浏览器监控',
    color: 'warning'
  },
  {
    id: 4,
    time: new Date('2025-03-02 08:20:00'),
    title: '虚假征信网站访问',
    description: '用户访问了冒充央行征信的钓鱼网站',
    type: '虚假征信',
    source: '网络流量',
    color: 'info'
  }
])

const levels = [
  '低风险', '中风险', '高风险', '极高风险'
]
const actions = [
  '仅记录', '弹窗提醒', '语音提醒', '自动阻断', '通知监护人', '联动警方'
]

const selectedLevel = ref('高风险')
const selectedAction = ref('弹窗提醒')
const autoBlock = ref(true)
const autoNotify = ref(true)
const autoReport = ref(false)

const showPending = () => {
  console.log('显示待处理预警')
}
const showHighRisk = () => {
  console.log('显示高风险预警')
}
const showResolved = () => {
  console.log('显示已处理预警')
}
const handleAlert = (alert) => {
  console.log('处理预警', alert)
}
const ignoreAlert = (alert) => {
  console.log('忽略预警', alert)
}
const formatTime = (date) => {
  return new Intl.DateTimeFormat('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }).format(date)
}
</script>

<style scoped>
.page-shell :deep(.v-card) {
  border-radius: 14px;
  border: 1px solid #e8edf7;
}
</style>
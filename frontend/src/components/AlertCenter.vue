<template>
  <v-container class="page-shell" max-width="1280">
    <v-row>
      <v-col cols="12">
        <h1 class="text-h4 mb-4">预警中心</h1>
        <p class="text-body-1">实时监控风险事件，查看历史预警记录，管理干预策略。</p>
        <p v-if="isGuardianRoute" class="text-body-2 text-medium-emphasis mt-2">
          高风险核验通知由服务端记录，收件人为监护人登录邮箱；不会发送真实短信，请在此页查看并与登录邮箱一致。
        </p>
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
            <div class="text-h2 text-center">{{ totalNotifyCount }}</div>
            <p class="text-center">条通知记录</p>
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
            <div class="text-h2 text-center">{{ highRiskNotifyCount }}</div>
            <p class="text-center">条高风险核验通知</p>
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
            <div class="text-h2 text-center">{{ otherNotifyCount }}</div>
            <p class="text-center">条其他通知</p>
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
          <v-card-title class="d-flex align-center flex-wrap">
            <span class="d-flex align-center">
              <v-icon start>mdi-timeline-clock</v-icon>
              实时预警流水
            </span>
            <v-spacer />
            <v-btn size="small" variant="tonal" :loading="loading" @click="loadNotifications">刷新</v-btn>
          </v-card-title>
          <v-card-text>
            <v-alert v-if="notificationsError" type="warning" class="mb-4" density="compact">
              {{ notificationsError }}
            </v-alert>
            <div v-if="loading" class="text-center py-8 text-medium-emphasis">正在加载通知…</div>
            <div v-else-if="!notificationsError && alerts.length === 0" class="text-center py-8 text-medium-emphasis">
              暂无通知记录。请确认已用<strong>接收通知的邮箱</strong>登录；系统自动创建的监护人账号形如 guardian_*@example.com，需用该邮箱登录监护人端查看。
            </div>
            <v-timeline v-else side="end" align="start">
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
                    <v-btn size="small" variant="text" @click="handleAlert(alert)">已知晓</v-btn>
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
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

function getActiveAccount() {
  try {
    const accounts = JSON.parse(localStorage.getItem('web_user_accounts') || '[]')
    const activeIndex = Number(localStorage.getItem('web_active_user_account_index') || 0)
    if (!Array.isArray(accounts)) return null
    return accounts[activeIndex] || accounts[0] || null
  } catch {
    return null
  }
}

const loading = ref(true)
const notificationsError = ref('')
const rawItems = ref([])

const isGuardianRoute = computed(() => route.path.startsWith('/guardian'))

const alerts = computed(() =>
  rawItems.value.map((n) => {
    const isGuardian = n.type === 'guardian-notify'
    return {
      id: n.id,
      time: new Date(n.createdAt || Date.now()),
      title: n.title || '通知',
      description: n.content || '',
      type: isGuardian ? '高风险核验' : n.type === 'sms' ? '短信提醒' : n.type || '系统通知',
      source: isGuardian ? '高风险流程' : '系统',
      color: isGuardian ? 'error' : 'warning'
    }
  })
)

const highRiskNotifyCount = computed(() => rawItems.value.filter((n) => n.type === 'guardian-notify').length)
const otherNotifyCount = computed(() => Math.max(0, rawItems.value.length - highRiskNotifyCount.value))
const totalNotifyCount = computed(() => rawItems.value.length)

async function loadNotifications() {
  const account = getActiveAccount()
  const email = account?.email || ''
  if (!email) {
    loading.value = false
    notificationsError.value = '未读取到登录账号邮箱，请重新登录后再查看预警。'
    rawItems.value = []
    return
  }
  loading.value = true
  notificationsError.value = ''
  try {
    const q = new URLSearchParams({ email })
    const res = await fetch(`/api/notifications?${q}`)
    const data = await res.json()
    if (!res.ok || !data.success) {
      throw new Error(data.error || '加载失败')
    }
    rawItems.value = Array.isArray(data.items) ? data.items : []
  } catch (e) {
    notificationsError.value = e.message || '无法加载通知，请确认后端已启动。'
    rawItems.value = []
  } finally {
    loading.value = false
  }
}

onMounted(loadNotifications)

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
  loadNotifications()
}
const showHighRisk = () => {
  loadNotifications()
}
const showResolved = () => {
  loadNotifications()
}
const handleAlert = () => {
  /* 演示环境仅记录在后端，无已读状态；按钮保留为交互占位 */
}
const formatTime = (date) => {
  return new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit',
    day: '2-digit',
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
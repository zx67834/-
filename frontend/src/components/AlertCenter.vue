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
            <v-tabs v-model="activeTab" color="primary">
              <v-tab value="alerts">
                <v-icon start>mdi-timeline-clock</v-icon>
                实时预警流水
              </v-tab>
              <v-tab value="wechat">
                <v-icon start>mdi-wechat</v-icon>
                微信消息
              </v-tab>
            </v-tabs>
          </v-card-title>
          <v-card-text>
            <v-window v-model="activeTab">
              <v-window-item value="alerts">
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
              </v-window-item>
              <v-window-item value="wechat">
                <!-- 微信消息内容 -->
                <v-row>
                  <v-col cols="12">
                    <div class="d-flex align-center mb-4">
                      <v-btn :color="wechatConnected ? 'error' : 'success'" @click="toggleWechatConnection">
                        <v-icon start>{{ wechatConnected ? 'mdi-stop' : 'mdi-play' }}</v-icon>
                        {{ wechatConnected ? '断开微信监听' : '启动微信监听' }}
                      </v-btn>
                      <v-chip class="ml-4" :color="wechatConnected ? 'green' : 'grey'" text-color="white">
                        {{ wechatConnected ? '已连接' : '未连接' }}
                      </v-chip>
                      <v-text-field
                        v-model="wechatFilter"
                        placeholder="过滤消息..."
                        prepend-inner-icon="mdi-magnify"
                        variant="outlined"
                        density="compact"
                        class="ml-auto"
                        style="max-width: 300px;"
                      ></v-text-field>
                    </div>
                    <v-alert v-if="!wechatMessages.length" type="info" variant="tonal">
                      暂无微信消息。请启动微信监听并确保微信已登录。
                    </v-alert>
                    <v-list v-else lines="two" class="overflow-y-auto" max-height="400">
                      <v-list-item v-for="msg in filteredWechatMessages" :key="msg.id">
                        <template v-slot:prepend>
                          <v-avatar color="primary" size="40">
                            <v-icon>mdi-account</v-icon>
                          </v-avatar>
                        </template>
                        <v-list-item-title>{{ msg.sender }}</v-list-item-title>
                        <v-list-item-subtitle>{{ msg.content }}</v-list-item-subtitle>
                        <template v-slot:append>
                          <span class="text-caption text-medium-emphasis">{{ formatWechatTime(msg.time) }}</span>
                        </template>
                      </v-list-item>
                    </v-list>
                  </v-col>
                </v-row>
              </v-window-item>
            </v-window>
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
            <v-checkbox v-model="autoBlockEnabled" label="自动阻断高风险通话" hide-details></v-checkbox>
            <v-checkbox v-model="autoNotify" label="自动通知监护人" hide-details></v-checkbox>
            <v-checkbox v-model="autoReport" label="自动生成报告" hide-details></v-checkbox>
            <v-btn color="primary" class="mt-4">保存策略</v-btn>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
    <!-- 预警弹窗对话框 -->
    <v-dialog v-model="showAlertDialog" max-width="500">
      <v-card v-if="currentAlert">
        <v-card-title class="d-flex align-center">
          <v-icon :color="currentAlert.color" start>mdi-alert</v-icon>
          {{ currentAlert.title }}
        </v-card-title>
        <v-card-text>
          <p>{{ currentAlert.description }}</p>
          <v-chip size="small" :color="currentAlert.color">{{ currentAlert.type }}</v-chip>
          <v-chip size="small" variant="outlined" class="ml-2">{{ currentAlert.source }}</v-chip>
          <p class="mt-2 text-caption">时间: {{ formatTime(currentAlert.time) }}</p>
        </v-card-text>
        <v-card-actions>
          <v-btn color="primary" variant="text" @click="handleAlert(currentAlert)">干预</v-btn>
          <v-btn color="secondary" variant="text" @click="ignoreAlert(currentAlert)">忽略</v-btn>
          <v-spacer></v-spacer>
          <v-btn color="grey" variant="text" @click="showAlertDialog = false">关闭</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import io from 'socket.io-client'

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
const autoBlockEnabled = ref(true)
const autoNotify = ref(true)
const autoReport = ref(false)

// 微信相关状态
const activeTab = ref('alerts')
const wechatConnected = ref(false)
const wechatMessages = ref([
  // 模拟数据
  {
    id: 1,
    sender: '张三',
    content: '你好，请问这个兼职靠谱吗？',
    time: new Date('2025-03-02 10:00:00')
  },
  {
    id: 2,
    sender: '李四',
    content: '点击链接领取红包：http://fake.com',
    time: new Date('2025-03-02 10:05:00')
  },
  {
    id: 3,
    sender: '王五',
    content: '您的账户有异常登录，请立即验证。',
    time: new Date('2025-03-02 10:10:00')
  }
])
const wechatFilter = ref('')

// Socket.io 连接
const socket = ref(null)
const alertsFromServer = ref([])
const showAlertDialog = ref(false)
const currentAlert = ref(null)

// 过滤后的微信消息
const filteredWechatMessages = computed(() => {
  const filter = wechatFilter.value.toLowerCase()
  if (!filter) return wechatMessages.value
  return wechatMessages.value.filter(msg =>
    msg.sender.toLowerCase().includes(filter) ||
    msg.content.toLowerCase().includes(filter)
  )
})

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
const formatWechatTime = (date) => {
  return new Intl.DateTimeFormat('zh-CN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}
const toggleWechatConnection = () => {
  if (!socket.value || !socket.value.connected) {
    console.error('WebSocket 未连接')
    return
  }
  if (wechatConnected.value) {
    socket.value.emit('stop-wechat')
  } else {
    socket.value.emit('start-wechat')
  }
}

// Socket.io 连接与事件监听
onMounted(() => {
  socket.value = io('http://localhost:7007') // 后端端口
  socket.value.on('connect', () => {
    console.log('已连接到后端 WebSocket')
  })
  socket.value.on('wechat-status', (data) => {
    wechatConnected.value = data.connected
  })
  socket.value.on('wechat-message', (message) => {
    // 添加消息到列表
    wechatMessages.value.unshift({
      id: message.id || Date.now(),
      sender: message.sender || '未知',
      content: message.content,
      time: new Date(message.time || Date.now()),
      risk: message.risk || 'low'
    })
  })
  socket.value.on('alert', (alert) => {
    alertsFromServer.value.unshift(alert)
    currentAlert.value = alert
    showAlertDialog.value = true
    // 如果启用了自动阻断，可以执行额外操作
    if (autoBlockEnabled.value && alert.color === 'error') {
      console.log('自动阻断高风险预警:', alert)
      // 这里可以调用后端阻断接口
    }
  })
})

onUnmounted(() => {
  if (socket.value) {
    socket.value.disconnect()
  }
})
</script>

<style scoped>
.page-shell :deep(.v-card) {
  border-radius: 14px;
  border: 1px solid #e8edf7;
}
</style>
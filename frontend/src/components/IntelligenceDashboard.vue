<template>
  <v-container class="dashboard-wrap" max-width="1280">
    <v-row class="mt-2 mb-4" dense>
      <v-col v-for="card in detectCards" :key="card.title" cols="12" md="3">
        <v-card class="detect-card" :class="card.colorClass" @click="goToQuickStart(card.mode)">
          <div class="detect-chip"></div>
          <div class="detect-title">{{ card.title }}</div>
          <div class="detect-subtitle">{{ card.subtitle }}</div>
          <v-btn size="small" color="white" variant="tonal" class="detect-btn">点击进行诈骗检测</v-btn>
        </v-card>
      </v-col>
    </v-row>

    <v-row dense>
      <v-col cols="12" lg="4">
        <v-card class="panel-card h-100">
          <div class="panel-title">智能助手问答</div>
          <div class="qa-tabs">
            <span @click="sendPreset('如何识别诈骗？')" :class="{ active: presetActive === 1 }">如何识别诈骗？</span>
            <span @click="sendPreset('联系我们派出所是什么？')" :class="{ active: presetActive === 2 }">联系我们派出所是什么？</span>
          </div>
          <div class="qa-body" ref="chatContainer">
            <div v-for="(msg, index) in chatMessages" :key="index" :class="['message', msg.sender]">
              <div class="bubble" :class="msg.sender">{{ msg.text }}</div>
            </div>
            <div v-if="loading" class="loading">助手正在思考...</div>
          </div>
          <div class="qa-input-row">
            <v-text-field v-model="userInput" density="compact" hide-details variant="outlined" placeholder="请输入您的问题，例如：如何防范电信诈骗？" @keyup.enter="sendMessage" />
            <v-btn color="primary" class="ml-2" @click="sendMessage" :loading="loading">发送</v-btn>
          </div>
        </v-card>
      </v-col>

      <v-col cols="12" lg="5">
        <v-card class="panel-card h-100">
          <div class="panel-title panel-title-between">
            <span>典型诈骗案例科普</span>
            <div>
              <v-btn size="x-small" icon="mdi-chevron-left" variant="text"></v-btn>
              <v-btn size="x-small" icon="mdi-chevron-right" variant="text"></v-btn>
            </div>
          </div>
          <div class="video-placeholder">
            <v-icon size="44" color="white">mdi-play</v-icon>
          </div>
          <div class="case-content">
            <h3>【冒充公检法】一个电话骗走老人养老金！</h3>
            <div class="case-actions">
              <v-chip size="small" color="primary" variant="tonal">音视频讲解</v-chip>
              <v-btn size="small" color="primary" variant="flat">查看详情</v-btn>
              <v-btn size="small" variant="outlined">收藏</v-btn>
            </div>
          </div>
        </v-card>
      </v-col>

      <v-col cols="12" lg="3">
        <v-card class="panel-card mb-3">
          <div class="panel-title">反诈知识学习</div>
          <div class="simple-item">反诈宣传视频<br><span>点击播放（演示）</span></div>
          <div class="panel-subtitle">安全防范手册</div>
          <v-list density="compact" lines="one">
            <v-list-item title="安全防范手册（PDF）" prepend-icon="mdi-file-document-outline"></v-list-item>
            <v-list-item title="反诈指南（PDF）" prepend-icon="mdi-file-document-outline"></v-list-item>
            <v-list-item title="常见问题（PDF）" prepend-icon="mdi-file-document-outline"></v-list-item>
          </v-list>
        </v-card>

        <v-card class="panel-card">
          <div class="panel-title">公告服务</div>
          <v-list density="comfortable" lines="two">
            <v-list-item title="一键举报" subtitle="快速举报线索" prepend-icon="mdi-numeric-1-circle-outline"></v-list-item>
            <v-list-item title="风险查询" subtitle="号码/网址/账户" prepend-icon="mdi-magnify"></v-list-item>
            <v-list-item title="紧急求助" subtitle="立即联系求助" prepend-icon="mdi-phone-alert-outline"></v-list-item>
          </v-list>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { ref, nextTick } from 'vue'

const router = useRouter()

const detectCards = [
  { title: '文字反诈检测', subtitle: '输入文字即可检测', mode: 'text', colorClass: 'card-red' },
  { title: '图片反诈检测', subtitle: '上传图片识别', mode: 'image', colorClass: 'card-blue' },
  { title: '语音反诈检测', subtitle: '上传语音识别', mode: 'audio', colorClass: 'card-red' },
  { title: '典型诈骗案例', subtitle: '上传视频分析', mode: 'video', colorClass: 'card-blue' }
]

function goToQuickStart(modality) {
  router.push({
    path: '/quickstart',
    query: { tab: modality }
  })
}

// 智能助手问答相关
const chatMessages = ref([
  { text: '你好，我是智能助手。你可以问：如何识别诈骗？', sender: 'bot' }
])
const userInput = ref('')
const loading = ref(false)
const presetActive = ref(1)

function sendPreset(presetText) {
  userInput.value = presetText
  sendMessage()
}

async function sendMessage() {
  const message = userInput.value.trim()
  if (!message) return

  // 添加用户消息
  chatMessages.value.push({ text: message, sender: 'user' })
  userInput.value = ''
  loading.value = true
  presetActive.value = 0

  try {
    const response = await fetch('http://localhost:7007/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ message })
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || '请求失败')
    }

    if (!data.success) {
      throw new Error(data.error || '服务返回错误')
    }

    // 添加助手回复
    chatMessages.value.push({ text: data.reply, sender: 'bot' })
  } catch (error) {
    console.error('智能助手问答失败:', error)
    chatMessages.value.push({ text: `抱歉，服务暂时不可用：${error.message}`, sender: 'bot' })
  } finally {
    loading.value = false
  }

  // 滚动到底部
  nextTick(() => {
    const container = document.querySelector('.qa-body')
    if (container) {
      container.scrollTop = container.scrollHeight
    }
  })
}
</script>

<style scoped>
.dashboard-wrap {
  background: #f3f6fc;
  border-radius: 18px;
  padding: 16px 10px 8px;
}

.detect-card {
  border-radius: 16px;
  padding: 18px;
  color: #ffffff;
  min-height: 136px;
  position: relative;
  overflow: hidden;
  cursor: pointer;
}

.card-red {
  background: linear-gradient(120deg, #f2577a, #e94a6b);
}

.card-blue {
  background: linear-gradient(120deg, #3e82f5, #2665d8);
}

.detect-card::after {
  content: '';
  position: absolute;
  right: -35px;
  top: -45px;
  width: 160px;
  height: 160px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.12);
}

.detect-chip {
  width: 26px;
  height: 26px;
  border-radius: 10px;
  margin-bottom: 8px;
  background: rgba(255, 255, 255, 0.2);
}

.detect-title {
  font-size: 24px;
  font-weight: 700;
  line-height: 1.2;
}

.detect-subtitle {
  margin-top: 4px;
  margin-bottom: 8px;
  color: rgba(255, 255, 255, 0.9);
}

.detect-btn {
  font-size: 12px;
}

.panel-card {
  border-radius: 16px;
  border: 1px solid #e8edf7;
}

.panel-title {
  padding: 14px 16px 10px;
  font-size: 17px;
  font-weight: 700;
  color: #1f2d4d;
  border-bottom: 1px solid #edf1fa;
}

.panel-title-between {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.qa-tabs {
  display: flex;
  gap: 16px;
  padding: 10px 16px;
  color: #7d8cb1;
  font-size: 13px;
}

.qa-tabs .active {
  color: #3568ee;
  font-weight: 600;
}

.qa-body {
  padding: 10px 16px;
  min-height: 330px;
  max-height: 330px;
  overflow-y: auto;
}

.message {
  margin-bottom: 12px;
  display: flex;
}

.message.user {
  justify-content: flex-end;
}

.message.bot {
  justify-content: flex-start;
}

.bubble.user {
  background: #e3f2fd;
  color: #1565c0;
}

.bubble.bot {
  background: #f5f8ff;
  color: #2e3d62;
}

.loading {
  text-align: center;
  color: #7d8cb1;
  font-size: 14px;
  padding: 8px;
}

.bubble {
  max-width: 90%;
  background: #f5f8ff;
  border-radius: 14px;
  padding: 12px;
  color: #2e3d62;
}

.qa-input-row {
  display: flex;
  align-items: center;
  padding: 8px 12px 14px;
}

.video-placeholder {
  height: 190px;
  margin: 14px 16px 0;
  border-radius: 12px;
  background: linear-gradient(135deg, #dce7f8, #c6d7f5);
  display: flex;
  align-items: center;
  justify-content: center;
}

.case-content {
  padding: 14px 16px 16px;
}

.case-content h3 {
  color: #1f2d4d;
  font-size: 24px;
  line-height: 1.3;
}

.case-actions {
  margin-top: 12px;
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
}

.simple-item {
  margin: 12px 16px;
  padding: 12px;
  border: 1px solid #ecf1fb;
  border-radius: 12px;
  font-weight: 600;
}

.simple-item span {
  font-size: 12px;
  font-weight: 400;
  color: #8490ad;
}

.panel-subtitle {
  padding: 6px 16px 0;
  font-weight: 700;
  color: #32456c;
}

@media (max-width: 960px) {
  .case-content h3 {
    font-size: 18px;
  }
}
</style>
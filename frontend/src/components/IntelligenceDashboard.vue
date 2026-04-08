<template>
  <div class="dashboard-page">
    <div class="bg-glow"></div>
    <v-container class="page-shell" fluid>
      <v-row class="header-row">
        <v-col cols="12">
          <div class="header-content">
            <div class="header-left">
              <div class="logo-badge">
                <v-icon size="28">mdi-shield-account</v-icon>
              </div>
              <div>
                <h1 class="page-title">安全中心</h1>
                <p class="page-subtitle">全方位反诈检测与防护，守护您的安全</p>
              </div>
            </div>
          </div>
        </v-col>
      </v-row>

      <v-row class="mt-2 mb-3" dense>
        <v-col v-for="(card, index) in detectCards" :key="card.title" cols="12" md="3">
          <v-card 
            class="detect-card" 
            :class="card.colorClass" 
            @click="goToQuickStart(card.mode)"
            :ripple="true"
          >
            <div class="detect-icon" :style="{ background: getCardColor(card.colorClass) + '20', color: getCardColor(card.colorClass) }">
              <v-icon size="32">{{ card.icon }}</v-icon>
            </div>
            <div class="detect-content">
              <div class="detect-title">{{ card.title }}</div>
              <div class="detect-subtitle">{{ card.subtitle }}</div>
            </div>
            <v-btn size="small" color="primary" variant="elevated" class="detect-btn" :prepend-icon="card.icon">
              立即检测
            </v-btn>
          </v-card>
        </v-col>
      </v-row>

      <v-row dense>
        <v-col cols="12" lg="4" order="1" order-lg="1">
          <v-card class="panel-card h-100">
            <div class="panel-title">
              <v-icon class="panel-icon">mdi-chat</v-icon>
              智能助手问答
            </div>
            <div class="qa-tabs">
              <span 
                v-for="(preset, index) in presetQuestions" 
                :key="index"
                @click="sendPreset(preset)" 
                :class="{ active: presetActive === index }"
              >
                {{ preset }}
              </span>
            </div>
            <div class="qa-body" ref="chatContainer">
              <div v-for="(msg, index) in chatMessages" :key="index" :class="['message', msg.sender]">
                <div class="avatar" v-if="msg.sender === 'bot'">
                  <v-icon size="small">mdi-robot</v-icon>
                </div>
                <div class="bubble" :class="msg.sender">{{ msg.text }}</div>
                <div class="avatar" v-if="msg.sender === 'user'">
                  <v-icon size="small">mdi-account</v-icon>
                </div>
              </div>
              <div v-if="loading" class="loading">
                <div class="loading-dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
                <span>助手正在思考</span>
              </div>
            </div>
            <div class="qa-input-row">
              <v-text-field 
                v-model="userInput" 
                density="compact" 
                hide-details 
                variant="outlined" 
                placeholder="请输入您的问题..." 
                @keyup.enter="sendMessage"
                :disabled="loading"
                clearable
              ></v-text-field>
              <v-btn color="primary" class="ml-2" @click="sendMessage" :loading="loading" :disabled="!userInput.trim()">
                <v-icon size="small">mdi-send</v-icon>
              </v-btn>
            </div>
          </v-card>
        </v-col>

        <v-col cols="12" lg="5" order="2" order-lg="2">
          <v-card class="panel-card h-100">
            <div class="panel-title panel-title-between">
              <span><v-icon class="panel-icon">mdi-play-circle</v-icon>典型诈骗案例科普</span>
              <div class="case-navigation">
                <v-btn size="x-small" icon="mdi-chevron-left" variant="text" @click="prevCase"></v-btn>
                <span class="case-counter">{{ currentCaseIndex + 1 }} / {{ cases.length }}</span>
                <v-btn size="x-small" icon="mdi-chevron-right" variant="text" @click="nextCase"></v-btn>
              </div>
            </div>
            <div class="video-placeholder" @click="playVideo">
              <div class="play-button">
                <v-icon size="44" color="white">mdi-play</v-icon>
              </div>
            </div>
            <div class="case-content">
              <h3>{{ cases[currentCaseIndex].title }}</h3>
              <p class="case-description">{{ cases[currentCaseIndex].description }}</p>
              <div class="case-actions">
                <v-chip size="small" color="primary" variant="tonal">{{ cases[currentCaseIndex].type }}</v-chip>
                <v-btn size="small" color="primary" variant="flat" :prepend-icon="'mdi-eye'">查看详情</v-btn>
                <v-btn size="small" variant="outlined" :prepend-icon="'mdi-bookmark'">收藏</v-btn>
              </div>
            </div>
          </v-card>
        </v-col>

        <v-col cols="12" lg="3" order="3" order-lg="3">
          <v-card class="panel-card mb-3">
            <div class="panel-title">
              <v-icon class="panel-icon">mdi-school</v-icon>
              反诈知识学习
            </div>
            <div class="simple-item" @click="openVideo">
              <div class="item-icon" style="background: #2f64f520; color: #2f64f5;">
                <v-icon size="24">mdi-play-circle</v-icon>
              </div>
              <div class="item-content">
                <span class="item-title">反诈宣传视频</span>
                <span class="item-subtitle">点击播放</span>
              </div>
              <v-icon class="item-arrow">mdi-chevron-right</v-icon>
            </div>
            <div class="panel-subtitle">安全防范手册</div>
            <v-list density="comfortable" lines="one" class="knowledge-list">
              <v-list-item 
                v-for="(doc, index) in documents" 
                :key="index"
                :prepend-icon="doc.icon"
                :title="doc.title"
                @click="openDocument(doc)"
                clickable
              >
                <template #append>
                  <v-icon size="small" color="primary">mdi-download</v-icon>
                </template>
              </v-list-item>
            </v-list>
          </v-card>

          <v-card class="panel-card">
            <div class="panel-title">
              <v-icon class="panel-icon">mdi-bullhorn</v-icon>
              公告服务
            </div>
            <v-list density="comfortable" lines="two" class="service-list">
              <v-list-item 
                v-for="(service, index) in services" 
                :key="index"
                :prepend-icon="service.icon"
                :title="service.title"
                :subtitle="service.subtitle"
                @click="openService(service)"
                clickable
                ripple
              >
                <template #append>
                  <v-icon size="small">mdi-chevron-right</v-icon>
                </template>
              </v-list-item>
            </v-list>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { ref, nextTick } from 'vue'

const router = useRouter()

const detectCards = [
  { title: '文字反诈检测', subtitle: '输入文字即可检测', mode: 'text', colorClass: 'card-red', icon: 'mdi-text' },
  { title: '图片反诈检测', subtitle: '上传图片识别', mode: 'image', colorClass: 'card-blue', icon: 'mdi-image' },
  { title: '语音反诈检测', subtitle: '上传语音识别', mode: 'audio', colorClass: 'card-purple', icon: 'mdi-microphone' },
  { title: '视频反诈分析', subtitle: '上传视频分析', mode: 'video', colorClass: 'card-green', icon: 'mdi-video' }
]

const presetQuestions = ['如何识别诈骗？', '遇到诈骗怎么办？', '联系我们派出所是什么？']
const presetActive = ref(0)

const cases = [
  { 
    title: '【冒充公检法】一个电话骗走老人养老金！', 
    description: '骗子冒充公检法人员，以涉嫌洗钱为名，要求老人转账到安全账户',
    type: '音视频讲解'
  },
  { 
    title: '【网络贷款诈骗】警惕低息贷款陷阱！', 
    description: '无需抵押、秒到账？小心背后的骗局',
    type: '图文教程'
  },
  { 
    title: '【刷单诈骗】轻松赚钱？小心本金不保！', 
    description: '网上兼职刷单，先返小利后吞本金',
    type: '案例分析'
  }
]
const currentCaseIndex = ref(0)

const documents = [
  { title: '安全防范手册（PDF）', icon: 'mdi-file-document-outline' },
  { title: '反诈指南（PDF）', icon: 'mdi-file-document-outline' },
  { title: '常见问题（PDF）', icon: 'mdi-file-document-outline' }
]

const services = [
  { title: '一键举报', subtitle: '快速举报线索', icon: 'mdi-alert-circle-outline' },
  { title: '风险查询', subtitle: '号码/网址/账户', icon: 'mdi-magnify' },
  { title: '紧急求助', subtitle: '立即联系求助', icon: 'mdi-phone-alert-outline' }
]

function getCardColor(colorClass) {
  const map = {
    'card-red': '#EF4444',
    'card-blue': '#3B82F6',
    'card-purple': '#8B5CF6',
    'card-green': '#10B981'
  }
  return map[colorClass] || '#2f64f5'
}

function goToQuickStart(modality) {
  router.push({
    path: '/quickstart',
    query: { tab: modality }
  })
}

function sendPreset(presetText) {
  userInput.value = presetText
  presetActive.value = presetQuestions.indexOf(presetText)
  sendMessage()
}

function prevCase() {
  currentCaseIndex.value = (currentCaseIndex.value - 1 + cases.length) % cases.length
}

function nextCase() {
  currentCaseIndex.value = (currentCaseIndex.value + 1) % cases.length
}

function playVideo() {
  console.log('播放视频')
}

function openVideo() {
  console.log('打开反诈宣传视频')
}

function openDocument(doc) {
  console.log('打开文档:', doc.title)
}

function openService(service) {
  console.log('打开服务:', service.title)
}

const chatMessages = ref([
  { text: '你好，我是智能助手。你可以问我关于反诈的问题！', sender: 'bot' }
])
const userInput = ref('')
const loading = ref(false)
const chatContainer = ref(null)

async function sendMessage() {
  const message = userInput.value.trim()
  if (!message) return

  chatMessages.value.push({ text: message, sender: 'user' })
  userInput.value = ''
  loading.value = true
  presetActive.value = -1

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

    chatMessages.value.push({ text: data.reply, sender: 'bot' })
  } catch (error) {
    console.error('智能助手问答失败:', error)
    chatMessages.value.push({ text: `抱歉，服务暂时不可用：${error.message}`, sender: 'bot' })
  } finally {
    loading.value = false
  }

  nextTick(() => {
    if (chatContainer.value) {
      chatContainer.value.scrollTop = chatContainer.value.scrollHeight
    }
  })
}
</script>

<style scoped>
.dashboard-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #f3f6fc 0%, #eef2f9 100%);
  padding: 12px 0 20px;
  position: relative;
  overflow-x: hidden;
}

.bg-glow {
  position: absolute;
  right: -180rpx;
  top: -100rpx;
  width: 520rpx;
  height: 520rpx;
  background: radial-gradient(circle, rgba(47, 100, 245, 0.18), rgba(47, 100, 245, 0));
  pointer-events: none;
  z-index: 0;
}

.page-shell {
  position: relative;
  z-index: 1;
}

.header-row {
  margin-bottom: 12px;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.logo-badge {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  background: linear-gradient(135deg, #4f94ff, #2f64f5);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  box-shadow: 0 10px 24px rgba(47, 100, 245, 0.3);
}

.page-title {
  font-size: 28px;
  font-weight: 800;
  color: #1f2a44;
  margin: 0;
  line-height: 1.2;
}

.page-subtitle {
  font-size: 14px;
  color: #7d8cb1;
  margin: 2px 0 0 0;
}

.detect-card {
  border-radius: 16px;
  padding: 20px;
  color: #ffffff;
  min-height: 140px;
  position: relative;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  background: linear-gradient(135deg, #f8fafc, #ffffff);
  border: 1px solid #e8edf7;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);
}

.detect-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(47, 100, 245, 0.12);
}

.detect-icon {
  width: 56px;
  height: 56px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12px;
}

.detect-content {
  position: relative;
  z-index: 1;
}

.detect-title {
  font-size: 18px;
  font-weight: 700;
  line-height: 1.3;
  margin-bottom: 4px;
  color: #1f2a44;
}

.detect-subtitle {
  font-size: 13px;
  color: #7d8cb1;
  margin-bottom: 12px;
}

.detect-btn {
  position: relative;
  z-index: 1;
  font-weight: 600;
}

.panel-card {
  border-radius: 16px;
  border: 1px solid #e8edf7;
  background: #ffffff;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);
  overflow: hidden;
}

.panel-title {
  padding: 14px 16px 10px;
  font-size: 16px;
  font-weight: 700;
  color: #1f2a44;
  border-bottom: 1px solid #edf1fa;
  display: flex;
  align-items: center;
  gap: 8px;
}

.panel-icon {
  color: #2f64f5;
  font-size: 20px;
}

.panel-title-between {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.case-navigation {
  display: flex;
  align-items: center;
  gap: 8px;
}

.case-counter {
  font-size: 13px;
  color: #7d8cb1;
  font-weight: 500;
}

.qa-tabs {
  display: flex;
  gap: 8px;
  padding: 10px 16px 6px;
  overflow-x: auto;
  scrollbar-width: none;
}

.qa-tabs::-webkit-scrollbar {
  display: none;
}

.qa-tabs span {
  white-space: nowrap;
  padding: 6px 14px;
  border-radius: 999px;
  color: #7d8cb1;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  background: rgba(125, 140, 177, 0.08);
}

.qa-tabs span:hover {
  background: rgba(47, 100, 245, 0.1);
  color: #2f64f5;
}

.qa-tabs span.active {
  color: #2f64f5;
  font-weight: 600;
  background: rgba(47, 100, 245, 0.15);
}

.qa-body {
  padding: 10px 16px;
  min-height: 300px;
  max-height: 300px;
  overflow-y: auto;
  scrollbar-width: thin;
}

.qa-body::-webkit-scrollbar {
  width: 4px;
}

.qa-body::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 2px;
}

.qa-body::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 2px;
}

.message {
  margin-bottom: 12px;
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

.message.user {
  flex-direction: row-reverse;
}

.message.bot {
  flex-direction: row;
}

.avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #f0f3fa;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.message.user .avatar {
  background: linear-gradient(135deg, #4f8cff, #2f64f5);
  color: white;
}

.message.bot .avatar {
  background: linear-gradient(135deg, #4ade80, #22c55e);
  color: white;
}

.bubble {
  max-width: 80%;
  border-radius: 16px;
  padding: 12px 16px;
  line-height: 1.5;
  word-wrap: break-word;
}

.bubble.user {
  background: linear-gradient(135deg, #4f8cff, #2f64f5);
  color: #ffffff;
  border-bottom-right-radius: 4px;
}

.bubble.bot {
  background: #f5f8ff;
  color: #2e3d62;
  border-bottom-left-radius: 4px;
}

.loading {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px;
  color: #7d8cb1;
  font-size: 13px;
}

.loading-dots {
  display: flex;
  gap: 4px;
}

.loading-dots span {
  width: 6px;
  height: 6px;
  background: #2f64f5;
  border-radius: 50%;
  animation: bounce 1.4s infinite ease-in-out both;
}

.loading-dots span:nth-child(1) {
  animation-delay: -0.32s;
}

.loading-dots span:nth-child(2) {
  animation-delay: -0.16s;
}

@keyframes bounce {
  0%, 80%, 100% {
    transform: scale(0);
  }
  40% {
    transform: scale(1);
  }
}

.qa-input-row {
  display: flex;
  align-items: center;
  padding: 10px 14px 14px;
  gap: 8px;
}

.qa-input-row .v-text-field {
  flex: 1;
}

.video-placeholder {
  height: 200px;
  margin: 14px 16px 0;
  border-radius: 14px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  position: relative;
  overflow: hidden;
}

.video-placeholder::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.2);
  transition: background 0.3s ease;
}

.video-placeholder:hover::before {
  background: rgba(0, 0, 0, 0.3);
}

.play-button {
  position: relative;
  z-index: 1;
  width: 70px;
  height: 70px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.25);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.3s ease;
}

.video-placeholder:hover .play-button {
  transform: scale(1.1);
}

.case-content {
  padding: 14px 16px 18px;
}

.case-content h3 {
  color: #1f2a44;
  font-size: 18px;
  line-height: 1.4;
  font-weight: 700;
  margin-bottom: 6px;
}

.case-description {
  color: #5d6a8a;
  font-size: 13px;
  line-height: 1.6;
  margin-bottom: 12px;
}

.case-actions {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
}

.simple-item {
  margin: 12px 16px;
  padding: 14px;
  border: 1px solid #ecf1fb;
  border-radius: 14px;
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  background: #fafcff;
}

.simple-item:hover {
  background: #f0f5ff;
  border-color: #c8d8fa;
  transform: translateX(4px);
}

.item-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-size: 24px;
}

.item-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.item-title {
  font-weight: 600;
  color: #1f2a44;
  font-size: 14px;
}

.item-subtitle {
  font-size: 12px;
  color: #7d8cb1;
}

.item-arrow {
  color: #aab3c7;
  transition: transform 0.2s ease;
}

.simple-item:hover .item-arrow {
  transform: translateX(4px);
  color: #2f64f5;
}

.panel-subtitle {
  padding: 6px 16px 0;
  font-weight: 700;
  color: #32456c;
  font-size: 14px;
}

.knowledge-list,
.service-list {
  padding: 6px 10px;
}

.knowledge-list .v-list-item,
.service-list .v-list-item {
  border-radius: 12px;
  margin: 4px 0;
  transition: all 0.2s ease;
}

.knowledge-list .v-list-item:hover,
.service-list .v-list-item:hover {
  background: #f5f8ff;
}

@media (max-width: 1200px) {
  .detect-title {
    font-size: 17px;
  }
}

@media (max-width: 960px) {
  .case-content h3 {
    font-size: 16px;
  }
  
  .video-placeholder {
    height: 180px;
  }
  
  .play-button {
    width: 60px;
    height: 60px;
  }
}

@media (max-width: 600px) {
  .detect-card {
    padding: 16px;
    min-height: 130px;
  }
  
  .detect-title {
    font-size: 16px;
  }
  
  .panel-title {
    font-size: 15px;
    padding: 14px 14px 10px;
  }
  
  .simple-item {
    margin: 10px 14px;
    padding: 12px;
  }
}
</style>

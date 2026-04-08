<template>
  <div class="knowledge-page">
    <div class="bg-glow"></div>
    <v-container class="page-shell" fluid>
      <v-row class="header-row">
        <v-col cols="12">
          <div class="header-content">
            <div class="header-left">
              <div class="logo-badge">
                <v-icon size="28">mdi-shield-star</v-icon>
              </div>
              <div>
                <h1 class="page-title">反诈知识库</h1>
                <p class="page-subtitle">深入学习反诈知识，守护您的财产安全</p>
              </div>
            </div>
            <div class="header-right">
              <v-btn color="primary" variant="elevated" class="sync-btn" @click="updateKnowledgeBase" :loading="updating">
                <v-icon start>mdi-sync</v-icon>
                {{ updating ? '同步中...' : '同步更新' }}
              </v-btn>
              <v-btn color="secondary" variant="elevated" @click="openAddDialog">
                <v-icon start>mdi-plus</v-icon>
                新增条目
              </v-btn>
            </div>
          </div>
        </v-col>
      </v-row>

      <v-row class="search-row">
        <v-col cols="12">
          <v-card class="search-card">
            <v-card-text>
              <v-row align="center">
                <v-col cols="12" md="5">
                  <div class="search-input-wrapper">
                    <v-icon class="search-icon">mdi-magnify</v-icon>
                    <input 
                      v-model="searchQuery" 
                      class="search-input" 
                      placeholder="输入关键词检索知识库..."
                      @keyup.enter="performSearch"
                    />
                    <v-btn v-if="searchQuery" icon size="small" variant="text" @click="searchQuery = ''">
                      <v-icon>mdi-close</v-icon>
                    </v-btn>
                  </div>
                </v-col>
                <v-col cols="12" md="3">
                  <v-select 
                    v-model="selectedCategory" 
                    :items="categories" 
                    variant="outlined" 
                    density="compact"
                    label="分类筛选"
                    hide-details
                    :menu-props="{ contentClass: 'select-menu' }"
                  ></v-select>
                </v-col>
                <v-col cols="12" md="2">
                  <v-select 
                    v-model="selectedSource" 
                    :items="sources" 
                    variant="outlined" 
                    density="compact"
                    label="来源筛选"
                    hide-details
                    :menu-props="{ contentClass: 'select-menu' }"
                  ></v-select>
                </v-col>
                <v-col cols="12" md="2">
                  <v-btn color="primary" block variant="elevated" @click="performSearch" class="search-btn">
                    <v-icon start>mdi-magnify</v-icon>
                    搜索
                  </v-btn>
                </v-col>
              </v-row>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <v-row>
        <v-col cols="12" lg="8">
          <v-card class="main-card">
            <v-card-title class="card-title">
              <v-icon class="title-icon">mdi-book-open-page-variant</v-icon>
              知识条目
              <v-chip class="count-chip" color="primary" variant="tonal">{{ filteredItems.length }} 条</v-chip>
            </v-card-title>
            <v-divider></v-divider>
            <v-card-text class="card-content">
              <div v-if="loading" class="loading-state">
                <v-progress-circular indeterminate color="primary" width="3"></v-progress-circular>
                <p>加载中...</p>
              </div>
              <div v-else-if="error" class="error-state">
                <v-icon size="64" color="error">mdi-alert-circle-outline</v-icon>
                <p class="error-text">{{ error }}</p>
                <v-btn color="primary" variant="elevated" @click="fetchKnowledge">重试</v-btn>
              </div>
              <div v-else class="knowledge-list">
                <div 
                  v-for="item in filteredItems" 
                  :key="item.id" 
                  class="knowledge-item"
                  @click="viewDetail(item)"
                >
                  <div class="item-icon" :style="{ background: getCategoryColor(item.category) }">
                    <v-icon :color="'white'">{{ getIconForCategory(item.category) }}</v-icon>
                  </div>
                  <div class="item-content">
                    <div class="item-title">{{ item.title }}</div>
                    <div class="item-desc">{{ item.description }}</div>
                    <div class="item-meta">
                      <v-chip size="small" color="primary" variant="tonal">{{ item.category }}</v-chip>
                      <v-chip size="small" variant="outlined">{{ item.source }}</v-chip>
                      <span class="item-time">
                        <v-icon size="small">mdi-clock-outline</v-icon>
                        {{ formatDate(item.updated) }}
                      </span>
                    </div>
                  </div>
                  <v-icon class="item-arrow">mdi-chevron-right</v-icon>
                </div>
                <div v-if="filteredItems.length === 0" class="empty-state">
                  <v-icon size="80" color="grey-lighten-1">mdi-information-outline</v-icon>
                  <p>未找到匹配的知识条目</p>
                  <v-btn variant="text" color="primary" @click="resetSearch">重置筛选</v-btn>
                </div>
              </div>
            </v-card-text>
          </v-card>

          <v-row class="mt-3 align-stretch">
            <v-col cols="12" md="6">
              <v-card class="sidebar-card h-100">
                <v-card-title class="card-title">
                  <v-icon class="title-icon">mdi-alert-octagon</v-icon>
                  典型诈骗手法
                </v-card-title>
                <v-divider></v-divider>
                <v-card-text class="card-content">
                  <div class="scam-list">
                    <div v-for="scam in scams" :key="scam.id" class="scam-item" @click="learnMore(scam)">
                      <div class="scam-icon" :style="{ background: getScamColor(scam.id) + '20', color: getScamColor(scam.id) }">
                        <v-icon>{{ scam.icon }}</v-icon>
                      </div>
                      <div class="scam-content">
                        <div class="scam-title">{{ scam.title }}</div>
                        <div class="scam-desc">{{ scam.description }}</div>
                      </div>
                      <v-chip size="small" :color="scam.frequency === '极高发' ? 'error' : 'warning'" variant="tonal">{{ scam.frequency }}</v-chip>
                    </div>
                  </div>
                </v-card-text>
              </v-card>
            </v-col>
            <v-col cols="12" md="6">
              <v-card class="sidebar-card h-100">
                <v-card-title class="card-title">
                  <v-icon class="title-icon">mdi-lightning-bolt</v-icon>
                  最新案例
                </v-card-title>
                <v-divider></v-divider>
                <v-card-text class="card-content">
                  <v-timeline side="end" align="start" density="compact">
                    <v-timeline-item 
                      v-for="caseItem in recentCases" 
                      :key="caseItem.id" 
                      dot-color="primary" 
                      size="x-small"
                      @click="viewCase(caseItem)"
                      class="timeline-item"
                    >
                      <div class="timeline-date">{{ formatTime(caseItem.date) }}</div>
                      <div class="timeline-title">{{ caseItem.title }}</div>
                    </v-timeline-item>
                  </v-timeline>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>
        </v-col>

        <v-col cols="12" lg="4">
          <v-card class="sidebar-card">
            <v-card-title class="card-title">
              <v-icon class="title-icon">mdi-chart-pie</v-icon>
              分类统计
            </v-card-title>
            <v-divider></v-divider>
            <v-card-text class="card-content">
              <div class="stat-list">
                <div v-for="cat in categoryStats" :key="cat.name" class="stat-item" @click="filterByCategory(cat.name)">
                  <div class="stat-icon" :style="{ background: getCategoryColor(cat.name) + '20', color: getCategoryColor(cat.name) }">
                    <v-icon>{{ cat.icon }}</v-icon>
                  </div>
                  <span class="stat-name">{{ cat.name }}</span>
                  <v-chip size="small" :color="getCategoryColor(cat.name)" variant="tonal">{{ cat.count }}</v-chip>
                </div>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-container>

    <v-dialog v-model="dialogVisible" max-width="900" persistent>
      <v-card v-if="selectedItem" class="detail-card">
        <v-card-title class="detail-header">
          <div class="detail-title-row">
            <div class="detail-icon" :style="{ background: getCategoryColor(selectedItem.category) }">
              <v-icon :color="'white'">{{ getIconForCategory(selectedItem.category) }}</v-icon>
            </div>
            <div class="detail-title-content">
              <h2 class="detail-title">{{ selectedItem.title }}</h2>
              <div class="detail-meta">
                <v-chip size="small" :color="getCategoryColor(selectedItem.category)" variant="tonal">{{ selectedItem.category }}</v-chip>
                <v-chip size="small" variant="outlined">{{ selectedItem.source }}</v-chip>
                <span class="detail-time">
                  <v-icon size="small">mdi-clock-outline</v-icon>
                  更新于 {{ formatFullDate(selectedItem.updated) }}
                </span>
              </div>
            </div>
          </div>
          <v-btn icon @click="closeDialog" class="close-btn">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <v-divider></v-divider>
        <v-card-text class="detail-content">
          <div v-if="selectedItem.description" class="detail-section">
            <h3 class="section-title">
              <v-icon>mdi-information-outline</v-icon>
              概述
            </h3>
            <p class="section-text">{{ selectedItem.description }}</p>
          </div>
          <div class="detail-section">
            <h3 class="section-title">
              <v-icon>mdi-file-document-outline</v-icon>
              详细内容
            </h3>
            <div class="content-text pre-wrap">{{ selectedItem.content }}</div>
          </div>
        </v-card-text>
        <v-card-actions class="detail-actions">
          <v-spacer></v-spacer>
          <v-btn variant="outlined" @click="closeDialog">关闭</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="dialogAddVisible" max-width="700" persistent>
      <v-card class="add-card">
        <v-card-title class="add-header">
          <span class="add-title">新增知识条目</span>
          <v-btn icon @click="closeAddDialog" class="close-btn">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <v-divider></v-divider>
        <v-card-text class="add-content">
          <v-form @submit.prevent="submitNewItem">
            <v-text-field
              v-model="newItem.title"
              label="标题"
              variant="outlined"
              required
              class="form-field"
            ></v-text-field>
            <v-textarea
              v-model="newItem.description"
              label="描述"
              variant="outlined"
              rows="2"
              class="form-field"
            ></v-textarea>
            <v-textarea
              v-model="newItem.content"
              label="详细内容"
              variant="outlined"
              rows="6"
              class="form-field"
            ></v-textarea>
            <v-row>
              <v-col cols="6">
                <v-select
                  v-model="newItem.category"
                  :items="categories.filter(c => c !== '全部')"
                  label="分类"
                  variant="outlined"
                  required
                ></v-select>
              </v-col>
              <v-col cols="6">
                <v-select
                  v-model="newItem.source"
                  :items="sources.filter(s => s !== '全部')"
                  label="来源"
                  variant="outlined"
                  required
                ></v-select>
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>
        <v-card-actions class="add-actions">
          <v-spacer></v-spacer>
          <v-btn variant="outlined" @click="closeAddDialog">取消</v-btn>
          <v-btn color="primary" variant="elevated" @click="submitNewItem">提交</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snackbar.show" :color="snackbar.color" timeout="2500">
      {{ snackbar.message }}
    </v-snackbar>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

const searchQuery = ref('')
const selectedCategory = ref('全部')
const selectedSource = ref('全部')
const loading = ref(false)
const error = ref(null)
const updating = ref(false)
const selectedItem = ref(null)
const dialogVisible = ref(false)
const dialogAddVisible = ref(false)
const snackbar = ref({
  show: false,
  message: '',
  color: 'info'
})
const newItem = ref({
  title: '',
  description: '',
  content: '',
  category: '',
  source: ''
})

const categories = ['全部', 'AI合成语音', '投资理财', '兼职刷单', '虚假征信', '冒充公检法', '网络购物', '情感诈骗', '法律法规', '黑产技术', '慈善诈骗', '虚假票务', '虚假充值', '网络钓鱼', '典型案例库']
const sources = ['全部', '法律法规', '典型案例库', '警方通报', '用户上报', '专家分析', '百度反诈']

const knowledgeItems = ref([])

const categoryStats = computed(() => {
  const stats = {}
  knowledgeItems.value.forEach(item => {
    if (!stats[item.category]) {
      stats[item.category] = { name: item.category, icon: getIconForCategory(item.category), count: 0 }
    }
    stats[item.category].count++
  })
  return Object.values(stats)
})

const recentCases = [
  { id: 1, date: new Date('2025-03-02'), title: '新型AI语音冒充亲友诈骗' },
  { id: 2, date: new Date('2025-03-01'), title: '虚假投资平台"华泰证券"诈骗案' },
  { id: 3, date: new Date('2025-02-28'), title: '刷单兼职诈骗学生群体' }
]

const scams = [
  { id: 1, title: 'AI合成语音诈骗', icon: 'mdi-voice', description: '利用AI模仿亲友声音，请求紧急转账', frequency: '高发' },
  { id: 2, title: '投资理财诈骗', icon: 'mdi-chart-bubble', description: '虚假高收益平台，诱导充值后无法提现', frequency: '高发' },
  { id: 3, title: '兼职刷单诈骗', icon: 'mdi-briefcase', description: '以刷单返利为诱饵，骗取保证金', frequency: '极高发' }
]

const filteredItems = computed(() => {
  let items = knowledgeItems.value
  if (selectedCategory.value !== '全部') {
    items = items.filter(item => item.category === selectedCategory.value)
  }
  if (selectedSource.value !== '全部') {
    items = items.filter(item => item.source === selectedSource.value)
  }
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    items = items.filter(item =>
      item.title.toLowerCase().includes(query) ||
      item.description.toLowerCase().includes(query) ||
      (item.content && item.content.toLowerCase().includes(query))
    )
  }
  return items
})

function getIconForCategory(category) {
  const map = {
    'AI合成语音': 'mdi-robot',
    '投资理财': 'mdi-chart-line',
    '兼职刷单': 'mdi-cash-sync',
    '虚假征信': 'mdi-alert-octagon',
    '冒充公检法': 'mdi-police-badge',
    '网络购物': 'mdi-cart',
    '情感诈骗': 'mdi-heart-broken',
    '法律法规': 'mdi-scale-balance',
    '黑产技术': 'mdi-laptop',
    '慈善诈骗': 'mdi-hand-heart',
    '虚假票务': 'mdi-ticket',
    '虚假充值': 'mdi-cellphone',
    '网络钓鱼': 'mdi-fish',
    '典型案例库': 'mdi-book-open'
  }
  return map[category] || 'mdi-book'
}

function getCategoryColor(category) {
  const map = {
    'AI合成语音': '#8B5CF6',
    '投资理财': '#10B981',
    '兼职刷单': '#F59E0B',
    '虚假征信': '#EF4444',
    '冒充公检法': '#3B82F6',
    '网络购物': '#F97316',
    '情感诈骗': '#EC4899',
    '法律法规': '#6366F1',
    '黑产技术': '#6B7280',
    '慈善诈骗': '#14B8A6',
    '虚假票务': '#06B6D4',
    '虚假充值': '#0EA5E9',
    '网络钓鱼': '#22C55E',
    '典型案例库': '#3B82F6'
  }
  return map[category] || '#6366F1'
}

function getScamColor(id) {
  const colors = ['#EF4444', '#F59E0B', '#10B981']
  return colors[(id - 1) % colors.length]
}

async function fetchKnowledge() {
  loading.value = true
  error.value = null
  try {
    const response = await fetch('http://localhost:7007/api/knowledge')
    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`)
    }
    const data = await response.json()
    if (data.success) {
      knowledgeItems.value = data.items.map(item => ({
        ...item,
        updated: new Date(item.updatedAt)
      }))
    } else {
      throw new Error(data.error || '获取数据失败')
    }
  } catch (err) {
    console.error('获取知识库失败:', err)
    error.value = err.message
  } finally {
    loading.value = false
  }
}

const performSearch = () => {
  console.log('执行搜索', searchQuery.value, selectedCategory.value, selectedSource.value)
}

const resetSearch = () => {
  searchQuery.value = ''
  selectedCategory.value = '全部'
  selectedSource.value = '全部'
}

const filterByCategory = (name) => {
  selectedCategory.value = name
}

const viewDetail = (item) => {
  selectedItem.value = item
  dialogVisible.value = true
}

const closeDialog = () => {
  dialogVisible.value = false
  selectedItem.value = null
}

const openAddDialog = () => {
  dialogAddVisible.value = true
}

const closeAddDialog = () => {
  dialogAddVisible.value = false
  newItem.value = {
    title: '',
    description: '',
    content: '',
    category: '',
    source: ''
  }
}

const submitNewItem = async () => {
  if (!newItem.value.title || !newItem.value.category || !newItem.value.source) {
    showSnackbar('请填写标题、分类和来源', 'error')
    return
  }
  try {
    const response = await fetch('http://localhost:7007/api/knowledge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newItem.value)
    })
    const data = await response.json()
    if (data.success) {
      showSnackbar('新增成功', 'success')
      closeAddDialog()
      await fetchKnowledge()
    } else {
      showSnackbar('新增失败: ' + (data.error || '未知错误'), 'error')
    }
  } catch (err) {
    console.error('新增知识条目失败:', err)
    showSnackbar('网络错误，请稍后重试', 'error')
  }
}

const updateKnowledgeBase = async () => {
  updating.value = true
  try {
    const response = await fetch('http://localhost:7007/api/knowledge/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ count: 3 })
    })
    const data = await response.json()
    if (data.success) {
      showSnackbar(`更新成功，添加了 ${data.added} 条新条目`, 'success')
      await fetchKnowledge()
    } else {
      showSnackbar('更新失败: ' + (data.error || '未知错误'), 'error')
    }
  } catch (err) {
    console.error('更新知识库失败:', err)
    showSnackbar('网络错误，请稍后重试', 'error')
  } finally {
    updating.value = false
  }
}

const learnMore = (scam) => {
  showSnackbar(`学习更多关于 ${scam.title} 的防御措施`, 'info')
}

const viewCase = (caseItem) => {
  showSnackbar(`查看案例：${caseItem.title}`, 'info')
}

const showSnackbar = (message, color = 'info') => {
  snackbar.value.message = message
  snackbar.value.color = color
  snackbar.value.show = true
}

const formatDate = (date) => {
  return new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit',
    day: '2-digit'
  }).format(date)
}

const formatFullDate = (date) => {
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(date)
}

const formatTime = (date) => {
  return new Intl.DateTimeFormat('zh-CN', {
    month: 'short',
    day: 'numeric'
  }).format(date)
}

onMounted(() => {
  fetchKnowledge()
})
</script>

<style scoped>
.knowledge-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #f3f6fc 0%, #eef2f9 100%);
  padding: 12px 0 20px;
  position: relative;
  overflow-x: hidden;
}

.bg-glow {
  position: absolute;
  right: -150px;
  top: -80px;
  width: 500px;
  height: 500px;
  background: radial-gradient(circle, rgba(47, 100, 245, 0.15), rgba(47, 100, 245, 0));
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
  color: #1f2d4d;
  margin: 0;
  line-height: 1.2;
}

.page-subtitle {
  font-size: 14px;
  color: #7d8cb1;
  margin: 2px 0 0 0;
}

.header-right {
  display: flex;
  gap: 12px;
}

.sync-btn {
  font-weight: 600;
}

.search-row {
  margin-bottom: 12px;
}

.search-card {
  border-radius: 16px;
  border: 1px solid #e8edf7;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);
}

.search-input-wrapper {
  display: flex;
  align-items: center;
  background: #f5f8ff;
  border: 1px solid #e0e7f5;
  border-radius: 12px;
  padding: 10px 14px;
  height: 48px;
}

.search-icon {
  color: #8fa3c7;
  margin-right: 10px;
}

.search-input {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  font-size: 15px;
  color: #1f2d4d;
}

.search-input::placeholder {
  color: #9aa9c9;
}

.search-btn {
  font-weight: 600;
  height: 48px;
}

.main-card,
.sidebar-card {
  border-radius: 16px;
  border: 1px solid #e8edf7;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);
  overflow: hidden;
}

.card-title {
  font-size: 16px;
  font-weight: 700;
  color: #1f2d4d;
  padding: 14px 16px 10px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.title-icon {
  color: #2f64f5;
}

.count-chip {
  margin-left: auto;
}

.card-content {
  padding: 12px 16px 16px;
  overflow: hidden;
}

.loading-state,
.error-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
}

.loading-state p,
.error-state p,
.empty-state p {
  color: #7d8cb1;
  margin-top: 16px;
  font-size: 15px;
}

.error-text {
  color: #ef4444 !important;
}

.knowledge-list {
  max-height: calc(100vh - 320px);
  overflow-y: auto;
  overflow-x: hidden;
}

.knowledge-list::-webkit-scrollbar {
  width: 6px;
}

.knowledge-list::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 3px;
}

.knowledge-list::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 3px;
}

.knowledge-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid #f0f4fb;
  cursor: pointer;
  transition: all 0.2s ease;
}

.knowledge-item:last-child {
  border-bottom: none;
}

.knowledge-item:hover {
  background: #f8fbff;
  border-radius: 10px;
}

.item-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.item-content {
  flex: 1;
  min-width: 0;
}

.item-title {
  font-size: 15px;
  font-weight: 600;
  color: #1f2d4d;
  margin-bottom: 2px;
}

.item-desc {
  font-size: 13px;
  color: #5d6a8a;
  line-height: 1.4;
  margin-bottom: 6px;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.item-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.item-time {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: #9aa9c9;
}

.item-arrow {
  color: #aab3c7;
  transition: transform 0.2s ease;
}

.knowledge-item:hover .item-arrow {
  transform: translateX(4px);
  color: #2f64f5;
}

.stat-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-height: calc(100vh - 320px);
  overflow-y: auto;
}

.stat-list::-webkit-scrollbar {
  width: 4px;
}

.stat-list::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 2px;
}

.stat-list::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 2px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 10px;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.stat-item:hover {
  background: #f5f8ff;
}

.stat-icon {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.stat-name {
  flex: 1;
  font-size: 13px;
  font-weight: 500;
  color: #3b445f;
}

.timeline-date {
  font-size: 11px;
  color: #9aa9c9;
  font-weight: 500;
  margin-bottom: 4px;
}

.timeline-title {
  font-size: 13px;
  color: #1f2d4d;
  font-weight: 500;
  line-height: 1.4;
  padding: 10px 12px;
  background: #f8fafc;
  border: 1px solid #f1f5f9;
  border-radius: 10px;
  transition: all 0.2s ease;
  cursor: pointer;
}

.timeline-title:hover {
  background: #f5f8ff;
  border-color: #e0e7f5;
  box-shadow: 0 2px 8px rgba(47, 100, 245, 0.1);
}

.timeline-item {
  cursor: pointer;
  transition: all 0.2s ease;
}

.scam-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.scam-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 12px;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  background: #f8fafc;
  border: 1px solid #f1f5f9;
}

.scam-item:hover {
  background: #f5f8ff;
  border-color: #e0e7f5;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(47, 100, 245, 0.1);
}

.scam-icon {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-size: 18px;
}

.scam-content {
  flex: 1;
  min-width: 0;
}

.scam-title {
  font-size: 14px;
  font-weight: 600;
  color: #1f2d4d;
  margin-bottom: 4px;
}

.scam-desc {
  font-size: 12px;
  color: #7d8cb1;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.detail-card,
.add-card {
  border-radius: 20px;
}

.detail-header,
.add-header {
  padding: 24px 24px 16px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.detail-title-row {
  display: flex;
  gap: 16px;
  flex: 1;
}

.detail-icon {
  width: 56px;
  height: 56px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.12);
}

.detail-title-content {
  flex: 1;
}

.detail-title {
  font-size: 22px;
  font-weight: 700;
  color: #1f2d4d;
  margin: 0 0 8px 0;
}

.detail-meta {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.detail-time {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: #9aa9c9;
}

.close-btn {
  color: #9aa9c9;
}

.detail-content {
  padding: 20px 24px;
}

.detail-section {
  margin-bottom: 24px;
}

.detail-section:last-child {
  margin-bottom: 0;
}

.section-title {
  font-size: 16px;
  font-weight: 700;
  color: #1f2d4d;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.section-text {
  font-size: 15px;
  color: #3b445f;
  line-height: 1.7;
  margin: 0;
}

.content-text {
  font-size: 15px;
  color: #3b445f;
  line-height: 1.8;
}

.pre-wrap {
  white-space: pre-wrap;
  word-wrap: break-word;
}

.detail-actions,
.add-actions {
  padding: 16px 24px 24px;
}

.add-title {
  font-size: 20px;
  font-weight: 700;
  color: #1f2d4d;
}

.add-content {
  padding: 20px 24px;
}

.form-field {
  margin-bottom: 16px;
}

:deep(.v-list-item) {
  border-radius: 12px !important;
}

:deep(.select-menu .v-list-item) {
  margin: 4px 8px !important;
}

:deep(.v-card-text) {
  overflow: hidden;
}
</style>

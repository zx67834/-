<template>
  <v-container class="page-shell" max-width="1280">
    <v-row>
      <v-col cols="12">
        <h1 class="text-h4 mb-4">反诈知识库</h1>
        <p class="text-body-1">学习反诈知识，检索典型案例，了解最新诈骗手法与防御策略。</p>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12">
        <v-card>
          <v-card-title>知识库检索</v-card-title>
          <v-card-text>
            <v-row>
              <v-col cols="12" md="6">
                <v-text-field v-model="searchQuery" label="输入关键词检索" variant="outlined" prepend-inner-icon="mdi-magnify" clearable></v-text-field>
              </v-col>
              <v-col cols="12" md="3">
                <v-select v-model="selectedCategory" :items="categories" label="分类筛选" variant="outlined"></v-select>
              </v-col>
              <v-col cols="12" md="3">
                <v-select v-model="selectedSource" :items="sources" label="来源筛选" variant="outlined"></v-select>
              </v-col>
            </v-row>
            <v-btn color="primary" @click="performSearch">搜索</v-btn>
            <v-btn variant="text" class="ml-2" @click="resetSearch">重置</v-btn>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12" md="8">
        <v-card>
          <v-card-title>知识条目</v-card-title>
          <v-card-text>
            <div v-if="loading" class="text-center py-8">
              <v-progress-circular indeterminate color="primary"></v-progress-circular>
              <p class="mt-2">加载中...</p>
            </div>
            <div v-else-if="error" class="text-center py-8">
              <v-alert type="error" variant="tonal">
                {{ error }}
              </v-alert>
              <v-btn color="primary" @click="fetchKnowledge" class="mt-4">重试</v-btn>
            </div>
            <div v-else>
              <v-list v-if="filteredItems.length > 0">
                <v-list-item v-for="item in filteredItems" :key="item.id" three-line>
                  <template v-slot:prepend>
                    <v-icon :color="item.iconColor">{{ item.icon }}</v-icon>
                  </template>
                  <v-list-item-title>{{ item.title }}</v-list-item-title>
                  <v-list-item-subtitle>{{ item.description }}</v-list-item-subtitle>
                  <v-list-item-subtitle class="text-caption">
                    <v-chip size="x-small" class="mr-1">{{ item.category }}</v-chip>
                    <v-chip size="x-small" variant="outlined">{{ item.source }}</v-chip>
                    · 更新时间：{{ formatDate(item.updated) }}
                  </v-list-item-subtitle>
                  <template v-slot:append>
                    <v-btn size="small" variant="text" @click="viewDetail(item)">查看</v-btn>
                  </template>
                </v-list-item>
              </v-list>
              <div v-else class="text-center py-8">
                <v-icon size="large" color="grey">mdi-information-outline</v-icon>
                <p class="mt-2">未找到匹配的知识条目</p>
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="4">
        <v-card>
          <v-card-title>分类统计</v-card-title>
          <v-card-text>
            <v-list>
              <v-list-item v-for="cat in categoryStats" :key="cat.name">
                <template v-slot:prepend>
                  <v-icon>{{ cat.icon }}</v-icon>
                </template>
                <v-list-item-title>{{ cat.name }}</v-list-item-title>
                <template v-slot:append>
                  <v-chip size="small">{{ cat.count }}</v-chip>
                </template>
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>

        <v-card class="mt-4">
          <v-card-title>最新案例</v-card-title>
          <v-card-text>
            <v-timeline side="end" density="compact">
              <v-timeline-item v-for="caseItem in recentCases" :key="caseItem.id" dot-color="primary" size="x-small">
                <div class="text-caption">{{ formatTime(caseItem.date) }}</div>
                <div class="text-body-2">{{ caseItem.title }}</div>
              </v-timeline-item>
            </v-timeline>
          </v-card-text>
        </v-card>

        <v-card class="mt-4">
          <v-card-title>知识库更新</v-card-title>
          <v-card-text>
            <p class="text-body-2">知识库基于向量数据库存储，支持相似案例检索，避免大模型幻觉。</p>
            <v-btn color="primary" block class="mt-2" @click="updateKnowledgeBase" :loading="updating" :disabled="updating">
              {{ updating ? '同步中...' : '同步最新案例' }}
            </v-btn>
            <v-btn color="secondary" block class="mt-2" @click="openAddDialog">新增条目</v-btn>
            <v-btn variant="text" block class="mt-2" @click="viewVectorDB">查看向量数据库</v-btn>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12">
        <v-card>
          <v-card-title>典型诈骗手法</v-card-title>
          <v-card-text>
            <v-row>
              <v-col cols="12" md="4" v-for="scam in scams" :key="scam.id">
                <v-card variant="outlined">
                  <v-card-title class="text-body-1">
                    <v-icon start>{{ scam.icon }}</v-icon>
                    {{ scam.title }}
                  </v-card-title>
                  <v-card-text>
                    <p>{{ scam.description }}</p>
                    <v-chip size="small" color="error" class="mr-1">高风险</v-chip>
                    <v-chip size="small" variant="outlined">{{ scam.frequency }}</v-chip>
                  </v-card-text>
                  <v-card-actions>
                    <v-btn size="small" variant="text" @click="learnMore(scam)">学习防御</v-btn>
                  </v-card-actions>
                </v-card>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- 知识条目详情对话框 -->
    <v-dialog v-model="dialogVisible" max-width="800" persistent>
      <v-card v-if="selectedItem">
        <v-card-title class="d-flex justify-space-between align-center">
          <span class="text-h5">{{ selectedItem.title }}</span>
          <v-btn icon @click="closeDialog">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <v-card-subtitle class="d-flex align-center mt-2">
          <v-chip size="small" class="mr-2">{{ selectedItem.category }}</v-chip>
          <v-chip size="small" variant="outlined">{{ selectedItem.source }}</v-chip>
          <span class="ml-2 text-caption">更新时间: {{ formatDate(selectedItem.updated) }}</span>
        </v-card-subtitle>
        <v-card-text>
          <v-divider class="mb-4"></v-divider>
          <p class="text-body-1 font-weight-bold">描述</p>
          <p class="text-body-2 mb-4">{{ selectedItem.description }}</p>
          <p class="text-body-1 font-weight-bold">详细内容</p>
          <div class="text-body-2 pre-wrap">{{ selectedItem.content }}</div>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="primary" @click="closeDialog">关闭</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 新增知识条目对话框 -->
    <v-dialog v-model="dialogAddVisible" max-width="800" persistent>
      <v-card>
        <v-card-title class="d-flex justify-space-between align-center">
          <span class="text-h5">新增知识条目</span>
          <v-btn icon @click="closeAddDialog">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <v-card-text>
          <v-form @submit.prevent="submitNewItem">
            <v-text-field
              v-model="newItem.title"
              label="标题"
              variant="outlined"
              required
              class="mb-4"
            ></v-text-field>
            <v-textarea
              v-model="newItem.description"
              label="描述"
              variant="outlined"
              rows="2"
              class="mb-4"
            ></v-textarea>
            <v-textarea
              v-model="newItem.content"
              label="详细内容"
              variant="outlined"
              rows="6"
              class="mb-4"
            ></v-textarea>
            <v-select
              v-model="newItem.category"
              :items="categories.filter(c => c !== '全部')"
              label="分类"
              variant="outlined"
              required
              class="mb-4"
            ></v-select>
            <v-select
              v-model="newItem.source"
              :items="sources.filter(s => s !== '全部')"
              label="来源"
              variant="outlined"
              required
              class="mb-4"
            ></v-select>
            <v-card-actions>
              <v-spacer></v-spacer>
              <v-btn variant="text" @click="closeAddDialog">取消</v-btn>
              <v-btn color="primary" type="submit">提交</v-btn>
            </v-card-actions>
          </v-form>
        </v-card-text>
      </v-card>
    </v-dialog>
  </v-container>
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
const newItem = ref({
  title: '',
  description: '',
  content: '',
  category: '',
  source: ''
})

const categories = ['全部', 'AI合成语音', '投资理财', '兼职刷单', '虚假征信', '冒充公检法', '网络购物', '情感诈骗']
const sources = ['全部', '法律法规', '典型案例库', '警方通报', '用户上报', '专家分析']

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
  { id: 2, date: new Date('2025-03-01'), title: '虚假投资平台“华泰证券”诈骗案' },
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
    '法律法规': 'mdi-scale-balance'
  }
  return map[category] || 'mdi-book'
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
  // 本地过滤已通过 computed 处理，无需额外操作
  console.log('执行搜索', searchQuery.value, selectedCategory.value, selectedSource.value)
}
const resetSearch = () => {
  searchQuery.value = ''
  selectedCategory.value = '全部'
  selectedSource.value = '全部'
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
  // 重置表单
  newItem.value = {
    title: '',
    description: '',
    content: '',
    category: '',
    source: ''
  }
}
const submitNewItem = async () => {
  // 验证必要字段
  if (!newItem.value.title || !newItem.value.category || !newItem.value.source) {
    alert('请填写标题、分类和来源')
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
      alert('新增成功')
      closeAddDialog()
      // 刷新列表
      await fetchKnowledge()
    } else {
      alert('新增失败: ' + (data.error || '未知错误'))
    }
  } catch (err) {
    console.error('新增知识条目失败:', err)
    alert('网络错误，请稍后重试')
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
      alert(`更新成功，添加了 ${data.added} 条新条目`)
      // 重新加载知识库
      await fetchKnowledge()
    } else {
      alert('更新失败: ' + (data.error || '未知错误'))
    }
  } catch (err) {
    console.error('更新知识库失败:', err)
    alert('网络错误，请稍后重试')
  } finally {
    updating.value = false
  }
}
const viewVectorDB = () => {
  alert('查看向量数据库功能尚未实现')
}
const learnMore = (scam) => {
  alert(`学习更多关于 ${scam.title} 的防御措施`)
}
const formatDate = (date) => {
  return new Intl.DateTimeFormat('zh-CN', {
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
.page-shell :deep(.v-card) {
  border-radius: 14px;
  border: 1px solid #e8edf7;
}
/* 列表项悬停效果 */
.v-list-item:hover {
  background-color: rgba(0, 0, 0, 0.02);
  transition: background-color 0.2s;
}
/* 对话框内容预格式换行 */
.pre-wrap {
  white-space: pre-wrap;
  word-break: break-word;
}
</style>
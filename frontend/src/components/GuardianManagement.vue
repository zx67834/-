<template>
  <v-container class="page-shell" max-width="1280">
    <v-row>
      <v-col cols="12">
        <h1 class="text-h4 mb-4">被监护人管理</h1>
        <p class="text-body-1">
          管理您的被监护人信息，设置紧急联系人，配置风险通知策略。列表与
          <strong>手机小程序「监护人管理」</strong>共用后端绑定数据，添加/删除会实时同步。
        </p>
      </v-col>
    </v-row>

    <v-row v-if="syncError">
      <v-col cols="12">
        <v-alert type="warning" variant="tonal" density="comfortable">{{ syncError }}</v-alert>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12" md="4">
        <v-card color="primary" variant="tonal">
          <v-card-title>已绑定人数</v-card-title>
          <v-card-text>
            <div class="text-h3">{{ wards.length }}</div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" md="4">
        <v-card color="warning" variant="tonal">
          <v-card-title>高风险被监护人</v-card-title>
          <v-card-text>
            <div class="text-h3">{{ highRiskWardCount }}</div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" md="4">
        <v-card color="success" variant="tonal">
          <v-card-title>低/中风险人数</v-card-title>
          <v-card-text>
            <div class="text-h3">{{ normalRiskWardCount }}</div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-row align="stretch">
      <v-col cols="12" md="6" class="d-flex">
        <v-card class="flex-grow-1 w-100 d-flex flex-column">
          <v-card-title class="d-flex align-center flex-wrap" style="gap: 8px;">
            <span class="d-flex align-center">
              <v-icon start>mdi-account-multiple</v-icon>
              被监护人列表
            </span>
            <v-spacer />
            <v-btn
              size="small"
              variant="tonal"
              color="primary"
              :loading="loadingWards"
              prepend-icon="mdi-cloud-sync"
              @click="fetchWardsFromServer"
            >
              从服务端同步
            </v-btn>
          </v-card-title>
          <v-card-text class="flex-grow-1 d-flex flex-column ward-card-body">
            <div class="ward-card-toolbar">
              <v-progress-linear v-if="loadingWards" indeterminate color="primary" class="mb-3" />
              <v-text-field
                v-model="keyword"
                prepend-inner-icon="mdi-magnify"
                label="搜索姓名/账号/手机号"
                variant="outlined"
                density="compact"
                hide-details="auto"
                class="mb-3 ward-search-field"
              />
            </div>
            <v-list class="ward-list flex-grow-1">
              <v-list-item v-for="ward in filteredWards" :key="ward.id">
                <template v-slot:prepend>
                  <v-avatar color="primary">
                    {{ ward.avatar }}
                  </v-avatar>
                </template>
                <v-list-item-title>{{ ward.name }}</v-list-item-title>
                <v-list-item-subtitle>{{ ward.phone }} · {{ ward.account }}</v-list-item-subtitle>
                <template v-slot:append>
                  <v-chip
                    size="small"
                    class="mr-2"
                    :color="ward.riskLevel === '高风险' ? 'error' : (ward.riskLevel === '中风险' ? 'warning' : 'success')"
                  >
                    {{ ward.riskLevel }}
                  </v-chip>
                  <v-btn icon variant="text" @click="editWard(ward)">
                    <v-icon>mdi-pencil</v-icon>
                  </v-btn>
                  <v-btn icon variant="text" @click="deleteWard(ward.id)">
                    <v-icon color="error">mdi-delete</v-icon>
                  </v-btn>
                </template>
              </v-list-item>
            </v-list>
            <v-alert v-if="filteredWards.length === 0" type="info" variant="tonal" class="mt-2">
              暂无匹配的被监护人
            </v-alert>
            <v-btn color="primary" class="mt-4 mt-auto" prepend-icon="mdi-plus" @click="openAddWardDialog">添加被监护人</v-btn>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="6" class="d-flex">
        <v-card class="flex-grow-1 w-100 d-flex flex-column">
          <v-card-title>
            <v-icon start>mdi-bell-alert</v-icon>
            预警通知设置
          </v-card-title>
          <v-card-text class="flex-grow-1 d-flex flex-column">
            <v-switch v-model="notifySMS" label="短信通知" color="primary" hide-details class="my-2"></v-switch>
            <v-switch v-model="notifyPhone" label="电话通知" color="primary" hide-details class="my-2"></v-switch>
            <v-switch v-model="notifyApp" label="App推送" color="primary" hide-details class="my-2"></v-switch>
            <v-divider class="my-4"></v-divider>
            <v-text-field v-model="threshold" label="风险阈值（0‑100）" type="number" min="0" max="100" suffix="%"></v-text-field>
            <v-btn color="primary" block class="mt-auto">保存设置</v-btn>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12">
        <v-card>
          <v-card-title>联动记录</v-card-title>
          <v-card-text>
            <v-data-table :headers="recordHeaders" :items="records" items-per-page="5">
              <template v-slot:item.time="{ item }">
                {{ formatDate(item.time) }}
              </template>
              <template v-slot:item.action="{ item }">
                <v-chip :color="item.action === '通知成功' ? 'success' : 'error'">
                  {{ item.action }}
                </v-chip>
              </template>
            </v-data-table>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- 添加被监护人对话框 -->
    <v-dialog v-model="showAddWardDialog" max-width="500">
      <v-card>
        <v-card-title>添加被监护人</v-card-title>
        <v-card-text>
          <v-text-field v-model="wardForm.name" label="姓名" variant="outlined" required />
          <v-text-field v-model="wardForm.phone" label="手机号" variant="outlined" required />
          <v-text-field v-model="wardForm.account" label="被监护人账号（邮箱）" variant="outlined" required />
          <v-text-field
            v-model="wardForm.password"
            label="被监护人密码"
            :type="showWardPassword ? 'text' : 'password'"
            variant="outlined"
            required
            :append-inner-icon="showWardPassword ? 'mdi-eye-off' : 'mdi-eye'"
            @click:append-inner="showWardPassword = !showWardPassword"
          />
          <v-select v-model="wardForm.relationship" :items="relationships" label="关系" variant="outlined" required />
          <v-select v-model="wardForm.riskLevel" :items="riskLevels" label="风险等级" variant="outlined" />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="showAddWardDialog = false">取消</v-btn>
          <v-btn color="primary" @click="submitAddWard">添加</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 编辑被监护人对话框 -->
    <v-dialog v-model="showEditWardDialog" max-width="500">
      <v-card>
        <v-card-title>编辑被监护人</v-card-title>
        <v-card-text>
          <v-text-field
            :model-value="currentWard.account"
            label="被监护人账号（邮箱）"
            variant="outlined"
            density="comfortable"
            readonly
            class="mb-2"
          />
          <v-text-field v-model="wardForm.name" label="姓名" variant="outlined" required />
          <v-text-field v-model="wardForm.phone" label="手机号" variant="outlined" required />
          <v-select v-model="wardForm.relationship" :items="relationships" label="关系" variant="outlined" required />
          <v-alert type="info" variant="tonal" density="compact" class="mt-2">
            风险等级来自被监护人账号档案，保存绑定后将以服务端数据为准。
          </v-alert>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="showEditWardDialog = false">取消</v-btn>
          <v-btn color="primary" @click="submitEditWard">保存</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup>
import { computed, ref, onMounted } from 'vue'

/** 与 HelloWorld / GuardianLayout 一致：开发环境可走 Vite 代理 /api */
const API_BASE = (() => {
  const raw = import.meta.env.VITE_API_BASE_URL
  if (raw !== undefined && raw !== null && String(raw).trim() !== '') {
    return String(raw).trim().replace(/\/+$/, '')
  }
  return import.meta.env.DEV ? '' : 'http://127.0.0.1:7007'
})()

const apiUrl = (path) => `${API_BASE}${path}`

const wards = ref([])
const keyword = ref('')
const loadingWards = ref(false)
const syncError = ref('')

const activeAccountIndex = Number(localStorage.getItem('web_active_user_account_index') || 0)
const allAccounts = JSON.parse(localStorage.getItem('web_user_accounts') || '[]')
const activeGuardian = allAccounts[activeAccountIndex] || allAccounts[0] || {}
const guardianEmail = activeGuardian.email || ''
const guardianName = activeGuardian.name || '监护人'

const notifySMS = ref(true)
const notifyPhone = ref(true)
const notifyApp = ref(false)
const threshold = ref(70)

const recordHeaders = [
  { title: '时间', key: 'time' },
  { title: '事件类型', key: 'event' },
  { title: '被监护人', key: 'ward' },
  { title: '通知方式', key: 'method' },
  { title: '结果', key: 'action' }
]

const records = ref([])

const showAddWardDialog = ref(false)
const showWardPassword = ref(false)
const showEditWardDialog = ref(false)
const currentWard = ref({})
const wardForm = ref({
  name: '',
  phone: '',
  account: '',
  password: '',
  relationship: '',
  riskLevel: '低风险'
})

const relationships = ['子女', '父母', '配偶', '其他']
const riskLevels = ['低风险', '中风险', '高风险']
const filteredWards = computed(() => {
  const q = keyword.value.trim().toLowerCase()
  if (!q) return wards.value
  return wards.value.filter((ward) => {
    return (
      (ward.name || '').toLowerCase().includes(q) ||
      (ward.phone || '').toLowerCase().includes(q) ||
      (ward.account || '').toLowerCase().includes(q)
    )
  })
})
const highRiskWardCount = computed(() => wards.value.filter(item => item.riskLevel === '高风险').length)
const normalRiskWardCount = computed(() => wards.value.length - highRiskWardCount.value)

const riskLevelText = (raw) => {
  const v = String(raw || '').toLowerCase()
  if (v.includes('high') || v.includes('高')) return '高风险'
  if (v.includes('medium') || v.includes('中')) return '中风险'
  return '低风险'
}

const methodText = (type) => {
  if (type === 'sms') return '短信'
  if (type === 'guardian-notify') return '监护提醒'
  return '系统通知'
}

const eventText = (item) => {
  if (item.type === 'guardian-notify') return '高风险核验通知'
  if (item.type === 'sms') return item.title || '中风险提醒'
  return item.title || '系统通知'
}

const wardText = (item) => {
  const content = String(item.content || '')
  const wardNameMatch = content.match(/被监护人[「"](.*?)[」"]/)
  if (wardNameMatch?.[1]) return wardNameMatch[1]
  const wardEmailMatch = content.match(/\(([^)]+@[^)]+)\)/)
  if (wardEmailMatch?.[1]) return wardEmailMatch[1]
  return '--'
}

const loadSyncRecords = async () => {
  if (!guardianEmail) {
    records.value = []
    return
  }
  try {
    const qs = new URLSearchParams({ email: guardianEmail })
    const res = await fetch(`${apiUrl('/api/notifications')}?${qs.toString()}`)
    const data = await res.json().catch(() => ({}))
    if (!res.ok || data.success === false) {
      throw new Error(data.error || `加载通知失败（${res.status}）`)
    }
    const items = Array.isArray(data.items) ? data.items : []
    records.value = items.map((item) => ({
      time: new Date(item.createdAt || Date.now()),
      event: eventText(item),
      ward: wardText(item),
      method: methodText(item.type),
      action: '通知成功'
    }))
  } catch (e) {
    console.warn(e)
    records.value = []
  }
}

/** 与小程序监护人页同一数据源：GET /api/guardian/links */
const fetchWardsFromServer = async () => {
  syncError.value = ''
  if (!guardianEmail) {
    wards.value = []
    syncError.value = '请使用监护人账号登录后，再查看与被监护人的绑定（与小程序同一邮箱即可同步）。'
    return
  }
  loadingWards.value = true
  try {
    const qs = new URLSearchParams({ guardianEmail })
    const res = await fetch(`${apiUrl('/api/guardian/links')}?${qs.toString()}`)
    const data = await res.json().catch(() => ({}))
    if (!res.ok || data.success === false) {
      throw new Error(data.error || `加载失败（${res.status}）`)
    }
    const items = Array.isArray(data.items) ? data.items : []
    wards.value = items.map((item, idx) => {
      const wEmail = String(item.wardEmail || '').trim()
      const wName = item.wardName || '被监护人'
      return {
        id: item.id ?? `link-${String(item.guardianEmail || '')}-${wEmail}-${idx}`,
        name: wName,
        phone: item.guardianPhone || '',
        account: wEmail,
        avatar: (wName || '被').charAt(0),
        relationship: item.relationship || '家人',
        riskLevel: riskLevelText(item.riskLevel)
      }
    })
  } catch (e) {
    console.warn(e)
    syncError.value = e?.message || '无法从服务端同步，请确认后端已启动（默认 7007）'
    wards.value = []
  } finally {
    loadingWards.value = false
  }
}

onMounted(() => {
  fetchWardsFromServer()
  loadSyncRecords()
})

const openAddWardDialog = () => {
  wardForm.value = {
    name: '',
    phone: '',
    account: '',
    password: '',
    relationship: '',
    riskLevel: '低风险'
  }
  showWardPassword.value = false
  showAddWardDialog.value = true
}

const openEditWardDialog = (ward) => {
  currentWard.value = { ...ward }
  wardForm.value = {
    name: ward.name,
    phone: ward.phone,
    account: ward.account,
    relationship: ward.relationship,
    riskLevel: ward.riskLevel
  }
  showEditWardDialog.value = true
}

const editWard = (ward) => {
  openEditWardDialog(ward)
}

const deleteWard = async (id) => {
  if (!confirm('确定要解除与该被监护人的绑定吗？（网页与小程序将同步更新）')) return
  const removed = wards.value.find((ward) => ward.id === id)
  if (!removed?.account) return
  try {
    const res = await fetch(apiUrl('/api/guardian/unlink'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        guardianEmail,
        wardEmail: removed.account
      })
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok || data.success === false) {
      throw new Error(data.error || '解除绑定失败')
    }
    await fetchWardsFromServer()
  } catch (e) {
    alert(e?.message || '删除失败')
  }
}

const submitAddWard = async () => {
  const { name, phone, relationship, riskLevel, account, password } = wardForm.value
  if (!name || !phone || !relationship || !account || !password) {
    alert('请填写所有必填字段（含被监护人账号密码）')
    return
  }

  if (!account.includes('@')) {
    alert('被监护人账号需为有效邮箱')
    return
  }

  try {
    const response = await fetch(apiUrl('/api/auth/login'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: account,
        password
      })
    })
    const contentType = response.headers.get('content-type') || ''
    const responseText = await response.text()
    let data = null
    if (contentType.includes('application/json')) {
      data = JSON.parse(responseText)
    } else {
      throw new Error('认证服务返回了非 JSON 数据，请检查后端服务是否正常启动')
    }

    if (!response.ok || !data.success) {
      throw new Error(data.error || '被监护人账号或密码错误')
    }

    const wardUser = data.user || {}
    const wardUserType = wardUser.userType || '用户'
    if (wardUserType === '监护人') {
      alert('该账号是监护人账号，不能作为被监护人绑定')
      return
    }

    const duplicated = wards.value.some(item => item.account === account)
    if (duplicated) {
      alert('该被监护人账号已绑定')
      return
    }

    const linkRes = await fetch(apiUrl('/api/guardian/link'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        guardianEmail,
        guardianName,
        guardianPhone: activeGuardian.phone || phone || '',
        wardEmail: account,
        wardName: wardUser.name || name,
        relationship
      })
    })
    const linkData = await linkRes.json().catch(() => ({}))
    if (!linkRes.ok || linkData.success === false) {
      throw new Error(linkData.error || '写入监护绑定失败')
    }

    await fetchWardsFromServer()
    showAddWardDialog.value = false
    alert('被监护人绑定成功，已与小程序端同步')
  } catch (error) {
    alert(`绑定失败: ${error.message}`)
    return
  }
}

const submitEditWard = async () => {
  if (!wardForm.value.name || !wardForm.value.phone || !wardForm.value.relationship) {
    alert('请填写所有必填字段')
    return
  }
  const wardEmail = currentWard.value.account
  if (!wardEmail) {
    alert('缺少被监护人邮箱，请关闭后重新打开编辑')
    return
  }
  try {
    const res = await fetch(apiUrl('/api/guardian/link'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        guardianEmail,
        guardianName,
        guardianPhone: activeGuardian.phone || '',
        wardEmail,
        wardName: wardForm.value.name,
        relationship: wardForm.value.relationship
      })
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok || data.success === false) {
      throw new Error(data.error || '保存失败')
    }
    await fetchWardsFromServer()
    showEditWardDialog.value = false
  } catch (e) {
    alert(e?.message || '保存失败')
  }
}

const formatDate = (date) => {
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}
</script>

<style scoped>
.page-shell :deep(.v-card) {
  border-radius: 14px;
  border: 1px solid #e8edf7;
}

/* 等高布局下避免搜索框被 flex 纵向撑满 */
.ward-card-body {
  min-height: 0;
}

.ward-card-toolbar {
  flex: 0 0 auto;
  width: 100%;
}

.ward-search-field {
  flex: 0 0 auto;
}

.ward-search-field :deep(.v-input) {
  flex-grow: 0;
}

.ward-search-field :deep(.v-field) {
  /* 避免在列 flex 布局里被拉成过高输入区 */
  align-self: flex-start;
}

.ward-list {
  min-height: 0;
  overflow-y: auto;
}
</style>

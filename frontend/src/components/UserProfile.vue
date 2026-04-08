<template>
  <v-container class="page-shell" max-width="1280">
    <v-row>
      <v-col cols="12">
        <h1 class="text-h4 mb-4">个人中心</h1>
        <p class="text-body-1">管理您的个人信息、偏好设置和历史行为记录。</p>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12" md="4">
        <v-card>
          <v-card-title class="d-flex justify-center">
            <v-avatar size="120" color="primary" @click="handleAvatarClick" style="cursor: pointer;" v-if="!isLoggedIn || !activeAccount.avatar">
              <v-icon size="64">mdi-account</v-icon>
            </v-avatar>
            <v-avatar size="120" @click="handleAvatarClick" style="cursor: pointer;" v-else>
              <img :src="activeAccount.avatar" alt="Avatar" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;" />
            </v-avatar>
          </v-card-title>
          <v-card-text class="text-center">
            <template v-if="isLoggedIn">
              <h2 class="text-h5">{{ activeAccount.name }}</h2>
              <p class="text-caption text-medium-emphasis">{{ activeAccount.role }}</p>
              <v-chip class="my-2" color="primary" size="small">{{ activeAccount.riskLevel }}</v-chip>
              <p class="text-body-2">用户ID: {{ activeAccount.id }}</p>
              <v-btn color="primary" variant="outlined" size="small" class="mt-2" @click="openChangeAvatarDialog">更换头像</v-btn>
            </template>
            <template v-else>
              <h2 class="text-h5">未登录</h2>
              <p class="text-caption text-medium-emphasis">请登录以使用完整功能</p>
              <v-btn color="primary" variant="outlined" size="small" class="mt-2" @click="openLoginDialog">登录</v-btn>
            </template>
          </v-card-text>
        </v-card>

        <v-card class="mt-4">
          <v-card-title class="text-body-1">
            <v-icon start>mdi-account-lock</v-icon>
            账户状态
          </v-card-title>
          <v-card-text>
            <div class="d-flex align-center justify-space-between mb-3">
              <span class="text-body-2">状态</span>
              <v-chip :color="isLoggedIn ? 'success' : 'warning'" size="small">
                {{ isLoggedIn ? '已登录' : '未登录' }}
              </v-chip>
            </div>
            <div class="auth-actions">
              <v-btn variant="text" color="error" :disabled="!isLoggedIn" @click="logout">登出</v-btn>
            </div>
          </v-card-text>
        </v-card>

        <v-card class="mt-4">
          <v-card-title class="text-body-1">
            <v-icon start>mdi-shield-account</v-icon>
            账户安全
          </v-card-title>
          <v-card-text>
            <v-list>
              <v-list-item>
                <template v-slot:prepend>
                  <v-icon>mdi-lock</v-icon>
                </template>
                <v-list-item-title>密码强度</v-list-item-title>
                <template v-slot:append>
                  <v-chip size="small" color="success">强</v-chip>
                </template>
              </v-list-item>
              <v-list-item>
                <template v-slot:prepend>
                  <v-icon>mdi-two-factor-authentication</v-icon>
                </template>
                <v-list-item-title>双重认证</v-list-item-title>
                <template v-slot:append>
                  <v-switch v-model="twoFactor" hide-details></v-switch>
                </template>
              </v-list-item>
              <v-list-item>
                <template v-slot:prepend>
                  <v-icon>mdi-devices</v-icon>
                </template>
                <v-list-item-title>登录设备</v-list-item-title>
                <template v-slot:append>
                  <v-btn size="small" variant="text">管理</v-btn>
                </template>
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="8">
        <v-card>
          <v-card-title class="d-flex justify-between align-center">
            <span>个人信息</span>
            <v-btn v-if="isLoggedIn" color="primary" variant="outlined" size="small" @click="openEditProfileDialog">编辑信息</v-btn>
          </v-card-title>
          <v-card-text>
            <template v-if="isLoggedIn">
              <div class="personal-info-preview">
                <v-row>
                  <v-col cols="12" md="6">
                    <div class="info-item">
                      <span class="info-label">姓名:</span>
                      <span class="info-value">{{ activeAccount.name }}</span>
                    </div>
                  </v-col>
                  <v-col cols="12" md="6">
                    <div class="info-item">
                      <span class="info-label">手机号:</span>
                      <span class="info-value">{{ activeAccount.phone }}</span>
                    </div>
                  </v-col>
                  <v-col cols="12" md="6">
                    <div class="info-item">
                      <span class="info-label">邮箱:</span>
                      <span class="info-value">{{ activeAccount.email }}</span>
                    </div>
                  </v-col>
                  <v-col cols="12" md="6">
                    <div class="info-item">
                      <span class="info-label">角色:</span>
                      <span class="info-value">{{ activeAccount.role }}</span>
                    </div>
                  </v-col>
                  <v-col cols="12">
                    <div class="info-item">
                      <span class="info-label">个人简介:</span>
                      <span class="info-value">{{ activeAccount.bio || '无' }}</span>
                    </div>
                  </v-col>
                </v-row>
              </div>
            </template>
            <template v-else>
              <div class="text-center py-8">
                <v-icon size="64" color="grey">mdi-account-off</v-icon>
                <p class="mt-4 text-body-1">请登录后查看和修改个人信息</p>
              </div>
            </template>
          </v-card-text>
        </v-card>

        <v-card class="mt-4">
          <v-card-title>
            <v-icon start>mdi-account-multiple</v-icon>
            账号管理
          </v-card-title>
          <v-card-text>
            <template v-if="isLoggedIn">
              <v-list>
                <v-list-item
                  v-for="(item, index) in accounts"
                  :key="item.id"
                  @click="switchAccount(index)"
                >
                  <v-list-item-title>{{ item.name }}</v-list-item-title>
                  <v-list-item-subtitle>{{ item.email }}</v-list-item-subtitle>
                  <template #append>
                    <div class="d-flex align-center ga-2">
                      <v-chip v-if="index === activeAccountIndex" size="x-small" color="primary">当前</v-chip>
                      <v-btn
                        v-if="accounts.length > 1"
                        size="x-small"
                        color="error"
                        variant="text"
                        @click.stop="removeAccount(index)"
                      >
                        删除
                      </v-btn>
                    </div>
                  </template>
                </v-list-item>
                <v-list-item @click="openAddAccountDialog" class="add-account-item">
                  <v-list-item-icon>
                    <v-icon color="primary">mdi-plus-circle</v-icon>
                  </v-list-item-icon>
                  <v-list-item-title>添加账号</v-list-item-title>
                </v-list-item>
              </v-list>
            </template>
            <template v-else>
              <div class="text-center py-6">
                <v-icon size="48" color="grey">mdi-account-group</v-icon>
                <p class="mt-3 text-body-2">请登录后管理账号</p>
              </div>
            </template>
          </v-card-text>
        </v-card>

        <v-card class="mt-4">
          <v-card-title>
            <v-icon start>mdi-history</v-icon>
            历史行为分析
          </v-card-title>
          <v-card-text>
            <template v-if="isLoggedIn">
              <v-row>
                <v-col cols="12" md="6">
                  <v-list>
                    <v-list-item>
                      <template v-slot:prepend>
                        <v-icon>mdi-phone</v-icon>
                      </template>
                      <v-list-item-title>通话风险</v-list-item-title>
                      <v-list-item-subtitle>高风险通话 {{ activeAccount.stats.riskCalls }} 次</v-list-item-subtitle>
                    </v-list-item>
                    <v-list-item>
                      <template v-slot:prepend>
                        <v-icon>mdi-web</v-icon>
                      </template>
                      <v-list-item-title>可疑链接点击</v-list-item-title>
                      <v-list-item-subtitle>{{ activeAccount.stats.suspiciousLinks }} 次</v-list-item-subtitle>
                    </v-list-item>
                    <v-list-item>
                      <template v-slot:prepend>
                        <v-icon>mdi-cash</v-icon>
                      </template>
                      <v-list-item-title>异常转账</v-list-item-title>
                      <v-list-item-subtitle>{{ activeAccount.stats.abnormalTransfers }} 次</v-list-item-subtitle>
                    </v-list-item>
                  </v-list>
                </v-col>
                <v-col cols="12" md="6">
                  <v-list>
                    <v-list-item>
                      <template v-slot:prepend>
                        <v-icon>mdi-shield-check</v-icon>
                      </template>
                      <v-list-item-title>风险拦截</v-list-item-title>
                      <v-list-item-subtitle>成功拦截 {{ activeAccount.stats.interceptions }} 次</v-list-item-subtitle>
                    </v-list-item>
                    <v-list-item>
                      <template v-slot:prepend>
                        <v-icon>mdi-bell-ring</v-icon>
                      </template>
                      <v-list-item-title>预警接收</v-list-item-title>
                      <v-list-item-subtitle>{{ activeAccount.stats.alertsReceived }} 条</v-list-item-subtitle>
                    </v-list-item>
                    <v-list-item>
                      <template v-slot:prepend>
                        <v-icon>mdi-chart-line</v-icon>
                      </template>
                      <v-list-item-title>风险评分趋势</v-list-item-title>
                      <v-list-item-subtitle>最近下降 15%</v-list-item-subtitle>
                    </v-list-item>
                  </v-list>
                </v-col>
              </v-row>
            </template>
            <template v-else>
              <div class="text-center py-8">
                <v-icon size="64" color="grey">mdi-history-off</v-icon>
                <p class="mt-4 text-body-1">请登录后查看历史行为分析</p>
              </div>
            </template>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>



    <v-dialog v-model="showLoginDialog" max-width="460">
      <v-card>
        <v-card-title>账号登录</v-card-title>
        <v-card-text>
          <v-text-field v-model="loginForm.email" label="邮箱" variant="outlined" />
          <v-text-field v-model="loginForm.password" label="密码" type="password" variant="outlined" />
          <div v-if="loginError" class="text-red-500 text-sm mt-2">{{ loginError }}</div>
        </v-card-text>
        <v-card-actions>
          <v-btn variant="text" @click="switchToRegister">注册新账号</v-btn>
          <v-spacer />
          <v-btn variant="text" @click="showLoginDialog = false">取消</v-btn>
          <v-btn color="primary" @click="submitLogin">登录</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="showRegisterDialog" max-width="460">
      <v-card>
        <v-card-title>账号注册</v-card-title>
        <v-card-text>
          <v-text-field v-model="registerForm.name" label="姓名" variant="outlined" />
          <v-text-field v-model="registerForm.email" label="邮箱" variant="outlined" />
          <v-text-field v-model="registerForm.password" label="密码" type="password" variant="outlined" />
          <v-text-field v-model="registerForm.phone" label="手机号" variant="outlined" />
          <v-select v-model="registerForm.role" :items="roles" label="角色" variant="outlined" />
        </v-card-text>
        <v-card-actions>
          <v-btn variant="text" @click="switchToLogin">已有账号？登录</v-btn>
          <v-spacer />
          <v-btn variant="text" @click="showRegisterDialog = false">取消</v-btn>
          <v-btn color="primary" @click="submitRegister">注册</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="showLogoutConfirmDialog" max-width="400">
      <v-card>
        <v-card-title>确认登出</v-card-title>
        <v-card-text>确定要退出登录吗？</v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="showLogoutConfirmDialog = false">取消</v-btn>
          <v-btn color="error" @click="confirmLogout">确认登出</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="showChangeAvatarDialog" max-width="500">
      <v-card>
        <v-card-title>更换头像</v-card-title>
        <v-card-text>
          <div class="avatar-section d-flex flex-column align-center mb-4">
            <v-avatar size="100" v-if="!tempAvatar">
              <v-icon size="50">mdi-account</v-icon>
            </v-avatar>
            <img :src="tempAvatar || activeAccount.avatar" class="edit-avatar" v-else />
            <v-btn color="primary" variant="outlined" size="small" class="mt-2" @click="selectAvatar">选择头像</v-btn>
          </div>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="cancelChangeAvatar">取消</v-btn>
          <v-btn color="primary" @click="confirmChangeAvatar">确认更换</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="showAddAccountDialog" max-width="460">
      <v-card>
        <v-card-title>添加账号</v-card-title>
        <v-card-text>
          <v-text-field v-model="addAccountForm.name" label="姓名" variant="outlined" />
          <v-text-field v-model="addAccountForm.email" label="邮箱" variant="outlined" />
          <v-text-field v-model="addAccountForm.password" label="密码" type="password" variant="outlined" />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="closeAddAccountDialog">取消</v-btn>
          <v-btn color="primary" @click="submitAddAccount">添加</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="showEditProfileDialog" max-width="500">
      <v-card>
        <v-card-title>修改个人信息</v-card-title>
        <v-card-text>
          <v-text-field v-model="editForm.name" label="姓名" variant="outlined" />
          <v-text-field v-model="editForm.email" label="邮箱" variant="outlined" />
          <v-text-field v-model="editForm.phone" label="手机号" variant="outlined" />
          <v-select v-model="editForm.role" :items="roles" label="角色" variant="outlined" />
          <v-textarea v-model="editForm.bio" label="个人简介" variant="outlined" rows="2" />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="closeEditProfileDialog">取消</v-btn>
          <v-btn color="primary" @click="submitEditProfile">保存</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup>
import { computed, ref } from 'vue'

const defaultAccounts = [
  {
    id: 'USER_20250302',
    name: '王小明',
    role: '普通用户',
    riskLevel: '中风险',
    phone: '13800138000',
    email: 'wangxm@example.com',
    password: '123456',
    bio: '关注网络安全，希望借助智能助手提升防诈能力。',
    stats: {
      riskCalls: 3,
      suspiciousLinks: 7,
      abnormalTransfers: 1,
      interceptions: 5,
      alertsReceived: 12
    }
  }
]

const accounts = ref(JSON.parse(localStorage.getItem('web_user_accounts') || 'null') || defaultAccounts)
const activeAccountIndex = ref(Number(localStorage.getItem('web_active_user_account_index') || 0))
const isLoggedIn = ref(localStorage.getItem('web_is_logged_in') === '1')

if (activeAccountIndex.value < 0 || activeAccountIndex.value >= accounts.value.length) {
  activeAccountIndex.value = 0
}

const activeAccount = computed(() => accounts.value[activeAccountIndex.value] || accounts.value[0])

const roles = [
  '普通用户', '高风险用户', '老年人', '学生', '财会人员', '企业主'
]

const twoFactor = ref(true)
const showLoginDialog = ref(false)
const showRegisterDialog = ref(false)
const showLogoutConfirmDialog = ref(false)
const showChangeAvatarDialog = ref(false)
const showAddAccountDialog = ref(false)
const loginForm = ref({
  email: '',
  password: ''
})
const registerForm = ref({
  name: '',
  email: '',
  password: '',
  phone: '',
  role: '普通用户'
})
const addAccountForm = ref({
  name: '',
  email: '',
  password: ''
})
const loginError = ref('')
const tempAvatar = ref('')

const saveAccounts = () => {
  localStorage.setItem('web_user_accounts', JSON.stringify(accounts.value))
  localStorage.setItem('web_active_user_account_index', String(activeAccountIndex.value))
  localStorage.setItem('web_is_logged_in', isLoggedIn.value ? '1' : '0')
}

const openLoginDialog = () => {
  loginForm.value = {
    email: '',
    password: ''
  }
  loginError.value = ''
  showLoginDialog.value = true
}

const switchToRegister = () => {
  showLoginDialog.value = false
  registerForm.value = {
    name: '',
    email: '',
    password: '',
    phone: '',
    role: '普通用户'
  }
  showRegisterDialog.value = true
}

const switchToLogin = () => {
  showRegisterDialog.value = false
  loginForm.value = {
    email: '',
    password: ''
  }
  loginError.value = ''
  showLoginDialog.value = true
}

const submitRegister = async () => {
  const name = registerForm.value.name.trim()
  const email = registerForm.value.email.trim()
  const password = registerForm.value.password.trim()
  const phone = registerForm.value.phone.trim()
  const role = registerForm.value.role
  
  if (!name || !email || !password || !phone || !role) {
    alert('请填写所有必填字段')
    return
  }
  if (!email.includes('@')) {
    alert('邮箱格式不正确')
    return
  }
  if (password.length < 6) {
    alert('密码长度至少6位')
    return
  }
  
  try {
    const response = await fetch('http://localhost:7007/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name, email, password, phone, role })
    })
    
    const data = await response.json()
    
    if (!response.ok) {
      throw new Error(data.error || '注册失败')
    }
    
    if (!data.success) {
      throw new Error(data.error || '注册失败')
    }
    
    const user = data.user
    
    // 创建新账号
    const newAccount = {
      id: `USER_${user.id}`,
      name: user.name,
      email: user.email,
      password: password, // 本地存储密码（实际应用中应该加密）
      phone: user.phone,
      role: user.role,
      riskLevel: user.riskLevel,
      bio: user.bio,
      stats: {
        riskCalls: 0,
        suspiciousLinks: 0,
        abnormalTransfers: 0,
        interceptions: 0,
        alertsReceived: 0
      }
    }
    
    accounts.value.push(newAccount)
    activeAccountIndex.value = accounts.value.length - 1
    isLoggedIn.value = true
    saveAccounts()
    showRegisterDialog.value = false
  } catch (error) {
    console.error('注册失败:', error)
    alert('注册失败: ' + error.message)
  }
}

const submitLogin = async () => {
  const email = loginForm.value.email.trim()
  const password = loginForm.value.password.trim()
  
  // 重置错误信息
  loginError.value = ''
  
  if (!email || !password) {
    loginError.value = '请输入邮箱和密码'
    return
  }
  
  if (!email.includes('@')) {
    loginError.value = '邮箱格式不正确'
    return
  }
  
  if (password.length < 6) {
    loginError.value = '密码长度至少6位'
    return
  }

  try {
    const response = await fetch('http://localhost:7007/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    })
    
    const data = await response.json()
    
    if (!response.ok) {
      throw new Error(data.error || '登录失败')
    }
    
    if (!data.success) {
      throw new Error(data.error || '登录失败')
    }
    
    const user = data.user
    
    // 检查用户是否已在本地存储中
    const existingUserIndex = accounts.value.findIndex(u => u.email === user.email)
    if (existingUserIndex >= 0) {
      // 更新现有用户信息
      accounts.value[existingUserIndex] = {
        ...accounts.value[existingUserIndex],
        name: user.name,
        phone: user.phone,
        role: user.role,
        riskLevel: user.riskLevel,
        bio: user.bio
      }
      activeAccountIndex.value = existingUserIndex
    } else {
      // 添加新用户
      const newAccount = {
        id: `USER_${user.id}`,
        name: user.name,
        email: user.email,
        password: password, // 本地存储密码（实际应用中应该加密）
        phone: user.phone,
        role: user.role,
        riskLevel: user.riskLevel,
        bio: user.bio,
        stats: {
          riskCalls: 0,
          suspiciousLinks: 0,
          abnormalTransfers: 0,
          interceptions: 0,
          alertsReceived: 0
        }
      }
      accounts.value.push(newAccount)
      activeAccountIndex.value = accounts.value.length - 1
    }
    
    isLoggedIn.value = true
    saveAccounts()
    showLoginDialog.value = false
  } catch (error) {
    console.error('登录失败:', error)
    loginError.value = error.message
  }
}

const switchAccount = (index) => {
  activeAccountIndex.value = index
  saveAccounts()
}

const removeAccount = (index) => {
  if (accounts.value.length <= 1) return
  const removedCurrent = activeAccountIndex.value === index
  accounts.value.splice(index, 1)
  if (removedCurrent) {
    activeAccountIndex.value = 0
    isLoggedIn.value = false
  } else if (activeAccountIndex.value > index) {
    activeAccountIndex.value -= 1
  }
  saveAccounts()
}

const showEditProfileDialog = ref(false)
const editForm = ref({
  name: '',
  email: '',
  phone: '',
  role: '',
  bio: ''
})

const openEditProfileDialog = () => {
  // 初始化表单数据
  editForm.value = {
    name: activeAccount.value.name,
    email: activeAccount.value.email,
    phone: activeAccount.value.phone,
    role: activeAccount.value.role || '普通用户',
    bio: activeAccount.value.bio || ''
  }
  showEditProfileDialog.value = true
}

const handleAvatarClick = () => {
  // 未登录时点击头像打开登录对话框
  if (!isLoggedIn.value) {
    openLoginDialog()
    return
  }
  
  // 已登录时，如果有头像则预览，否则打开更换头像对话框
  if (activeAccount.value.avatar) {
    previewAvatar()
  } else {
    openChangeAvatarDialog()
  }
}

const previewAvatar = () => {
  // 头像预览
  if (activeAccount.value.avatar) {
    // 创建一个新的图片预览窗口
    const previewWindow = window.open('', '_blank', 'width=800,height=800')
    if (previewWindow) {
      previewWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>头像预览</title>
          <style>
            body {
              margin: 0;
              padding: 20px;
              display: flex;
              justify-content: center;
              align-items: center;
              background-color: #f5f5f5;
            }
            img {
              max-width: 100%;
              max-height: 100%;
              border-radius: 8px;
              box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            }
          </style>
        </head>
        <body>
          <img src="${activeAccount.value.avatar}" alt="头像" />
        </body>
        </html>
      `)
      previewWindow.document.close()
    }
  }
}

const closeEditProfileDialog = () => {
  showEditProfileDialog.value = false
  editForm.value = {
    name: '',
    email: '',
    phone: '',
    avatar: '',
    role: '',
    bio: ''
  }
}

const submitEditProfile = () => {
  const name = editForm.value.name.trim()
  const email = editForm.value.email.trim()
  const phone = editForm.value.phone.trim()
  
  if (!name || !email) return
  if (!email.includes('@')) return
  
  // 检查邮箱是否已被其他账号使用
  const emailExists = accounts.value.some((account, index) => 
    account.email === email && index !== activeAccountIndex.value
  )
  if (emailExists) return
  
  // 更新账号信息
  accounts.value[activeAccountIndex.value] = {
    ...accounts.value[activeAccountIndex.value],
    name,
    email,
    phone,
    role: editForm.value.role,
    bio: editForm.value.bio
  }
  
  saveAccounts()
  closeEditProfileDialog()
}

const openChangeAvatarDialog = () => {
  tempAvatar.value = ''
  showChangeAvatarDialog.value = true
}

const selectAvatar = () => {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'image/*'
  input.onchange = (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        // 这里可以添加上传到服务器的逻辑
        // 暂时只存储本地路径
        tempAvatar.value = event.target.result
      }
      reader.readAsDataURL(file)
    }
  }
  input.click()
}

const confirmChangeAvatar = () => {
  if (tempAvatar.value) {
    // 更新账号头像
    accounts.value[activeAccountIndex.value] = {
      ...accounts.value[activeAccountIndex.value],
      avatar: tempAvatar.value
    }
    saveAccounts()
  }
  showChangeAvatarDialog.value = false
  tempAvatar.value = ''
}

const cancelChangeAvatar = () => {
  showChangeAvatarDialog.value = false
  tempAvatar.value = ''
}

const changeAvatarInEdit = () => {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'image/*'
  input.onchange = (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        // 这里可以添加上传到服务器的逻辑
        // 暂时只存储本地路径
        editForm.value.avatar = event.target.result
      }
      reader.readAsDataURL(file)
    }
  }
  input.click()
}

const logout = () => {
  showLogoutConfirmDialog.value = true
}

const confirmLogout = () => {
  isLoggedIn.value = false
  saveAccounts()
  showLogoutConfirmDialog.value = false
}

const openAddAccountDialog = () => {
  addAccountForm.value = {
    name: '',
    email: '',
    password: ''
  }
  showAddAccountDialog.value = true
}

const closeAddAccountDialog = () => {
  showAddAccountDialog.value = false
  addAccountForm.value = {
    name: '',
    email: '',
    password: ''
  }
}

const submitAddAccount = () => {
  const name = addAccountForm.value.name.trim()
  const email = addAccountForm.value.email.trim()
  const password = addAccountForm.value.password.trim()
  
  if (!name || !email || !password) {
    alert('请输入姓名、邮箱和密码')
    return
  }
  
  if (!email.includes('@')) {
    alert('邮箱格式不正确')
    return
  }
  
  if (password.length < 6) {
    alert('密码长度至少6位')
    return
  }
  
  // 检查邮箱是否已被使用
  const emailExists = accounts.value.some(account => account.email === email)
  if (emailExists) {
    alert('该邮箱已被使用')
    return
  }
  
  // 创建新账号
  const newAccount = {
    id: `USER_${Date.now()}`,
    name,
    email,
    password,
    role: '普通用户',
    riskLevel: '低风险',
    bio: '',
    stats: {
      riskCalls: 0,
      suspiciousLinks: 0,
      abnormalTransfers: 0,
      interceptions: 0,
      alertsReceived: 0
    }
  }
  
  accounts.value.push(newAccount)
  saveAccounts()
  closeAddAccountDialog()
  alert('账号添加成功')
}
</script>

<style scoped>
.page-shell :deep(.v-card) {
  border-radius: 14px;
  border: 1px solid #e8edf7;
}

.auth-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.edit-avatar {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  object-fit: cover;
}

.personal-info-preview {
  padding: 16px;
  background-color: #f8f9fa;
  border-radius: 8px;
}

.info-item {
  margin-bottom: 12px;
  padding: 8px 0;
  border-bottom: 1px solid #e9ecef;
}

.info-item:last-child {
  border-bottom: none;
  margin-bottom: 0;
}

.info-label {
  font-weight: 500;
  color: #495057;
  margin-right: 8px;
  min-width: 80px;
  display: inline-block;
}

.info-value {
  color: #212529;
}
</style>
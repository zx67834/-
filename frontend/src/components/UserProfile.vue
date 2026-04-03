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
            <v-avatar size="120" color="primary">
              <v-icon size="64">mdi-account</v-icon>
            </v-avatar>
          </v-card-title>
          <v-card-text class="text-center">
            <h2 class="text-h5">{{ user.name }}</h2>
            <p class="text-caption text-medium-emphasis">{{ user.role }}</p>
            <v-chip class="my-2" color="primary" size="small">{{ user.riskLevel }}</v-chip>
            <p class="text-body-2">用户ID: {{ user.id }}</p>
            <v-btn color="primary" variant="outlined" size="small" class="mt-2">更换头像</v-btn>
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
          <v-card-title>个人信息</v-card-title>
          <v-card-text>
            <v-form>
              <v-row>
                <v-col cols="12" md="6">
                  <v-text-field v-model="user.name" label="姓名" variant="outlined"></v-text-field>
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field v-model="user.phone" label="手机号" variant="outlined"></v-text-field>
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field v-model="user.email" label="邮箱" variant="outlined"></v-text-field>
                </v-col>
                <v-col cols="12" md="6">
                  <v-select v-model="user.role" :items="roles" label="角色" variant="outlined"></v-select>
                </v-col>
                <v-col cols="12">
                  <v-textarea v-model="user.bio" label="个人简介" variant="outlined" rows="2"></v-textarea>
                </v-col>
              </v-row>
              <v-btn color="primary">保存信息</v-btn>
            </v-form>
          </v-card-text>
        </v-card>

        <v-card class="mt-4">
          <v-card-title>
            <v-icon start>mdi-history</v-icon>
            历史行为分析
          </v-card-title>
          <v-card-text>
            <v-row>
              <v-col cols="12" md="6">
                <v-list>
                  <v-list-item>
                    <template v-slot:prepend>
                      <v-icon>mdi-phone</v-icon>
                    </template>
                    <v-list-item-title>通话风险</v-list-item-title>
                    <v-list-item-subtitle>高风险通话 {{ user.stats.riskCalls }} 次</v-list-item-subtitle>
                  </v-list-item>
                  <v-list-item>
                    <template v-slot:prepend>
                      <v-icon>mdi-web</v-icon>
                    </template>
                    <v-list-item-title>可疑链接点击</v-list-item-title>
                    <v-list-item-subtitle>{{ user.stats.suspiciousLinks }} 次</v-list-item-subtitle>
                  </v-list-item>
                  <v-list-item>
                    <template v-slot:prepend>
                      <v-icon>mdi-cash</v-icon>
                    </template>
                    <v-list-item-title>异常转账</v-list-item-title>
                    <v-list-item-subtitle>{{ user.stats.abnormalTransfers }} 次</v-list-item-subtitle>
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
                    <v-list-item-subtitle>成功拦截 {{ user.stats.interceptions }} 次</v-list-item-subtitle>
                  </v-list-item>
                  <v-list-item>
                    <template v-slot:prepend>
                      <v-icon>mdi-bell-ring</v-icon>
                    </template>
                    <v-list-item-title>预警接收</v-list-item-title>
                    <v-list-item-subtitle>{{ user.stats.alertsReceived }} 条</v-list-item-subtitle>
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
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref } from 'vue'

const user = ref({
  id: 'USER_20250302',
  name: '王小明',
  role: '普通用户',
  riskLevel: '中风险',
  phone: '13800138000',
  email: 'wangxm@example.com',
  bio: '关注网络安全，希望借助智能助手提升防诈能力。',
  stats: {
    riskCalls: 3,
    suspiciousLinks: 7,
    abnormalTransfers: 1,
    interceptions: 5,
    alertsReceived: 12
  }
})

const roles = [
  '普通用户', '高风险用户', '老年人', '学生', '财会人员', '企业主'
]

const twoFactor = ref(true)
</script>

<style scoped>
.page-shell :deep(.v-card) {
  border-radius: 14px;
  border: 1px solid #e8edf7;
}
</style>
<template>
  <v-container class="page-shell" max-width="1280">
    <v-row>
      <v-col cols="12">
        <h1 class="text-h4 mb-4">监护人管理</h1>
        <p class="text-body-1">管理您的监护人信息，设置紧急联系人，配置风险通知策略。</p>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12" md="6">
        <v-card>
          <v-card-title>
            <v-icon start>mdi-account-multiple</v-icon>
            监护人列表
          </v-card-title>
          <v-card-text>
            <v-list>
              <v-list-item v-for="guardian in guardians" :key="guardian.id">
                <template v-slot:prepend>
                  <v-avatar color="primary">
                    {{ guardian.avatar }}
                  </v-avatar>
                </template>
                <v-list-item-title>{{ guardian.name }}</v-list-item-title>
                <v-list-item-subtitle>{{ guardian.phone }}</v-list-item-subtitle>
                <template v-slot:append>
                  <v-btn icon variant="text" @click="editGuardian(guardian)">
                    <v-icon>mdi-pencil</v-icon>
                  </v-btn>
                </template>
              </v-list-item>
            </v-list>
            <v-btn color="primary" class="mt-4" prepend-icon="mdi-plus">添加监护人</v-btn>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="6">
        <v-card>
          <v-card-title>
            <v-icon start>mdi-bell-alert</v-icon>
            预警通知设置
          </v-card-title>
          <v-card-text>
            <v-switch v-model="notifySMS" label="短信通知" color="primary" hide-details class="my-2"></v-switch>
            <v-switch v-model="notifyPhone" label="电话通知" color="primary" hide-details class="my-2"></v-switch>
            <v-switch v-model="notifyApp" label="App推送" color="primary" hide-details class="my-2"></v-switch>
            <v-divider class="my-4"></v-divider>
            <v-text-field v-model="threshold" label="风险阈值（0‑100）" type="number" min="0" max="100" suffix="%"></v-text-field>
            <v-btn color="primary" block>保存设置</v-btn>
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
  </v-container>
</template>

<script setup>
import { ref } from 'vue'

const guardians = ref([
  { id: 1, name: '张三', phone: '13800138000', avatar: '张' },
  { id: 2, name: '李四', phone: '13900139000', avatar: '李' },
  { id: 3, name: '王五', phone: '13600136000', avatar: '王' }
])

const notifySMS = ref(true)
const notifyPhone = ref(true)
const notifyApp = ref(false)
const threshold = ref(70)

const recordHeaders = [
  { title: '时间', key: 'time' },
  { title: '事件类型', key: 'event' },
  { title: '监护人', key: 'guardian' },
  { title: '通知方式', key: 'method' },
  { title: '结果', key: 'action' }
]

const records = ref([
  { time: new Date('2025-03-01 10:30'), event: '高风险通话', guardian: '张三', method: '短信', action: '通知成功' },
  { time: new Date('2025-02-28 15:22'), event: '可疑链接点击', guardian: '李四', method: '电话', action: '通知失败' },
  { time: new Date('2025-02-27 09:15'), event: '异常转账', guardian: '王五', method: 'App推送', action: '通知成功' }
])

const editGuardian = (guardian) => {
  // 编辑监护人
  console.log('编辑监护人', guardian)
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
</style>
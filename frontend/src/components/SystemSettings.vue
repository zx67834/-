<template>
  <v-container class="settings-page" max-width="1280">
    <v-row>
      <v-col cols="12">
        <h1 class="text-h4 mb-4">系统设置</h1>
        <p class="text-body-1">配置多模态反诈智能体的各项参数与系统偏好。</p>
      </v-col>
    </v-row>

    <v-row align="start">
      <v-col cols="12" md="6">
        <v-card>
          <v-card-title>
            <v-icon start>mdi-cog</v-icon>
            基本设置
          </v-card-title>
          <v-card-text>
            <v-select v-model="language" :items="languages" label="界面语言" variant="outlined"></v-select>
            <v-select v-model="theme" :items="themes" label="主题模式" variant="outlined"></v-select>
            <v-select v-model="timezone" :items="timezones" label="时区" variant="outlined"></v-select>
            <v-text-field v-model="apiEndpoint" label="API端点" variant="outlined" hint="后端服务地址"></v-text-field>
          </v-card-text>
        </v-card>

        <v-card class="mt-4">
          <v-card-title>
            <v-icon start>mdi-shield-account</v-icon>
            隐私与安全
          </v-card-title>
          <v-card-text>
            <v-switch v-model="dataCollection" label="匿名数据收集" color="primary" hide-details class="my-2"></v-switch>
            <v-switch v-model="autoUpdate" label="自动更新知识库" color="primary" hide-details class="my-2"></v-switch>
            <v-switch v-model="encryption" label="端到端加密" color="primary" hide-details class="my-2"></v-switch>
            <v-switch v-model="clearHistory" label="退出时清除历史记录" color="primary" hide-details class="my-2"></v-switch>
            <v-btn color="primary" variant="outlined" class="mt-2">隐私政策</v-btn>
          </v-card-text>
        </v-card>

        <v-card class="mt-4">
          <v-card-title>
            <v-icon start>mdi-database</v-icon>
            数据库与存储
          </v-card-title>
          <v-card-text>
            <v-row>
              <v-col cols="12" md="6">
                <v-list>
                  <v-list-item>
                    <template v-slot:prepend>
                      <v-icon>mdi-database</v-icon>
                    </template>
                    <v-list-item-title>向量数据库</v-list-item-title>
                    <v-list-item-subtitle>{{ vectorDBStatus }}</v-list-item-subtitle>
                  </v-list-item>
                  <v-list-item>
                    <template v-slot:prepend>
                      <v-icon>mdi-chart-bar</v-icon>
                    </template>
                    <v-list-item-title>案例数量</v-list-item-title>
                    <v-list-item-subtitle>{{ caseCount }} 条</v-list-item-subtitle>
                  </v-list-item>
                </v-list>
              </v-col>
              <v-col cols="12" md="6">
                <v-list>
                  <v-list-item>
                    <template v-slot:prepend>
                      <v-icon>mdi-harddisk</v-icon>
                    </template>
                    <v-list-item-title>存储使用</v-list-item-title>
                    <v-list-item-subtitle>{{ storageUsed }} / {{ storageTotal }} GB</v-list-item-subtitle>
                  </v-list-item>
                  <v-list-item>
                    <template v-slot:prepend>
                      <v-icon>mdi-backup-restore</v-icon>
                    </template>
                    <v-list-item-title>备份频率</v-list-item-title>
                    <v-list-item-subtitle>{{ backupFrequency }}</v-list-item-subtitle>
                  </v-list-item>
                </v-list>
                <div class="d-flex flex-wrap ga-2 mt-2">
                  <v-btn color="primary" variant="outlined" @click="optimizeDB">优化数据库</v-btn>
                  <v-btn color="warning" variant="outlined" @click="clearCache">清除缓存</v-btn>
                  <v-btn color="error" variant="outlined" @click="resetSettings">恢复默认设置</v-btn>
                </div>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="6">
        <v-card>
          <v-card-title>
            <v-icon start>mdi-robot</v-icon>
            智能体配置
          </v-card-title>
          <v-card-text>
            <v-select v-model="modelType" :items="modelTypes" label="模型类型" variant="outlined"></v-select>
            <v-slider v-model="riskThreshold" label="风险阈值" min="0" max="100" step="1" thumb-label="always" class="my-4"></v-slider>
            <v-text-field v-model="riskThreshold" type="number" suffix="%" variant="outlined"></v-text-field>
            <v-select v-model="interventionLevel" :items="interventionLevels" label="干预强度" variant="outlined"></v-select>
            <v-textarea v-model="systemPrompt" label="系统提示词（Prompt）" variant="outlined" rows="3" hint="用于意图识别的系统提示词"></v-textarea>
            <v-btn color="primary" class="mt-2">保存智能体配置</v-btn>
          </v-card-text>
        </v-card>

        <v-card class="mt-4">
          <v-card-title>
            <v-icon start>mdi-connection</v-icon>
            多模态输入配置
          </v-card-title>
          <v-card-text>
            <v-checkbox v-model="enableText" label="文本输入（聊天记录/短信）" hide-details></v-checkbox>
            <v-checkbox v-model="enableAudio" label="音频输入（实时通话/语音消息）" hide-details></v-checkbox>
            <v-checkbox v-model="enableVisual" label="视觉输入（视频流/截图/图片）" hide-details></v-checkbox>
            <v-divider class="my-2"></v-divider>
            <v-text-field v-model="audioSampleRate" label="音频采样率 (Hz)" variant="outlined" type="number"></v-text-field>
            <v-text-field v-model="imageQuality" label="图像质量 (%)" variant="outlined" type="number"></v-text-field>
          </v-card-text>
        </v-card>

        <v-card class="mt-4">
          <v-card-title>系统信息</v-card-title>
          <v-card-text>
            <v-row>
              <v-col cols="12" md="3">
                <v-list>
                  <v-list-item>
                    <v-list-item-title>版本</v-list-item-title>
                    <v-list-item-subtitle>{{ version }}</v-list-item-subtitle>
                  </v-list-item>
                  <v-list-item>
                    <v-list-item-title>构建时间</v-list-item-title>
                    <v-list-item-subtitle>{{ buildTime }}</v-list-item-subtitle>
                  </v-list-item>
                </v-list>
              </v-col>
              <v-col cols="12" md="3">
                <v-list>
                  <v-list-item>
                    <v-list-item-title>运行时间</v-list-item-title>
                    <v-list-item-subtitle>{{ uptime }}</v-list-item-subtitle>
                  </v-list-item>
                  <v-list-item>
                    <v-list-item-title>最后更新</v-list-item-title>
                    <v-list-item-subtitle>{{ lastUpdate }}</v-list-item-subtitle>
                  </v-list-item>
                </v-list>
              </v-col>
              <v-col cols="12" md="3">
                <v-list>
                  <v-list-item>
                    <v-list-item-title>API状态</v-list-item-title>
                    <v-list-item-subtitle>
                      <v-chip size="small" color="success">在线</v-chip>
                    </v-list-item-subtitle>
                  </v-list-item>
                  <v-list-item>
                    <v-list-item-title>模型状态</v-list-item-title>
                    <v-list-item-subtitle>
                      <v-chip size="small" color="success">已加载</v-chip>
                    </v-list-item-subtitle>
                  </v-list-item>
                </v-list>
              </v-col>
              <v-col cols="12" md="3">
                <v-btn color="primary" block @click="checkUpdate">检查更新</v-btn>
                <v-btn variant="outlined" block class="mt-2" @click="exportLogs">导出日志</v-btn>
                <v-btn variant="text" block class="mt-2" @click="restartService">重启服务</v-btn>
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

const language = ref('zh-CN')
const languages = ['zh-CN', 'en-US', 'ja-JP']
const theme = ref('light')
const themes = ['light', 'dark', 'auto']
const timezone = ref('Asia/Shanghai')
const timezones = ['Asia/Shanghai', 'UTC', 'America/New_York', 'Europe/London']
const apiEndpoint = ref('https://api.anti‑fraud.example.com/v1')

const dataCollection = ref(true)
const autoUpdate = ref(true)
const encryption = ref(true)
const clearHistory = ref(false)

const modelType = ref('LLM + VLM 多模态')
const modelTypes = ['LLM 纯文本', 'VLM 视觉语言', 'LLM + VLM 多模态', '自定义模型']
const riskThreshold = ref(75)
const interventionLevel = ref('中等')
const interventionLevels = ['低', '中等', '高', '极高']
const systemPrompt = ref(`你是一个反诈智能助手，请分析用户输入，判断是否为诈骗意图。考虑以下维度：
1. 对话意图（索取钱财、个人信息、转账）
2. 情感胁迫（紧急、威胁、恐吓）
3. 逻辑矛盾（身份冒充、不合常理）
4. 历史行为（用户以往风险记录）
输出风险等级与建议干预措施。`)

const enableText = ref(true)
const enableAudio = ref(true)
const enableVisual = ref(true)
const audioSampleRate = ref(16000)
const imageQuality = ref(85)

const vectorDBStatus = ref('运行正常')
const caseCount = ref(1245)
const storageUsed = ref(2.3)
const storageTotal = ref(10)
const backupFrequency = ref('每日')

const version = ref('2.1.0')
const buildTime = ref('2025-03-02 10:30:00')
const uptime = ref('15天 2小时 30分')
const lastUpdate = ref('2025-03-02 09:00:00')

const optimizeDB = () => {
  console.log('优化数据库')
}
const clearCache = () => {
  console.log('清除缓存')
}
const resetSettings = () => {
  console.log('恢复默认设置')
}
const checkUpdate = () => {
  console.log('检查更新')
}
const exportLogs = () => {
  console.log('导出日志')
}
const restartService = () => {
  console.log('重启服务')
}
</script>

<style scoped>
.settings-page :deep(.v-card) {
  border-radius: 14px;
  border: 1px solid #e8edf7;
}
</style>
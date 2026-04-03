<template>
  <v-container class="quickstart-page" fluid>
    <div class="quickstart-shell">
      <div class="mb-6 text-center">
        <h1 class="page-title">反诈检测</h1>
        <div class="page-subtitle">上传可疑内容进行智能分析，识别诈骗风险</div>
      </div>


      <v-card class="mb-5 main-panel" elevation="2">
        <v-tabs v-model="activeTab" class="custom-tabs" grow>
          <v-tab value="image">
            <v-icon start>mdi-image</v-icon>
            图片上传
          </v-tab>
          <v-tab value="audio">
            <v-icon start>mdi-music-note</v-icon>
            音频上传
          </v-tab>
          <v-tab value="text">
            <v-icon start>mdi-text</v-icon>
            文本上传
          </v-tab>
          <v-tab value="video">
            <v-icon start>mdi-video</v-icon>
            视频上传
          </v-tab>
        </v-tabs>

        <v-card-text>
          <v-window v-model="activeTab">
            <!-- 图片上传选项卡 -->
            <v-window-item value="image">
              <v-row>
                <v-col cols="12" md="6">
                  <v-card variant="outlined" class="pa-4" height="100%">
                    <v-card-title class="text-h6">上传图片</v-card-title>
                    <v-card-subtitle>支持 JPG、PNG、GIF 格式，最大 10MB</v-card-subtitle>
                    <v-card-text>
                      <v-file-input
                        v-model="imageFile"
                        accept="image/*"
                        label="选择图片文件"
                        prepend-icon="mdi-camera"
                        variant="outlined"
                        @change="handleImageUpload"
                      ></v-file-input>

                      <v-divider class="my-4"></v-divider>

                      <div class="text-center">
                        <div class="drop-zone" @drop.prevent="handleDrop" @dragover.prevent>
                          <v-icon size="48" color="primary">mdi-cloud-upload</v-icon>
                          <div class="text-h6 mt-2">拖放图片到此处</div>
                          <div class="text-body-2">或点击上方按钮选择文件</div>
                        </div>
                      </div>

                      <v-alert v-if="uploadStatus.image" :type="uploadStatus.image.type" class="mt-4">
                        {{ uploadStatus.image.message }}
                      </v-alert>
                      <v-btn v-if="imageFile" color="primary" class="mt-4" :loading="analyzingImage" @click="analyzeImage">
                        <v-icon start>mdi-magnify</v-icon>
                        分析图片
                      </v-btn>
                    </v-card-text>
                  </v-card>
                </v-col>

                <v-col cols="12" md="6">
                  <v-card variant="outlined" class="pa-4" height="100%">
                    <v-card-title class="text-h6">图片预览</v-card-title>
                    <v-card-text>
                      <div v-if="imagePreview" class="text-center">
                        <v-img :src="imagePreview" max-height="300" contain class="mb-4"></v-img>
                        <v-chip color="green" size="small">已加载: {{ imageFile?.name }}</v-chip>
                      </div>
                      <div v-else class="text-center pa-8">
                        <v-icon size="64" color="grey-lighten-1">mdi-image-off</v-icon>
                        <div class="text-h6 mt-2">暂无图片</div>
                        <div class="text-body-2">上传图片后预览将显示在这里</div>
                      </div>
                    </v-card-text>
                  </v-card>
                </v-col>
              </v-row>
            </v-window-item>

            <!-- 音频上传选项卡 -->
            <v-window-item value="audio">
              <v-row align="stretch">
                <v-col cols="12" md="6">
                  <v-card variant="outlined" class="pa-4" height="100%">
                    <v-card-title class="text-h6">上传音频</v-card-title>
                    <v-card-subtitle>支持 MP3、WAV、OGG 格式，最大 20MB</v-card-subtitle>
                    <v-card-text>
                      <v-file-input
                        v-model="audioFile"
                        accept="audio/*"
                        label="选择音频文件"
                        prepend-icon="mdi-music"
                        variant="outlined"
                        @change="handleAudioUpload"
                      ></v-file-input>

                      <v-alert v-if="uploadStatus.audio" :type="uploadStatus.audio.type" class="mt-4">
                        {{ uploadStatus.audio.message }}
                      </v-alert>
                      <v-btn v-if="audioFile" color="primary" class="mt-4" :loading="analyzingAudio" @click="analyzeAudio">
                        <v-icon start>mdi-magnify</v-icon>
                        分析音频
                      </v-btn>
                    </v-card-text>
                  </v-card>
                </v-col>

                <v-col cols="12" md="6">
                  <v-card variant="outlined" class="pa-4" height="100%">
                    <v-card-title class="text-h6">音频信息</v-card-title>
                    <v-card-text>
                      <div v-if="audioFile">
                        <v-list>
                          <v-list-item>
                            <v-list-item-title>文件名</v-list-item-title>
                            <v-list-item-subtitle>{{ audioFile.name }}</v-list-item-subtitle>
                          </v-list-item>
                          <v-list-item>
                            <v-list-item-title>文件大小</v-list-item-title>
                            <v-list-item-subtitle>{{ formatFileSize(audioFile.size) }}</v-list-item-subtitle>
                          </v-list-item>
                          <v-list-item>
                            <v-list-item-title>文件类型</v-list-item-title>
                            <v-list-item-subtitle>{{ audioFile.type }}</v-list-item-subtitle>
                          </v-list-item>
                        </v-list>
                        <v-btn color="primary" class="mt-4" @click="playAudio" :disabled="!audioFile">
                          <v-icon start>mdi-play</v-icon>
                          播放音频
                        </v-btn>
                      </div>
                      <div v-else class="text-center pa-8">
                        <v-icon size="64" color="grey-lighten-1">mdi-music-off</v-icon>
                        <div class="text-h6 mt-2">暂无音频</div>
                        <div class="text-body-2">上传音频后信息将显示在这里</div>
                      </div>
                    </v-card-text>
                  </v-card>
                </v-col>
              </v-row>
            </v-window-item>

            <!-- 文本上传选项卡 -->
            <v-window-item value="text">
              <v-row>
                <v-col cols="12">
                  <v-card variant="outlined" class="pa-4">
                    <v-card-title class="text-h6">输入可疑文本</v-card-title>
                    <v-card-subtitle>粘贴或输入可疑的文本内容，系统将分析其中潜在的诈骗风险</v-card-subtitle>
                    <v-card-text>
                      <v-textarea
                        v-model="textContent"
                        label="输入文本内容"
                        rows="8"
                        variant="outlined"
                        placeholder="例如：恭喜您获得100万元大奖，请点击链接领取..."
                      ></v-textarea>

                      <div class="d-flex justify-space-between mt-4">
                        <v-btn color="secondary" @click="clearText">清空</v-btn>
                        <v-btn color="primary" @click="analyzeText" :loading="analyzing">
                          <v-icon start>mdi-magnify</v-icon>
                          分析文本
                        </v-btn>
                      </div>

                      <v-alert v-if="uploadStatus.text" :type="uploadStatus.text.type" class="mt-4">
                        {{ uploadStatus.text.message }}
                      </v-alert>
                    </v-card-text>
                  </v-card>
                </v-col>
              </v-row>
            </v-window-item>

            <!-- 视频上传选项卡 -->
            <v-window-item value="video">
              <v-row align="stretch">
                <v-col cols="12" md="6">
                  <v-card variant="outlined" class="pa-4" height="100%">
                    <v-card-title class="text-h6">上传视频</v-card-title>
                    <v-card-subtitle>支持 MP4、MOV、WEBM 格式，最大 100MB</v-card-subtitle>
                    <v-card-text>
                      <v-file-input
                        v-model="videoFile"
                        accept="video/*"
                        label="选择视频文件"
                        prepend-icon="mdi-video"
                        variant="outlined"
                        @change="handleVideoUpload"
                      ></v-file-input>

                      <v-alert v-if="uploadStatus.video" :type="uploadStatus.video.type" class="mt-4">
                        {{ uploadStatus.video.message }}
                      </v-alert>
                      <v-btn v-if="videoFile" color="primary" class="mt-4" :loading="analyzingVideo" @click="analyzeVideo">
                        <v-icon start>mdi-magnify</v-icon>
                        分析视频
                      </v-btn>
                    </v-card-text>
                  </v-card>
                </v-col>

                <v-col cols="12" md="6">
                  <v-card variant="outlined" class="pa-4" height="100%">
                    <v-card-title class="text-h6">视频预览</v-card-title>
                    <v-card-text>
                      <div v-if="videoPreview" class="text-center">
                        <video :src="videoPreview" controls class="video-preview mb-4"></video>
                        <v-chip color="green" size="small">已加载: {{ videoFile?.name }}</v-chip>
                      </div>
                      <div v-else class="text-center pa-8">
                        <v-icon size="64" color="grey-lighten-1">mdi-video-off</v-icon>
                        <div class="text-h6 mt-2">暂无视频</div>
                        <div class="text-body-2">上传视频后预览将显示在这里</div>
                      </div>
                    </v-card-text>
                  </v-card>
                </v-col>
              </v-row>
            </v-window-item>
          </v-window>
        </v-card-text>
      </v-card>

      <!-- 分析结果展示区域 -->
      <v-card v-if="analysisResult" class="mt-5 result-panel" elevation="2">
        <v-card-title class="text-h5">
          <v-icon start color="primary">mdi-chart-bar</v-icon>
          分析结果
        </v-card-title>
        <v-card-text>
          <v-alert :type="analysisResult.severity === 'high' ? 'error' : (analysisResult.severity === 'medium' ? 'warning' : 'success')" class="mb-4">
            <strong>风险等级: {{ analysisResult.severity === 'high' ? '高风险' : (analysisResult.severity === 'medium' ? '中风险' : '低风险') }}</strong>
            <div>{{ analysisResult.message }}</div>
          </v-alert>

          <v-row align="stretch">
            <v-col cols="12" md="6">
              <v-card variant="outlined" class="pa-3">
                <v-card-title class="text-h6">检测到的风险点</v-card-title>
                <v-card-text>
                  <v-list>
                    <v-list-item v-for="(risk, index) in analysisResult.risks" :key="index">
                      <v-list-item-title>{{ risk }}</v-list-item-title>
                    </v-list-item>
                  </v-list>
                </v-card-text>
              </v-card>
            </v-col>
            <v-col cols="12" md="6">
              <v-card variant="outlined" class="pa-3">
                <v-card-title class="text-h6">建议措施</v-card-title>
                <v-card-text>
                  <v-list>
                    <v-list-item v-for="(action, index) in analysisResult.actions" :key="index">
                      <v-list-item-title>{{ action }}</v-list-item-title>
                    </v-list-item>
                  </v-list>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>
          <v-row class="mt-4">
            <v-col cols="12" class="text-center">
              <v-btn color="secondary" :loading="generatingReport" @click="generateReport">
                <v-icon start>mdi-file-document</v-icon>
                生成安全报告
              </v-btn>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>

      <v-card v-else class="mt-5 result-panel" variant="outlined">
        <v-card-text class="text-center py-8">
          <v-icon size="64" color="grey-lighten-1">mdi-chart-line</v-icon>
          <div class="text-h6 mt-2">等待分析结果</div>
          <div class="text-body-2">上传内容并点击分析后，结果将显示在这里</div>
        </v-card-text>
      </v-card>
    </div>
  </v-container>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const activeTab = ref('image')

// 根据查询参数初始化选项卡
watch(() => route.query.tab, (newTab) => {
  if (newTab && ['image', 'video', 'audio', 'text'].includes(newTab)) {
    activeTab.value = newTab
  }
}, { immediate: true })
const imageFile = ref(null)
const videoFile = ref(null)
const audioFile = ref(null)
const textContent = ref('')
const analyzing = ref(false)
const analysisResult = ref(null)

const imagePreview = computed(() => {
  if (imageFile.value) {
    return URL.createObjectURL(imageFile.value)
  }
  return null
})

const videoPreview = computed(() => {
  if (videoFile.value) {
    return URL.createObjectURL(videoFile.value)
  }
  return null
})

const uploadStatus = ref({
  image: null,
  video: null,
  audio: null,
  text: null
})

function handleImageUpload(file) {
  if (file) {
    uploadStatus.value.image = {
      type: 'success',
      message: `图片 "${file.name}" 已成功加载`
    }
  } else {
    uploadStatus.value.image = null
  }
}

function handleAudioUpload(file) {
  if (file) {
    uploadStatus.value.audio = {
      type: 'success',
      message: `音频 "${file.name}" 已成功加载`
    }
  } else {
    uploadStatus.value.audio = null
  }
}

function handleVideoUpload(file) {
  if (file) {
    uploadStatus.value.video = {
      type: 'success',
      message: `视频 "${file.name}" 已成功加载`
    }
  } else {
    uploadStatus.value.video = null
  }
}

function handleDrop(event) {
  const files = event.dataTransfer.files
  if (files.length > 0 && files[0].type.startsWith('image/')) {
    imageFile.value = files[0]
    handleImageUpload(files[0])
  }
}

function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

function playAudio() {
  if (audioFile.value) {
    const audioUrl = URL.createObjectURL(audioFile.value)
    const audio = new Audio(audioUrl)
    audio.play()
  }
}

function clearText() {
  textContent.value = ''
  uploadStatus.value.text = null
}

const analyzingImage = ref(false)
const analyzingVideo = ref(false)
const analyzingAudio = ref(false)

async function analyzeImage() {
  if (!imageFile.value) {
    uploadStatus.value.image = {
      type: 'error',
      message: '请先上传图片'
    }
    return
  }

  analyzingImage.value = true
  uploadStatus.value.image = {
    type: 'info',
    message: '正在分析图片...'
  }

  try {
    const formData = new FormData()
    formData.append('image', imageFile.value)

    const response = await fetch('http://localhost:7007/api/analyze/image', {
      method: 'POST',
      body: formData
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || '图片分析请求失败')
    }

    if (!data.success) {
      throw new Error(data.error || '图片分析服务返回错误')
    }

    const analysis = data.analysis
    analysisResult.value = {
      severity: analysis.risk_level === 'high' ? 'high' : (analysis.risk_level === 'medium' ? 'medium' : 'low'),
      message: analysis.summary || '图片分析完成',
      risks: analysis.reasons || [],
      actions: analysis.suggestions || []
    }

    uploadStatus.value.image = {
      type: 'success',
      message: '图片分析完成，风险等级：' + analysis.risk_level
    }
  } catch (error) {
    console.error('图片分析失败:', error)
    uploadStatus.value.image = {
      type: 'error',
      message: '图片分析失败: ' + error.message
    }
    analysisResult.value = {
      severity: 'medium',
      message: '图片分析服务暂时不可用',
      risks: ['服务连接异常'],
      actions: ['请检查网络或稍后重试']
    }
  } finally {
    analyzingImage.value = false
  }
}

async function analyzeAudio() {
  if (!audioFile.value) {
    uploadStatus.value.audio = {
      type: 'error',
      message: '请先上传音频'
    }
    return
  }

  analyzingAudio.value = true
  uploadStatus.value.audio = {
    type: 'info',
    message: '正在分析音频...'
  }

  try {
    const formData = new FormData()
    formData.append('audio', audioFile.value)

    const response = await fetch('http://localhost:7007/api/analyze/audio', {
      method: 'POST',
      body: formData
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || '音频分析请求失败')
    }

    if (!data.success) {
      throw new Error(data.error || '音频分析服务返回错误')
    }

    const analysis = data.analysis
    analysisResult.value = {
      severity: analysis.risk_level === 'high' ? 'high' : (analysis.risk_level === 'medium' ? 'medium' : 'low'),
      message: analysis.summary || '音频分析完成',
      risks: analysis.reasons || [],
      actions: analysis.suggestions || []
    }

    uploadStatus.value.audio = {
      type: 'success',
      message: '音频分析完成，风险等级：' + analysis.risk_level
    }
  } catch (error) {
    console.error('音频分析失败:', error)
    uploadStatus.value.audio = {
      type: 'error',
      message: '音频分析失败: ' + error.message
    }
    analysisResult.value = {
      severity: 'medium',
      message: '音频分析服务暂时不可用',
      risks: ['服务连接异常'],
      actions: ['请检查网络或稍后重试']
    }
  } finally {
    analyzingAudio.value = false
  }
}

async function analyzeVideo() {
  if (!videoFile.value) {
    uploadStatus.value.video = {
      type: 'error',
      message: '请先上传视频'
    }
    return
  }

  analyzingVideo.value = true
  uploadStatus.value.video = {
    type: 'info',
    message: '正在分析视频...'
  }

  try {
    const formData = new FormData()
    formData.append('video', videoFile.value)

    const response = await fetch('http://localhost:7007/api/analyze/video', {
      method: 'POST',
      body: formData
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || '视频分析请求失败')
    }

    if (!data.success) {
      throw new Error(data.error || '视频分析服务返回错误')
    }

    const analysis = data.analysis
    analysisResult.value = {
      severity: analysis.risk_level === 'high' ? 'high' : (analysis.risk_level === 'medium' ? 'medium' : 'low'),
      message: analysis.summary || '视频分析完成',
      risks: analysis.reasons || [],
      actions: analysis.suggestions || []
    }

    uploadStatus.value.video = {
      type: 'success',
      message: '视频分析完成，风险等级：' + analysis.risk_level
    }
  } catch (error) {
    console.error('视频分析失败:', error)
    uploadStatus.value.video = {
      type: 'error',
      message: '视频分析失败: ' + error.message
    }
    analysisResult.value = {
      severity: 'medium',
      message: '视频分析服务暂时不可用',
      risks: ['服务连接异常'],
      actions: ['请检查网络或稍后重试']
    }
  } finally {
    analyzingVideo.value = false
  }
}

async function analyzeText() {
  if (!textContent.value.trim()) {
    uploadStatus.value.text = {
      type: 'error',
      message: '请输入文本内容'
    }
    return
  }

  analyzing.value = true
  uploadStatus.value.text = {
    type: 'info',
    message: '正在调用 AI 分析服务...'
  }

  try {
    const response = await fetch('http://localhost:7007/api/analyze/text', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text: textContent.value })
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || '分析请求失败')
    }

    if (!data.success) {
      throw new Error(data.error || '分析服务返回错误')
    }

    const analysis = data.analysis
    // 将后端分析结果映射为前端格式
    analysisResult.value = {
      severity: analysis.risk_level === 'high' ? 'high' : (analysis.risk_level === 'medium' ? 'medium' : 'low'),
      message: analysis.summary || '分析完成',
      risks: analysis.reasons || [],
      actions: analysis.suggestions || []
    }

    uploadStatus.value.text = {
      type: 'success',
      message: '文本分析完成，风险等级：' + analysis.risk_level
    }
  } catch (error) {
    console.error('分析失败:', error)
    uploadStatus.value.text = {
      type: 'error',
      message: '分析失败: ' + error.message
    }
    // 可选：回退到模拟结果
    analysisResult.value = {
      severity: 'medium',
      message: '分析服务暂时不可用，使用模拟结果',
      risks: ['服务连接异常'],
      actions: ['请检查网络或稍后重试']
    }
  } finally {
    analyzing.value = false
  }
}

const generatingReport = ref(false)

async function generateReport() {
  if (!analysisResult.value) {
    return
  }

  generatingReport.value = true
  try {
    const response = await fetch('http://localhost:7007/api/reports', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: `安全报告 - ${new Date().toLocaleDateString('zh-CN')}`,
        severity: analysisResult.value.severity,
        risks: analysisResult.value.risks,
        actions: analysisResult.value.actions,
        summary: analysisResult.value.message,
        modality: activeTab.value, // 'image', 'audio', 'text'
        content: activeTab.value === 'text' ? textContent.value : ''
      })
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || '报告生成失败')
    }

    if (!data.success) {
      throw new Error(data.error || '报告生成服务返回错误')
    }

    alert('报告已生成！可在安全报告页面查看。')
    // 可选：导航到安全报告页面
    // router.push('/report')
  } catch (error) {
    console.error('生成报告失败:', error)
    alert('生成报告失败: ' + error.message)
  } finally {
    generatingReport.value = false
  }
}
</script>

<style scoped>
.quickstart-page {
  display: flex;
  justify-content: center;
  background: #f3f6fc;
  padding: 20px 16px 36px;
}

.quickstart-shell {
  width: 100%;
  max-width: 1180px;
}

.page-title {
  font-size: 38px;
  line-height: 1.2;
  font-weight: 700;
  color: #1e2f59;
}

.page-subtitle {
  margin-top: 8px;
  color: #6d7a9a;
  font-size: 15px;
}

.main-panel,
.result-panel {
  border-radius: 16px;
  border: 1px solid #e6ebf6;
}

.custom-tabs {
  border-bottom: 1px solid #edf1fa;
}

.drop-zone {
  border: 2px dashed #ccc;
  border-radius: 10px;
  padding: 40px 20px;
  cursor: pointer;
  transition: border-color 0.3s;
  background: #fbfcff;
}
.drop-zone:hover {
  border-color: #1976d2;
}

.video-preview {
  width: 100%;
  max-height: 300px;
  border-radius: 10px;
  background: #000;
}

.v-card {
  border-radius: 12px;
}
.v-card-text {
  padding: 16px;
}

.v-row {
  margin-top: 0;
}
.v-col {
  padding-top: 8px;
  padding-bottom: 8px;
}

@media (max-width: 960px) {
  .quickstart-page {
    padding: 12px 8px 24px;
  }

  .page-title {
    font-size: 30px;
  }
}
</style>

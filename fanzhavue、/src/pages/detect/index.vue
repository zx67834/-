<template>
	<view class="page" :class="{ 'theme-guardian': isGuardianTheme }">
		<view class="header">
			<view class="title">反诈检测</view>
			<view class="subtitle">上传可疑内容进行智能分析，识别诈骗风险</view>
		</view>

		<view class="main-card">
			<view class="quick-title">快速检测</view>
			<view class="quick-list">
				<text class="quick-chip" v-for="(q, index) in quickQuestions" :key="index" @click="useQuickQuestion(q)">
					{{ q }}
				</text>
			</view>

			<textarea v-model="textContent" class="text-area" placeholder="输入文本或上传文件进行检测..."></textarea>

			<view class="action-row">
				<view class="left-actions">
					<view class="icon-btn" @click="uploadByType('image')">
						<uni-icons type="image" size="17" color="#6f7a8d"></uni-icons>
					</view>
					<view class="icon-btn" @click="uploadByType('voice')">
						<uni-icons type="mic" size="17" color="#6f7a8d"></uni-icons>
					</view>
					<view class="icon-btn" @click="uploadByType('video')">
						<uni-icons type="videocam" size="17" color="#6f7a8d"></uni-icons>
					</view>
				</view>
				<button class="analyze-btn" :disabled="detecting" @click="startDetect">
					{{ detecting ? '分析中' : '分析' }}
				</button>
			</view>

			<view v-if="current !== 'text' && fileMap[current]" class="file-tip">
				<text>已选择：{{ fileMap[current].name }}</text>
				<text class="clear-file" @click="clearSelectedFile">移除</text>
			</view>

			<view v-if="current !== 'text' && fileMap[current]?.path" class="media-preview">
				<view class="media-preview-label">附件预览</view>
				<image
					v-if="current === 'image'"
					class="preview-image"
					:src="fileMap.image.path"
					mode="aspectFit"
				/>
				<video
					v-if="current === 'video'"
					class="preview-video"
					:src="fileMap.video.path"
					controls
					:show-center-play-btn="true"
					object-fit="contain"
				/>
				<audio
					v-if="current === 'voice'"
					class="preview-audio"
					:src="fileMap.voice.path"
					:name="fileMap.voice.name || '音频'"
					:author="fileMap.voice.name || '音频'"
					controls
				/>
			</view>

			<view class="inline-result" :class="resultRiskClass">
				<template v-if="result">
					<view class="result-head">
						<view class="result-title">分析结果</view>
						<view class="risk-badge" :class="resultRiskClass">{{ result.level }}</view>
					</view>
					<view class="result-risk">风险评分：{{ result.score }} 分（{{ result.level }}）</view>
					<view class="result-text">{{ result.tip }}</view>

					<view class="detail-block" v-if="result.risks && result.risks.length">
						<view class="detail-title">检测到的风险点</view>
						<view class="detail-item" v-for="(risk, idx) in result.risks" :key="`risk-${idx}`">
							• {{ risk }}
						</view>
					</view>

					<view class="detail-block" v-if="result.suggestions && result.suggestions.length">
						<view class="detail-title">建议措施</view>
						<view class="detail-item" v-for="(item, idx) in result.suggestions" :key="`sug-${idx}`">
							• {{ item }}
						</view>
					</view>
					<button class="report-btn" :disabled="detecting || reportSubmitting" @click="generateSafetyReport">
						{{ reportSubmitting ? '生成中...' : '生成安全报告' }}
					</button>
				</template>
				<template v-else>
					<view class="placeholder-title">等待分析结果</view>
					<view class="placeholder-subtitle">输入文本或添加附件后点击分析</view>
				</template>
			</view>

			<view class="dispatch-card" :class="{ active: detecting || dispatchInfo.model }">
				<view class="dispatch-title">反诈检测流程</view>
				<view class="dispatch-text">{{ dispatchInfo.message }}</view>
				<view v-if="detecting || elapsedSeconds > 0" class="dispatch-elapsed">实时耗时：{{ elapsedSeconds }}s</view>
				<view v-if="dispatchInfo.model" class="dispatch-meta">
					<text>模型：{{ dispatchInfo.model }}</text>
					<text v-if="dispatchInfo.durationMs >= 0">耗时：{{ dispatchInfo.durationMs }} ms</text>
				</view>
				<view v-if="processLogs.length" class="process-log-list">
					<view class="process-log-item" v-for="(log, idx) in processLogs" :key="`log-${idx}`">
						{{ log }}
					</view>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
import { getApiBaseUrl } from '@/utils/apiBase.js'

export default {
	data() {
		return {
			current: 'text',
			textContent: '',
			fileMap: {
				text: null,
				image: null,
				voice: null,
				video: null
			},
			detecting: false,
			reportSubmitting: false,
			result: null,
			dispatchInfo: {
				message: '尚未开始调度',
				model: '',
				durationMs: -1
			},
			processLogs: [],
			elapsedSeconds: 0,
			detectStartedAt: 0,
			processTicker: null,
			stageTimerIds: [],
			lastAnalysisMeta: {
				type: 'text',
				model: '',
				fileInfo: null,
				transcription: '',
				inputPreview: ''
			},
			quickQuestions: [
				'恭喜您中奖了',
				'请问您需要贷款吗',
				'您的银行卡有异常',
				'这是您的快递单号'
			]
		}
	},
	computed: {
		resultRiskClass() {
			if (!this.result) return ''
			if (this.result.level === '高风险') return 'high-risk'
			if (this.result.level === '中风险') return 'medium-risk'
			return 'low-risk'
		}
	},
	//进入参数初始化
	onLoad(options) {
		if (options.type && ['text', 'image', 'voice', 'video'].includes(options.type)) {
			this.current = options.type
		}
	},
	//离开前清理定时器
	onUnload() {
		this.stopDispatchTicker()
		this.clearStageTimers()
	},
	methods: {
		//清理阶段定时器
		clearStageTimers() {
			if (!Array.isArray(this.stageTimerIds) || !this.stageTimerIds.length) return
			this.stageTimerIds.forEach((id) => clearTimeout(id))
			this.stageTimerIds = []
		},
		//添加调度日志（时间戳）
		appendDispatchLog(text) {
			if (!text) return
			const timeLabel = new Date().toTimeString().slice(0, 8)//00:00:00格式
			this.processLogs = [...this.processLogs, `${timeLabel} · ${text}`]
		},
		//耗时计时功能
		startDispatchTicker() {
			this.stopDispatchTicker()
			this.detectStartedAt = Date.now()
			this.elapsedSeconds = 0
			this.processTicker = setInterval(() => {
				this.elapsedSeconds = Math.max(0, Math.floor((Date.now() - this.detectStartedAt) / 1000))
			}, 300)
		},
		//停止计时器
		stopDispatchTicker() {
			if (this.processTicker) {
				clearInterval(this.processTicker)
				this.processTicker = null
			}
			if (this.detectStartedAt) {
				this.elapsedSeconds = Math.max(0, Math.floor((Date.now() - this.detectStartedAt) / 1000))
			}
		},
		getStagePlan(type) {
			if (type === 'text') {
				return [
					{ delay: 0, text: '我先把你输入的内容读一遍，看看大概在说什么。' },
					{ delay: 450, text: '我在找可疑关键词，比如转账、验证码、账户异常、贷款放款这些。' },
					{ delay: 1000, text: '接着判断是不是在“吓你/催你”，然后引导你去做危险操作。' },
					{ delay: 1700, text: '再对照反诈规则，避免只因为一个词就误判成高风险。' },
					{ delay: 2400, text: '最后给你结论：风险等级、具体风险点和对应建议。' }
				]
			}
			if (type === 'image') {
				return [
					{ delay: 0, text: '我先检查这张图片能不能正常识别。' },
					{ delay: 550, text: '然后把图里的字和关键信息提出来，比如金额、链接、二维码、联系方式。' },
					{ delay: 1200, text: '再看看页面像不像假官网、假活动，文案有没有诱导套路。' },
					{ delay: 2000, text: '我会按反诈规则再过一遍，尽量减少误报。' },
					{ delay: 2800, text: '最后给出风险等级、风险点和处理建议。' }
				]
			}
			if (type === 'voice') {
				return [
					{ delay: 0, text: '我先检查音频文件，然后开始听写成文字。' },
					{ delay: 650, text: '重点看有没有“催你转账、要验证码、要密码”这类危险话术。' },
					{ delay: 1450, text: '再判断是不是在冒充客服、公检法、银行，或者故意制造紧张感。' },
					{ delay: 2200, text: '结合证据强弱做分级，避免只凭一句话就下重结论。' },
					{ delay: 3000, text: '最后给你风险判断和下一步该怎么做。' }
				]
			}
			return [
				{ delay: 0, text: '我先抽取视频里的关键画面，方便后面逐段分析。' },
				{ delay: 700, text: '再识别字幕、画面文字和口播内容，找可疑片段。' },
				{ delay: 1500, text: '结合画面和文案一起判断，有没有诈骗引导套路。' },
				{ delay: 2300, text: '按反诈规则再核对一遍，确认结论更稳妥。' },
				{ delay: 3200, text: '最后给出风险等级、证据点和建议措施。' }
			]
		},
		//分阶段提示文案
		playDispatchStages(type) {
			this.clearStageTimers()
			const stages = this.getStagePlan(type)
			stages.forEach((stage) => {
				const timerId = setTimeout(() => {
					if (!this.detecting) return
					this.updateDispatchInfo({ message: stage.text, model: '', durationMs: -1 })
					//把这条提示写进历史日志列表
					this.appendDispatchLog(stage.text)
				}, stage.delay)
				//把每个 timeout 的 id 存进 stageTimerIds,方便后续统一清理clearTimeout
				this.stageTimerIds.push(timerId)
			})
		},
		//拿出当前登录中的账号对象
		getCurrentAccount() {
			const raw = uni.getStorageSync('user_accounts')
			let accounts = raw || []
			if (typeof raw === 'string') {
				try {
					accounts = JSON.parse(raw || '[]')
				} catch {
					accounts = []
				}
			}
			const idx = Number(uni.getStorageSync('active_user_account_index') || 0)
			if (Array.isArray(accounts)) {
				return accounts[idx] || accounts[0] || {}
			}
			return {}
		},
		//给中/高风险复，通用的风险工作流上报请求封装
		postRiskWorkflow(path, payload) {
			const base = getApiBaseUrl()
			return new Promise((resolve, reject) => {
				uni.request({
					url: `${base}${path}`,
					method: 'POST',
					header: { 'Content-Type': 'application/json' },
					data: JSON.stringify(payload),
					success: (raw) => {
						let d = raw.data
						if (typeof d === 'string') {
							try {
								d = JSON.parse(d)
							} catch {
								d = {}
							}
						}
						const ok =
							raw.statusCode === 200 ||
							raw.statusCode === '200' ||
							Number(raw.statusCode) === 200
						if (ok && d && d.success) resolve(d)
						else reject(new Error((d && d.error) || '风险上报失败'))
					},
					fail: (e) => reject(e || new Error('网络失败'))
				})
			})
		},
		//检测结束后，把中/高风险结果通知到后端风险工作流
		async notifyRiskWorkflowAfterDetect() {
			if (!this.result) return
			const acc = this.getCurrentAccount()
			const userEmail = String(acc.email || '').trim()
			if (!userEmail) return
			const payload = {
				userEmail,
				userName: acc.name || '',
				userPhone: acc.phone || '',
				summary: this.result.tip || '',
				risks: Array.isArray(this.result.risks) ? this.result.risks : []
			}
			try {
				if (this.result.level === '高风险') {
					await this.postRiskWorkflow('/api/risk/workflow/high', payload)
				} else if (this.result.level === '中风险') {
					await this.postRiskWorkflow('/api/risk/workflow/medium', payload)
				}
			} catch (e) {
				console.warn('risk workflow', e)
			}
		},
		//预输入文本的处理
		useQuickQuestion(question) {
			this.current = 'text'
			this.textContent = question
		},
		/**
		 * 上传完成后微信小程序会清理临时文件，旧 path 再传会失败；清空槽位促使用户重新选择，避免必须退出页面。
		 */
		clearUploadedFileSlot(type) {
			if (!['image', 'voice', 'video'].includes(type)) return
			this.fileMap[type] = null
		},
		uploadByType(type) {
			//先把当前检测类型切到该类型
			this.current = type
			//定义类型到扩展名白名单 extMap
			const extMap = {
				text: ['txt'],
				image: ['jpg', 'jpeg', 'png'],
				voice: ['mp3', 'wav', 'm4a', 'ogg', 'webm'],
				video: ['mp4', 'mov', 'webm']
			}
			// #ifdef MP-WEIXIN
			if (type === 'image') {
				//微信端针对图片走专门 API
				uni.chooseImage({
					count: 1,
					sizeType: ['compressed', 'original'],//选择压缩图或原图
					sourceType: ['album', 'camera'],//图片来源相册或拍照
					success: (res) => {
						const p = res.tempFilePaths && res.tempFilePaths[0]
						if (!p) return
						this.fileMap.image = {
							name: `图片_${Date.now()}.jpg`,
							path: p
						}
					},
					fail: () => {
						uni.showToast({
							title: '未选择图片',
							icon: 'none'
						})
					}
				})
				return
			}
			// #endif
			//非图片微信专用分支（文件）
			uni.chooseMessageFile({
				count: 1,
				type: 'file',
				extension: extMap[this.current],
				success: (res) => {
					const file = res.tempFiles[0]
					this.fileMap[this.current] = {
						name: file.name || '未命名文件',
						path: file.path || file.tempFilePath || ''
					}
				},
				fail: () => {
					uni.showToast({
						title: '未选择文件',
						icon: 'none'
					})
				}
			})
		},
		//清除当前类型已选择的文件并切回文本输入
		clearSelectedFile() {
			this.fileMap[this.current] = null
			this.current = 'text'
		},
		//高风险弹窗
		showRiskModal(level, tip) {
			if (level === '低风险') return
			const isHigh = level === '高风险'
			//uni.showModal（确认类）和 uni.showToast（轻提示）
			uni.showModal({
				title: isHigh ? '高风险预警' : '中风险提醒',
				content: `${isHigh ? '检测到高风险内容，请立即核验并避免转账。' : '检测到中风险内容，请谨慎判断并二次核验。'}\n\n分析摘要：${tip || '无'}`,
				showCancel: !isHigh,
				cancelText: '稍后处理',
				confirmText: '我知道了'
			})
		},
		toResult(analysis) {
			const level = analysis.risk_level === 'high' ? '高风险' : analysis.risk_level === 'medium' ? '中风险' : '低风险'
			return {
				score: analysis.risk_level === 'high' ? 85 : analysis.risk_level === 'medium' ? 65 : 45,
				level,
				tip: analysis.summary || '分析完成',
				risks: Array.isArray(analysis.reasons) ? analysis.reasons : [],
				suggestions: Array.isArray(analysis.suggestions) ? analysis.suggestions : []
			}
		},
		//更新调度信息
		updateDispatchInfo({ message, model = '', durationMs = -1 }) {
			this.dispatchInfo = {
				//message是给用户看到状态，model是调用的模型，durationMs是调用耗时
				message: message || '调度状态未知',
				model: model || '',
				durationMs: Number.isFinite(durationMs) ? Math.max(0, Math.round(durationMs)) : -1
			}
		},
		levelToSeverity(levelText) {
			if (levelText === '高风险') return 'high'
			if (levelText === '中风险') return 'medium'
			return 'low'
		},
		buildThoughtProcessText() {
			if (!this.processLogs.length) return '（本次未记录检测过程）'
			return this.processLogs.map((line, idx) => `${idx + 1}. ${line}`).join('\n')
		},
		//把当前分析结果固化成一条安全报告并发到后端
		async generateSafetyReport(options = {}) {
			const { auto = false } = options
			if (!this.result) {
				uni.showToast({ title: '请先完成分析', icon: 'none' })
				return
			}
			const account = this.getCurrentAccount()
			const authorEmail = String(account.email || '').trim()
			if (!authorEmail) {
				uni.showToast({ title: '未读取到当前账号邮箱，请重新登录后重试', icon: 'none' })
				return
			}
			const thoughtText = this.buildThoughtProcessText()
			const typeLabelMap = { text: '文本', image: '图片', voice: '音频', video: '视频' }
			const currentType = this.lastAnalysisMeta.type || this.current || 'text'
			const title = `${typeLabelMap[currentType] || '内容'}安全报告`
			const payload = {
				title,
				severity: this.levelToSeverity(this.result.level),
				risks: Array.isArray(this.result.risks) ? this.result.risks : [],
				actions: Array.isArray(this.result.suggestions) ? this.result.suggestions : [],
				summary: '',
				modality: currentType === 'voice' ? 'audio' : currentType,
				content: `【检测对象】\n${this.lastAnalysisMeta.inputPreview || '（无）'}\n\n【调度模型】\n${this.lastAnalysisMeta.model || '未知模型'}\n\n【风险结论】\n等级：${this.result.level}\n评分：${this.result.score}\n\n【风险点】\n${(this.result.risks || []).map((x, i) => `${i + 1}. ${x}`).join('\n') || '无'}\n\n【建议措施】\n${(this.result.suggestions || []).map((x, i) => `${i + 1}. ${x}`).join('\n') || '无'}\n\n【反诈检测流程思考过程】\n${thoughtText}`.trim(),
				fileInfo: this.lastAnalysisMeta.fileInfo || {},
				transcription: this.lastAnalysisMeta.transcription || '',
				authorEmail,
				authorName: String(account.name || '').trim(),
				authorRole: String(account.role || account.userType || '').trim()
			}
			this.reportSubmitting = true
			try {
				const res = await uni.request({
					url: `${getApiBaseUrl()}/api/reports`,
					method: 'POST',
					header: { 'Content-Type': 'application/json' },
					data: payload
				})
				if (res.statusCode !== 200 || !res.data?.success) {
					throw new Error(res.data?.error || '报告生成失败')
				}
				uni.showToast({ title: auto ? '高风险已自动生成安全报告' : '安全报告已生成', icon: 'none' })
			} catch (e) {
				uni.showToast({ title: auto ? `自动生成失败：${e.message || '失败'}` : e.message || '生成失败', icon: 'none' })
			} finally {
				this.reportSubmitting = false
			}
		},
		async requestTextAnalyze() {
			const startedAt = Date.now()
			let res
			try {
				//uni-app 里的 HTTP 请求 API
				res = await uni.request({
					url: `${getApiBaseUrl()}/api/analyze/text`,
					method: 'POST',
					header: { 'Content-Type': 'application/json' },
					data: { text: this.textContent.trim() }
				})
			} catch (err) {
				throw err
			}
			if (res.statusCode !== 200 || !res.data?.success) {
				throw new Error(res.data?.error || '文本分析失败')
			}
			this.updateDispatchInfo({
				message: '文本分析已完成',
				model: res.data?.model || '',
				durationMs: Date.now() - startedAt
			})
			this.appendDispatchLog('模型分析完了，我正在整理风险评分和建议。')
			//把本次分析元信息(类型、模型、输入预览)存到lastAnalysisMeta里
			this.lastAnalysisMeta = {
				type: 'text',
				model: res.data?.model || '',
				fileInfo: null,
				transcription: '',
				inputPreview: this.textContent.trim()
			}
			//把后端 analysis 转成页面结果
			this.result = this.toResult(res.data.analysis || {})
		},
		async uploadAndAnalyze(type) {
			const file = this.fileMap[type]
			if (!file?.path) throw new Error('请先选择文件')
			const startedAt = Date.now()
			const base = getApiBaseUrl()
			const apiConfig = {
				image: { name: 'image', url: `${base}/api/analyze/image` },
				voice: { name: 'audio', url: `${base}/api/analyze/audio` },
				video: { name: 'video', url: `${base}/api/analyze/video` }
			}
			const cfg = apiConfig[type]
			let res
			try {
				//上传
				res = await uni.uploadFile({
					url: cfg.url,
					filePath: file.path,
					name: cfg.name
				})
			} catch (err) {
				throw err
			}
			let data = {}
			try {
				//用 JSON.parse 解析后端返回
				data = typeof res.data === 'string' ? JSON.parse(res.data) : res.data
			} catch (e) {
				throw new Error('后端返回格式异常')
			}
			if (res.statusCode !== 200 || !data?.success) {
				throw new Error(data?.error || '文件分析失败')
			}
			const typeLabelMap = {
				image: '图片',
				voice: '音频',
				video: '视频'
			}
			this.updateDispatchInfo({
				message: `${typeLabelMap[type] || '文件'}模型调度成功`,
				model: data?.model || '',
				durationMs: Date.now() - startedAt
			})
			this.appendDispatchLog(`模型分析完了，我正在整理${typeLabelMap[type] || '文件'}里的风险证据。`)
			this.lastAnalysisMeta = {
				type,
				model: data?.model || '',
				fileInfo: data?.file || null,
				transcription: data?.transcription || '',
				inputPreview: file?.name ? `附件：${file.name}` : `${typeLabelMap[type] || '文件'}内容`
			}
			this.result = this.toResult(data.analysis || {})
		},
		async startDetect() {
			const hasText = this.current === 'text' && this.textContent.trim()
			const hasFile = Boolean(this.fileMap[this.current]?.path)
			if (!hasText && !hasFile) {
				uni.showToast({
					title: this.current === 'text' ? '请输入文本或上传文件' : '请先选择文件',
					icon: 'none'
				})
				return
			}
			this.detecting = true
			this.result = null
			this.processLogs = []
			this.startDispatchTicker()
			this.playDispatchStages(this.current)
			this.updateDispatchInfo({
				message: `正在调度${this.current === 'text' ? '文本' : this.current === 'image' ? '图片' : this.current === 'voice' ? '音频' : '视频'}模型...`,
				model: '',
				durationMs: -1
			})
			this.appendDispatchLog(`开始分析${this.current === 'text' ? '文本' : this.current === 'image' ? '图片' : this.current === 'voice' ? '音频' : '视频'}内容。`)
			try {
				if (this.current === 'text') {
					await this.requestTextAnalyze()
				} else {
					await this.uploadAndAnalyze(this.current)
				}
				if (this.result && this.result.level === '高风险') {
					await this.generateSafetyReport({ auto: true })
				}
				await this.notifyRiskWorkflowAfterDetect()
				this.appendDispatchLog('流程完成了，现在可以直接生成安全报告。')
				if (this.current !== 'text') {
					this.clearUploadedFileSlot(this.current)
				}
				this.showRiskModal(this.result.level, this.result.tip)
			} catch (error) {
				this.appendDispatchLog(`这次分析失败了：${error.message || '分析失败'}`)
				this.updateDispatchInfo({
					message: `模型调度失败：${error.message || '分析失败'}`,
					model: '',
					durationMs: -1
				})
				uni.showToast({
					title: error.message || '分析失败',
					icon: 'none'
				})
			} finally {
				this.detecting = false
				this.stopDispatchTicker()
				this.clearStageTimers()
			}
		}
	}
}
</script>

<style lang="scss">
.page {
	min-height: 100vh;
	background: #f3f5fb;
	padding: calc(var(--status-bar-height) + 24rpx) 26rpx 36rpx;
	box-sizing: border-box;
}
.header {
	padding-top: 8rpx;
	text-align: center;
}
.title {
	font-size: 56rpx;
	font-weight: 700;
	color: #2f64f5;
	line-height: 1.2;
}
.subtitle {
	margin-top: 8rpx;
	font-size: 24rpx;
	color: #6f7a8d;
}
.main-card {
	margin-top: 24rpx;
	background: #ffffff;
	border-radius: 22rpx;
	padding: 22rpx;
	border: 1rpx solid #e5e9f2;
}
.quick-title {
	font-size: 24rpx;
	color: #6f7a8d;
	font-weight: 600;
}
.quick-list {
	margin-top: 10rpx;
	display: flex;
	flex-wrap: wrap;
	gap: 10rpx;
}
.quick-chip {
	padding: 8rpx 16rpx;
	border-radius: 999rpx;
	background: #f0f3f9;
	color: #4e596f;
	font-size: 22rpx;
}
.text-area {
	margin-top: 16rpx;
	width: 100%;
	height: 170rpx;
	background: #f7f9fc;
	border: 1rpx solid #dfe5ef;
	border-radius: 12rpx;
	padding: 16rpx;
	font-size: 24rpx;
	box-sizing: border-box;
}
.action-row {
	margin-top: 12rpx;
	display: flex;
	justify-content: space-between;
	align-items: center;
}
.dispatch-card {
	margin-top: 14rpx;
	padding: 14rpx 16rpx;
	border-radius: 12rpx;
	background: #f7f9fc;
	border: 1rpx dashed #d9dfeb;
}
.report-btn {
	margin-top: 16rpx;
	width: 100%;
	height: 64rpx;
	line-height: 64rpx;
	border-radius: 12rpx;
	background: linear-gradient(135deg, #36a2ff, #2f64f5);
	color: #fff;
	font-size: 24rpx;
	border: none;
}
.report-btn[disabled] {
	opacity: 0.75;
}
.dispatch-card.active {
	background: #f3f8ff;
	border-color: #a7c5ff;
}
.dispatch-title {
	font-size: 22rpx;
	font-weight: 600;
	color: #49607f;
}
.dispatch-text {
	margin-top: 6rpx;
	font-size: 22rpx;
	color: #55627c;
}
.dispatch-meta {
	margin-top: 8rpx;
	display: flex;
	gap: 20rpx;
	font-size: 20rpx;
	color: #2f64f5;
}
.dispatch-elapsed {
	margin-top: 8rpx;
	font-size: 20rpx;
	color: #5e6f90;
}
.process-log-list {
	margin-top: 10rpx;
	padding: 10rpx;
	border-radius: 10rpx;
	background: #ffffff;
	border: 1rpx solid #e3e8f3;
	max-height: 220rpx;
	overflow: auto;
}
.process-log-item {
	font-size: 20rpx;
	color: #495773;
	line-height: 1.6;
}
.left-actions {
	display: flex;
	gap: 10rpx;
}
.icon-btn {
	width: 56rpx;
	height: 56rpx;
	border-radius: 12rpx;
	background: #f0f3f8;
	border: 1rpx solid #e2e7f0;
	display: flex;
	align-items: center;
	justify-content: center;
}
.analyze-btn {
	margin: 0;
	width: 132rpx;
	height: 58rpx;
	line-height: 58rpx;
	border-radius: 28rpx;
	background: linear-gradient(135deg, #3f8cff, #2877ff);
	color: #fff;
	font-size: 24rpx;
	border: none;
}
.analyze-btn[disabled] {
	opacity: 0.7;
}
.file-tip {
	margin-top: 10rpx;
	font-size: 22rpx;
	color: #7f8baa;
	display: flex;
	justify-content: space-between;
	align-items: center;
}
.clear-file {
	color: #2f64f5;
	font-size: 22rpx;
}
.media-preview {
	margin-top: 14rpx;
	padding: 16rpx;
	border-radius: 12rpx;
	background: #f7f9fc;
	border: 1rpx solid #e2e7f0;
}
.media-preview-label {
	font-size: 22rpx;
	color: #49607f;
	font-weight: 600;
	margin-bottom: 12rpx;
}
.preview-image {
	width: 100%;
	max-height: 360rpx;
	border-radius: 10rpx;
	background: #eef1f7;
}
.preview-video {
	width: 100%;
	max-height: 420rpx;
	border-radius: 10rpx;
	background: #000;
}
.preview-audio {
	width: 100%;
	height: 80rpx;
}
.inline-result {
	margin-top: 18rpx;
	background: #f7f9fc;
	border: 1rpx solid #e2e7f0;
	border-radius: 14rpx;
	padding: 20rpx;
}
.inline-result.medium-risk {
	background: #fffaf0;
	border-color: #f2c46d;
}
.inline-result.high-risk {
	background: #fff2f2;
	border-color: #ef9a9a;
}
.inline-result.low-risk {
	background: #f2fbf5;
	border-color: #9ad9ac;
}
.result-head {
	display: flex;
	justify-content: space-between;
	align-items: center;
}
.result-title {
	font-size: 28rpx;
	font-weight: 700;
	color: #202a43;
}
.risk-badge {
	padding: 4rpx 14rpx;
	border-radius: 999rpx;
	font-size: 20rpx;
}
.risk-badge.high-risk {
	color: #c62828;
	background: #fde8e8;
}
.risk-badge.medium-risk {
	color: #b26a00;
	background: #fff3da;
}
.risk-badge.low-risk {
	color: #1b7f3a;
	background: #e9f9ee;
}
.result-risk {
	margin-top: 8rpx;
	font-size: 24rpx;
	color: #2f80ff;
}
.result-text {
	margin-top: 8rpx;
	font-size: 22rpx;
	color: #70788f;
}
.detail-block {
	margin-top: 14rpx;
	padding: 12rpx;
	border-radius: 10rpx;
	background: #ffffff;
	border: 1rpx solid #e5e9f2;
}
.detail-title {
	font-size: 24rpx;
	font-weight: 600;
	color: #1f2a44;
	margin-bottom: 8rpx;
}
.detail-item {
	font-size: 22rpx;
	color: #4e596f;
	line-height: 1.6;
}
.placeholder-title {
	font-size: 28rpx;
	font-weight: 700;
	color: #1f2a44;
}
.placeholder-subtitle {
	margin-top: 10rpx;
	font-size: 22rpx;
	color: #8a92a2;
}
</style>

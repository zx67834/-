<template>
	<view class="page">
		<view class="bg-glow"></view>
		<view class="title">{{ pageTitle }}</view>
		<view class="subtitle">上传或粘贴内容，系统将进行风险分析。</view>

		<view class="tabs">
			<view v-for="item in tabs" :key="item.key" class="tab" :class="{ active: current === item.key }" @click="switchType(item.key)">
				{{ item.name }}
			</view>
		</view>

		<view class="panel glass-card">
			<view class="panel-title">{{ panelTitle }}</view>

			<view v-if="current === 'text'">
				<textarea v-model="textContent" class="text-area" placeholder="请输入需要检测的文本，或上传 txt 文件"></textarea>
				<view class="upload-mini" @click="mockUpload">{{ fileMap.text || '上传 txt 文件' }}</view>
			</view>

			<view v-else-if="current === 'image'">
				<view class="upload-box" hover-class="upload-box-hover" @click="mockUpload">
					{{ fileMap.image ? fileMap.image : '点击上传图片' }}
				</view>
			</view>

			<view v-else-if="current === 'voice'">
				<view class="voice-panel">
					<button class="record-btn" @touchstart="startRecord" @touchend="stopRecord">{{ recording ? '松开发送' : '按住录音' }}</button>
					<view class="voice-status">{{ fileMap.voice || '未上传语音，可长按录音或上传语音文件' }}</view>
					<view class="upload-mini" @click="mockUpload">上传语音文件</view>
				</view>
			</view>

			<view v-else>
				<view class="upload-box" hover-class="upload-box-hover" @click="mockUpload">
					{{ fileMap.video ? fileMap.video : '点击上传视频' }}
				</view>
				<view class="video-tip">建议上传 15 秒内视频，提升识别速度</view>
			</view>

			<view class="hint">{{ hintText }}</view>
		</view>

		<button class="submit-btn" :disabled="detecting" @click="startDetect">{{ detecting ? '检测中...' : '开始检测' }}</button>

		<view v-if="result" class="result-panel glass-card">
			<view class="result-title">检测结果</view>
			<view class="result-risk">风险评分：{{ result.score }} 分（{{ result.level }}）</view>
			<view class="result-text">{{ result.tip }}</view>
		</view>

		<view v-if="result" class="detail-panel glass-card">
			<view class="result-title">检测结果详情</view>
			<view class="warn-banner">风险等级：{{ result.level }}，请结合上下文谨慎判断</view>
			<view class="detail-grid">
				<view class="detail-card">
					<view class="detail-title">检测到的风险点</view>
					<view class="detail-text">{{ detailRisk }}</view>
				</view>
				<view class="detail-card">
					<view class="detail-title">建议措施</view>
					<view class="detail-text">{{ detailAdvice }}</view>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
	const MAP = {
		text: {
			title: '文字反诈检测',
			panel: '输入或上传文本内容'
		},
		image: {
			title: '图片反诈检测',
			panel: '上传图片'
		},
		voice: {
			title: '语音反诈检测',
			panel: '上传语音'
		},
		video: {
			title: '视频反诈检测',
			panel: '上传视频'
		}
	}

	export default {
		data() {
			return {
				current: 'text',
				recording: false,
				textContent: '',
				fileMap: {
					text: '',
					image: '',
					voice: '',
					video: ''
				},
				detecting: false,
				result: null,
				tabs: [{
						key: 'text',
						name: '文字'
					},
					{
						key: 'image',
						name: '图片'
					},
					{
						key: 'voice',
						name: '语音'
					},
					{
						key: 'video',
						name: '视频'
					}
				]
			}
		},
		computed: {
			pageTitle() {
				return MAP[this.current].title
			},
			panelTitle() {
				return MAP[this.current].panel
			},
			hintText() {
				if (this.current === 'text') return '支持文本粘贴与 TXT 文件，最大 10MB'
				if (this.current === 'image') return '支持 JPG/PNG/GIF，最大 10MB'
				if (this.current === 'voice') return '支持 MP3/WAV，建议 60 秒以内'
				return '支持 MP4/MOV，最大 10MB'
			},
			detailRisk() {
				if (!this.result) return ''
				if (this.current === 'text') return '检测到短句诱导词与身份冒充关键词，存在社工话术风险。'
				if (this.current === 'image') return '图片中存在“紧急转账/官方通知”等可疑视觉文本组合。'
				if (this.current === 'voice') return '语音出现催促转账、限制思考时间等高压表达。'
				return '视频脚本存在“高收益承诺+私下转账”典型诈骗模式。'
			},
			detailAdvice() {
				if (!this.result) return ''
				if (this.current === 'text') return '先核验身份来源，不点击陌生链接，不提供验证码与银行卡信息。'
				if (this.current === 'image') return '通过官方渠道二次验证截图真伪，避免按图中联系方式回拨。'
				if (this.current === 'voice') return '立刻中止通话并回拨官方电话核验，必要时开启来电拦截。'
				return '不要被视频引导私下交易，先在正规平台核验主体资质与真实性。'
			}
		},
		onLoad(options) {
			if (options.type && MAP[options.type]) {
				this.current = options.type
			}
		},
		methods: {
			switchType(type) {
				this.current = type
				this.result = null
			},
			mockUpload() {
				const extMap = {
					text: ['txt'],
					image: ['jpg', 'jpeg', 'png'],
					voice: ['mp3', 'wav'],
					video: ['mp4', 'mov']
				}
				uni.chooseMessageFile({
					count: 1,
					type: 'file',
					extension: extMap[this.current],
					success: res => {
						this.fileMap[this.current] = res.tempFiles[0].name
					},
					fail: () => {
						uni.showToast({
							title: '未选择文件',
							icon: 'none'
						})
					}
				})
			},
			startRecord() {
				this.recording = true
			},
			stopRecord() {
				this.recording = false
				this.fileMap.voice = `语音_${Date.now()}.wav`
			},
			startDetect() {
			const hasText = this.current === 'text' && this.textContent.trim()
			const hasFile = Boolean(this.fileMap[this.current])
			if (!hasText && !hasFile) {
				uni.showToast({
					title: this.current === 'text' ? '请输入文本或上传文件' : '请先选择文件',
					icon: 'none'
				})
				return
			}
			this.detecting = true
			this.result = null
			
			// 根据当前类型调用相应的后端 API
			if (this.current === 'text') {
				// 调用文本分析 API
				uni.request({
					url: 'http://localhost:7007/api/analyze/text',
					method: 'POST',
					header: {
						'Content-Type': 'application/json'
					},
					data: {
						text: this.textContent.trim()
					},
					success: (res) => {
						this.detecting = false
						if (res.statusCode === 200 && res.data.success) {
							const analysis = res.data.analysis
							this.result = {
								score: analysis.risk_level === 'high' ? 85 : analysis.risk_level === 'medium' ? 65 : 45,
								level: analysis.risk_level === 'high' ? '高风险' : analysis.risk_level === 'medium' ? '中风险' : '低风险',
								tip: analysis.summary
							}
						} else {
							uni.showToast({
								title: '分析失败，请稍后重试',
								icon: 'none'
							})
						}
					},
					fail: (err) => {
						this.detecting = false
						uni.showToast({
							title: '网络连接失败',
							icon: 'none'
						})
						console.error('文本分析失败:', err)
					}
				})
			} else if (this.current === 'image') {
				// 调用图片分析 API
				uni.showToast({
					title: '图片分析功能开发中',
					icon: 'none'
				})
				this.detecting = false
			} else if (this.current === 'voice') {
				// 调用音频分析 API
				uni.showToast({
					title: '音频分析功能开发中',
					icon: 'none'
				})
				this.detecting = false
			} else {
				// 视频分析功能
				uni.showToast({
					title: '视频分析功能开发中',
					icon: 'none'
				})
				this.detecting = false
			}
		}
	}
}
</script>

<style lang="scss">
	.page {
		min-height: 100vh;
		background: transparent;
		padding: calc(var(--status-bar-height) + 24rpx) 24rpx 24rpx;
		position: relative;
	}

	.bg-glow {
		position: absolute;
		right: -120rpx;
		top: 100rpx;
		width: 320rpx;
		height: 320rpx;
		background: radial-gradient(circle, rgba(88, 136, 255, 0.2), rgba(88, 136, 255, 0));
		pointer-events: none;
	}

	.title {
		font-size: var(--page-title-size);
		font-weight: var(--page-title-weight);
		color: var(--page-title-color);
		line-height: var(--page-title-line-height);
	}

	.subtitle {
		margin-top: 8rpx;
		font-size: 24rpx;
		color: #8890a6;
	}

	.tabs {
		margin-top: 18rpx;
		display: flex;
		gap: 12rpx;
	}

	.tab {
		padding: 12rpx 22rpx;
		background: #e9eefb;
		color: #5d6883;
		border-radius: 999rpx;
		font-size: 23rpx;
		transition: all 0.18s ease;
	}

	.tab.active {
		background: #2f80ff;
		color: #fff;
	}

	.panel {
		margin-top: 20rpx;
		border-radius: 20rpx;
		padding: 22rpx;
	}

	.panel-title {
		font-size: 30rpx;
		font-weight: 700;
		color: #202a43;
	}

	.upload-box {
		margin-top: 16rpx;
		height: 300rpx;
		border: 2rpx dashed #c8d7fa;
		border-radius: 16rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		color: #7f8baa;
		font-size: 24rpx;
		transition: all 0.18s ease;
	}

	.text-area {
		width: 100%;
		height: 220rpx;
		background: rgba(246, 249, 255, 0.8);
		border-radius: 14rpx;
		padding: 14rpx;
		font-size: 24rpx;
		color: #334;
	}

	.upload-mini {
		margin-top: 12rpx;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		height: 56rpx;
		padding: 0 18rpx;
		border-radius: 999rpx;
		background: #eef4ff;
		color: #376ed8;
		font-size: 22rpx;
	}

	.voice-panel {
		margin-top: 8rpx;
	}

	.record-btn {
		height: 74rpx;
		line-height: 74rpx;
		border-radius: 14rpx;
		background: linear-gradient(135deg, #5b9eff, #2f7dff);
		color: #fff;
		font-size: 26rpx;
	}

	.voice-status {
		margin-top: 10rpx;
		font-size: 22rpx;
		color: #7f8baa;
	}

	.video-tip {
		margin-top: 8rpx;
		font-size: 22rpx;
		color: #7f8baa;
	}

	.upload-box-hover {
		background: #f6f9ff;
	}

	.hint {
		margin-top: 12rpx;
		font-size: 22rpx;
		color: #a0a6b8;
	}

	.submit-btn {
		margin-top: 22rpx;
		height: 84rpx;
		line-height: 84rpx;
		background: linear-gradient(135deg, #3f8cff, #2877ff);
		color: #fff;
		border-radius: 18rpx;
		font-size: 30rpx;
	}

	.submit-btn[disabled] {
		opacity: 0.7;
	}

	.result-panel {
		margin-top: 18rpx;
		border-radius: 16rpx;
		padding: 18rpx;
	}

	.detail-panel {
		margin-top: 16rpx;
		border-radius: 16rpx;
		padding: 18rpx;
	}

	.warn-banner {
		margin-top: 10rpx;
		background: #fff4d6;
		color: #8a5a00;
		border-radius: 10rpx;
		padding: 12rpx;
		font-size: 22rpx;
	}

	.detail-grid {
		margin-top: 12rpx;
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 10rpx;
	}

	.detail-card {
		background: rgba(255, 255, 255, 0.85);
		border: 1px solid #e6ecf8;
		border-radius: 12rpx;
		padding: 12rpx;
	}

	.detail-title {
		font-size: 24rpx;
		font-weight: 700;
		color: #1f2a44;
	}

	.detail-text {
		margin-top: 8rpx;
		font-size: 22rpx;
		line-height: 1.6;
		color: #5f6880;
	}

	.result-title {
		font-size: 28rpx;
		font-weight: 700;
		color: #202a43;
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
</style>

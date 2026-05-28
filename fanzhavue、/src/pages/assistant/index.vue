<template>
	<view class="page" :class="{ 'theme-guardian': isGuardianTheme }">
		<view class="bg-glow"></view>
		<view class="status-holder"></view>
		<view class="hero">
			<view class="mic"></view>
			<view class="wave"></view>
		</view>

		<scroll-view class="chat-wrap" scroll-y>
			<view v-if="!messages.length" class="chat-empty">暂无对话，输入内容或长按麦克风开始</view>
			<view class="chat" :class="item.role" v-for="(item, idx) in messages" :key="idx">
				<view class="bubble" :class="item.role === 'user' ? 'user-bubble' : 'ai-bubble'">
					{{ item.text }}
				</view>
			</view>
		</scroll-view>

		<view class="input-bar glass-card">
			<view class="input-left">
				<input class="text-input" v-model="text" placeholder="输入你的问题，例如：这个电话是不是诈骗？" confirm-type="send"
					@confirm="sendText" />
				<view class="mic-btn" @touchstart="startRecord" @touchend="stopRecord">
					<uni-icons type="mic" size="20" :color="accentIconColor"></uni-icons>
				</view>
				<button class="send-btn" size="mini" @click="sendText">发送</button>
			</view>
			<view class="record-tip">{{ recording ? '松开发送语音' : '长按麦克风说话，也可键盘输入' }}</view>
		</view>
	</view>
</template>

<script>
	import { getApiBaseUrl } from '@/utils/apiBase.js'

	export default {
		data() {
			return {
				recording: false,
				text: '',
				messages: []
			}
		},
		computed: {
			accentIconColor() {
				return this.isGuardianTheme ? '#c62828' : '#2f7dff'
			}
		},
		onLoad() {
			try {
				uni.removeStorageSync('messages')
			} catch (e) {
				/* 忽略 */
			}
		},
		methods: {
			parseResponseBody(data) {
				if (data == null || data === '') return {}
				if (typeof data === 'object' && !Array.isArray(data)) return data
				if (typeof data === 'string') {
					try {
						return JSON.parse(data)
					} catch (e) {
						return {}
					}
				}
				return {}
			},
			requestApi(path, options = {}) {
				const baseUrl = getApiBaseUrl()
				const urlPrimary = `${baseUrl}${path}`
				const urlFallback = baseUrl.includes('127.0.0.1') ? urlPrimary.replace(/127\.0\.0\.1/g, 'localhost') : null
				const run = (fullUrl) =>
					new Promise((resolve, reject) => {
						const reqOpts = { ...options, url: fullUrl }
						const h = reqOpts.header || {}
						const ct = String(h['Content-Type'] || h['content-type'] || '').toLowerCase()
						if (
							ct.includes('application/json') &&
							reqOpts.data != null &&
							typeof reqOpts.data === 'object' &&
							!(reqOpts.data instanceof ArrayBuffer)
						) {
							reqOpts.data = JSON.stringify(reqOpts.data)
						}
						uni.request({
							...reqOpts,
							success: (raw) => {
								resolve({
									statusCode: raw?.statusCode,
									data: this.parseResponseBody(raw?.data),
									header: raw?.header || {}
								})
							},
							fail: (err) => reject(err || new Error('request:fail'))
						})
					})
				return run(urlPrimary).catch((primaryErr) => {
					if (!urlFallback || urlFallback === urlPrimary) return Promise.reject(primaryErr)
					return run(urlFallback).catch(() => Promise.reject(primaryErr))
				})
			},
			startRecord() {
				this.recording = true
				uni.vibrateShort()
			},
			stopRecord() {
				this.recording = false
				this.messages.push({
					role: 'user',
					text: '（语音消息）请帮我判断这个电话是否安全。'
				})
				this.sendMessage('（语音消息）请帮我判断这个电话是否安全。')
			},
			sendText() {
				if (!this.text.trim()) {
					uni.showToast({
						title: '请输入内容',
						icon: 'none'
					})
					return
				}
				const message = this.text.trim()
				this.messages.push({
					role: 'user',
					text: message
				})
				this.text = ''
				this.sendMessage(message)
			},
			sendMessage(message) {
				// 显示加载状态
				uni.showLoading({
					title: '正在分析...'
				})
				
				// 调用后端 API
				this.requestApi('/api/chat', {
					method: 'POST',
					header: {
						'Content-Type': 'application/json'
					},
					data: {
						message: message
					}
				}).then((res) => {
					uni.hideLoading()
					const ok = res.statusCode === 200 || res.statusCode === '200' || Number(res.statusCode) === 200
					if (ok && res.data?.success) {
						this.messages.push({
							role: 'ai',
							text: res.data.reply || '已收到消息'
						})
						return
					}
					this.messages.push({
						role: 'ai',
						text: res.data?.error || '抱歉，分析服务暂时不可用，请稍后再试。'
					})
					console.error('API 调用失败:', res.statusCode, res.data)
				}).catch((err) => {
					uni.hideLoading()
					const msg = String(err?.errMsg || err?.message || '')
					const hint = /fail|timeout|abort|连接|网络/i.test(msg)
						? '网络连接失败，请检查后端地址（系统设置的 API 地址）'
						: '请求失败，请稍后重试'
					this.messages.push({
						role: 'ai',
						text: hint
					})
					console.error('网络请求失败:', err)
				})
			}
		}
	}
</script>

<style lang="scss">
	.page {
		min-height: 100vh;
		background: transparent;
		padding: 0 28rpx 28rpx;
		box-sizing: border-box;
		display: flex;
		flex-direction: column;
		position: relative;
	}

	.bg-glow {
		position: absolute;
		left: -90rpx;
		top: 130rpx;
		width: 280rpx;
		height: 280rpx;
		background: radial-gradient(circle, rgba(112, 162, 255, 0.2), rgba(112, 162, 255, 0));
		pointer-events: none;
	}

	.status-holder {
		height: calc(var(--status-bar-height) + 8rpx);
	}

	.hero {
		height: 320rpx;
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		position: relative;
	}

	.chat-wrap {
		flex: 1;
		margin-top: 10rpx;
		padding-bottom: 12rpx;
	}

	.chat-empty {
		padding: 48rpx 24rpx;
		text-align: center;
		font-size: 26rpx;
		color: #9ba3b8;
		line-height: 1.5;
	}

	.mic {
		width: 200rpx;
		height: 200rpx;
		border-radius: 50%;
		background: linear-gradient(145deg, #5b9eff, #2f7dff);
		box-shadow: 0 20rpx 40rpx rgba(80, 119, 255, 0.4);
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.mic::before {
		content: '';
		width: 120rpx;
		height: 120rpx;
		background: url('../../static/我的机器人语音助手.png') no-repeat center center / contain;
	}

	.wave {
		position: absolute;
		width: 300rpx;
		height: 300rpx;
		border-radius: 50%;
		border: 3px solid rgba(91, 141, 255, 0.3);
		animation: pulse 2s infinite;
	}

	.chat {
		display: flex;
		margin-top: 14rpx;
	}

	.chat.user {
		justify-content: flex-end;
	}

	.chat.ai {
		justify-content: flex-start;
	}

	.bubble {
		max-width: 82%;
		border-radius: 20rpx;
		padding: 20rpx;
		font-size: 27rpx;
		line-height: 1.6;
		animation: bubbleIn 0.25s ease both;
	}

	.user-bubble {
		background: linear-gradient(140deg, #5b9eff, #2f7dff);
		color: #fff;
		border-bottom-right-radius: 8rpx;
	}

	.ai-bubble {
		background: #fff;
		color: #2d3750;
		border-bottom-left-radius: 8rpx;
		box-shadow: 0 8rpx 24rpx rgba(26, 36, 65, 0.08);
	}

	.record-card {
		display: none;
	}

	.input-bar {
		padding-top: 10rpx;
		border-top: 1px solid rgba(180, 191, 214, 0.35);
		border-radius: 20rpx;
		padding-left: 10rpx;
		padding-right: 10rpx;
	}

	.input-left {
		background: #ffffff;
		border-radius: 20rpx;
		padding: 10rpx 14rpx;
		display: flex;
		align-items: center;
		box-shadow: 0 8rpx 20rpx rgba(24, 39, 75, 0.08);
	}

	.text-input {
		flex: 1;
		font-size: 26rpx;
	}

	.send-btn {
		margin-left: 10rpx;
		background: linear-gradient(135deg, #5b9eff, #2f7dff);
		color: #fff;
		border-radius: 999rpx;
		padding: 0 22rpx;
		font-size: 24rpx;
	}

	.mic-btn {
		width: 68rpx;
		height: 68rpx;
		border-radius: 50%;
		background: #eef4ff;
		border: 2rpx solid #c7d8ff;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-left: 10rpx;
	}

	.record-tip {
		font-size: 21rpx;
		color: #9ba3b8;
		margin-top: 8rpx;
		text-align: center;
	}

	@keyframes pulse {
		0% {
			transform: scale(0.95);
			opacity: 0.85;
		}

		70% {
			transform: scale(1.08);
			opacity: 0.2;
		}

		100% {
			transform: scale(1.12);
			opacity: 0;
		}
	}

	@keyframes bubbleIn {
		from {
			opacity: 0;
			transform: translateY(8rpx);
		}

		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	/* 监护人端：与全局 theme-guardian、知识库页红系一致 */
	.page.theme-guardian {
		background: linear-gradient(180deg, #fff8f8 0%, #ffeeee 42%, #fce8ea 100%) !important;
	}

	.theme-guardian .bg-glow {
		background: radial-gradient(circle, rgba(239, 83, 80, 0.22), rgba(239, 83, 80, 0)) !important;
	}

	.theme-guardian .mic {
		background: linear-gradient(145deg, #ef5350, #c62828) !important;
		box-shadow: 0 20rpx 40rpx rgba(198, 40, 40, 0.4) !important;
	}

	.theme-guardian .wave {
		border-color: rgba(239, 83, 80, 0.35) !important;
	}

	.theme-guardian .user-bubble {
		background: linear-gradient(140deg, #ef5350, #c62828) !important;
	}

	.theme-guardian .send-btn {
		background: linear-gradient(135deg, #ef5350, #c62828) !important;
	}

	.theme-guardian .mic-btn {
		background: #ffebee !important;
		border-color: #ffcdd2 !important;
	}

	.theme-guardian .input-bar {
		border-top-color: rgba(198, 40, 40, 0.18);
	}
</style>

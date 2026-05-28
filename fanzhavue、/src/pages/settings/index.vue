<template>
	<scroll-view class="page" :class="{ 'theme-guardian': isGuardianTheme }" scroll-y>
		<view class="bg-glow"></view>
		<view class="section glass-card">
			<view class="section-title">基本设置</view>
			<view class="form-row">
				<text class="label">界面语言</text>
				<picker mode="selector" :range="langs" :value="langIndex" @change="onLangChange">
					<view class="picker-value">{{ langs[langIndex] }}</view>
				</picker>
			</view>
			<view class="form-row">
				<text class="label">主题模式</text>
				<picker mode="selector" :range="themes" :value="themeIndex" @change="onThemeChange">
					<view class="picker-value">{{ themes[themeIndex] }}</view>
				</picker>
			</view>
			<view class="form-row">
				<text class="label">时区</text>
				<view class="picker-value">Asia/Shanghai</view>
			</view>
			<view class="form-row form-row-col">
				<view class="form-col-head">
					<text class="label">后端 API 根地址</text>
					<text class="api-hint">真机调试请填电脑局域网 IP，如 http://192.168.1.3:7007；留空则用本机默认</text>
				</view>
				<input
					v-model="apiBaseUrl"
					class="api-input"
					placeholder="留空默认 http://127.0.0.1:7007"
					placeholder-class="api-placeholder"
				/>
			</view>
		</view>

		<view class="section glass-card">
			<view class="section-title">隐私与安全</view>
			<view class="switch-row">
				<view>
					<view class="label">匿名数据收集</view>
					<view class="desc">用于持续优化反诈模型表现</view>
				</view>
				<switch color="#2f80ff" :checked="collect" @change="e => collect = e.detail.value" />
			</view>
			<view class="switch-row">
				<view>
					<view class="label">自动更新知识库</view>
					<view class="desc">从权威渠道同步最新诈骗案例</view>
				</view>
				<switch color="#2f80ff" :checked="autoUpdate" @change="e => autoUpdate = e.detail.value" />
			</view>
		</view>

		<button v-if="isLoggedIn" class="logout-btn" @click="logout">
			{{ isGuardianUser ? '退出登录（监护人端）' : '退出登录（被监护人端）' }}
		</button>
		<button class="save-btn" @click="save">保存系统设置</button>
	</scroll-view>
</template>

<script>
	export default {
		data() {
			return {
				langs: ['zh-CN', 'en-US'],
				themes: ['light', 'dark'],
				langIndex: 0,
				themeIndex: 0,
				collect: true,
				autoUpdate: true,
				isLoggedIn: false,
				isGuardianUser: false,
				apiBaseUrl: ''
			}
		},
		methods: {
			onLangChange(e) {
				this.langIndex = Number(e.detail.value)
			},
			onThemeChange(e) {
				this.themeIndex = Number(e.detail.value)
			},
			save() {
				const trimmed = String(this.apiBaseUrl || '').trim().replace(/\/+$/, '')
				if (trimmed) {
					uni.setStorageSync('api_base_url', trimmed)
				} else {
					try {
						uni.removeStorageSync('api_base_url')
					} catch (e) {
						uni.setStorageSync('api_base_url', '')
					}
				}
				uni.setStorageSync('app_settings', {
					langIndex: this.langIndex,
					themeIndex: this.themeIndex,
					collect: this.collect,
					autoUpdate: this.autoUpdate
				})
				uni.showToast({
					title: '设置已保存',
					icon: 'success'
				})
			},
			logout() {
				uni.showModal({
					title: '确认登出',
					content: '确定要退出登录吗？',
					confirmText: '确定',
					cancelText: '取消',
					success: (res) => {
						if (res.confirm) {
							uni.setStorageSync('is_logged_in', '0')
							this.isLoggedIn = false
							this.isGuardianUser = false
							if (typeof this.refreshGuardianTheme === 'function') {
								this.refreshGuardianTheme()
							}
							uni.showToast({
								title: '已退出登录',
								icon: 'none'
							})
							uni.navigateBack()
						}
					}
				})
			}
		},
		onShow() {
			const flag = uni.getStorageSync('is_logged_in')
			this.isLoggedIn = flag === true || flag === 1 || flag === '1' || flag === 'true'
			const accounts = uni.getStorageSync('user_accounts') || []
			const idx = Number(uni.getStorageSync('active_user_account_index') || 0)
			const acc = Array.isArray(accounts) ? (accounts[idx] || accounts[0]) : null
			this.isGuardianUser = Boolean(acc && acc.userType === '监护人')

			const cache = uni.getStorageSync('app_settings')
			if (cache) {
				this.langIndex = Number(cache.langIndex ?? 0)
				this.themeIndex = Number(cache.themeIndex ?? 0)
				this.collect = Boolean(cache.collect)
				this.autoUpdate = Boolean(cache.autoUpdate)
			}
			const savedApi = uni.getStorageSync('api_base_url')
			this.apiBaseUrl = typeof savedApi === 'string' ? savedApi : ''
		}
	}
</script>

<style lang="scss">
	.page {
		min-height: 100vh;
		background: transparent;
		padding: calc(var(--status-bar-height) + 24rpx) 24rpx 40rpx;
		box-sizing: border-box;
		position: relative;
	}

	.bg-glow {
		position: absolute;
		right: -90rpx;
		top: 120rpx;
		width: 260rpx;
		height: 260rpx;
		background: radial-gradient(circle, rgba(138, 170, 255, 0.2), rgba(138, 170, 255, 0));
		pointer-events: none;
	}

	.section {
		border-radius: 20rpx;
		padding: 24rpx 22rpx;
		box-shadow: 0 8rpx 24rpx rgba(24, 39, 75, 0.06);
		margin-bottom: 18rpx;
	}

	.section-title {
		font-size: 30rpx;
		font-weight: 700;
		color: #202a43;
		margin-bottom: 12rpx;
	}

	.form-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 14rpx 0;
	}

	.label {
		font-size: 26rpx;
		color: #333c57;
	}

	.picker-value {
		font-size: 24rpx;
		color: #6f768c;
	}

	.picker-value.small {
		max-width: 380rpx;
		text-align: right;
	}

	.form-row-col {
		flex-direction: column;
		align-items: stretch;
		gap: 12rpx;
	}

	.form-col-head {
		width: 100%;
	}

	.api-hint {
		display: block;
		margin-top: 6rpx;
		font-size: 22rpx;
		color: #a0a6b8;
		line-height: 1.45;
	}

	.api-input {
		width: 100%;
		box-sizing: border-box;
		padding: 16rpx 18rpx;
		font-size: 26rpx;
		color: #333c57;
		background: #f5f7fb;
		border-radius: 12rpx;
		border: 1rpx solid #e8ecf4;
	}

	.api-placeholder {
		color: #b4bac9;
		font-size: 24rpx;
	}

	.switch-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 16rpx 0;
	}

	.desc {
		margin-top: 4rpx;
		font-size: 22rpx;
		color: #a0a6b8;
	}

	.logout-btn {
			margin-top: 12rpx;
			height: 84rpx;
			line-height: 84rpx;
			background: #fff;
			color: #d25d5d;
			border: 2rpx solid #f4cdcd;
			border-radius: 18rpx;
			font-size: 30rpx;
		}

		.save-btn {
			margin-top: 12rpx;
			height: 84rpx;
			line-height: 84rpx;
			background: linear-gradient(135deg, #3f8cff, #2877ff);
			color: #fff;
			border-radius: 18rpx;
			font-size: 30rpx;
		}
</style>


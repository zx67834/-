<template>
	<scroll-view class="page" scroll-y>
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
			<view class="form-row">
				<text class="label">API 地址</text>
				<view class="picker-value small">https://api.anti-fraud.example.com/v1</view>
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

		<button class="logout-btn" @click="logout">登出账号</button>
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
				autoUpdate: true
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
							// 清除登录状态
							uni.setStorageSync('is_logged_in', false);
							// 显示登出成功提示
							uni.showToast({
								title: '已退出登录',
								icon: 'none'
							});
							// 返回到个人中心页面
							uni.navigateBack();
						}
					}
				});
			}
		},
		onShow() {
			const cache = uni.getStorageSync('app_settings')
			if (!cache) return
			this.langIndex = Number(cache.langIndex ?? 0)
			this.themeIndex = Number(cache.themeIndex ?? 0)
			this.collect = Boolean(cache.collect)
			this.autoUpdate = Boolean(cache.autoUpdate)
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


<template>
	<view class="page">
		<view class="bg-glow"></view>
		<view class="title">个人中心</view>
		<view class="profile-card glass-card">
			<view class="avatar"></view>
			<view class="name">王小明</view>
			<view class="email">wanqxm@example.com</view>
			<view class="pid">用户ID：USER_20250302</view>
			<view class="profile-actions">
				<view class="level">普通用户 · 中风险</view>
				<button class="primary-btn" size="mini" @click="changeAvatar">更换头像</button>
			</view>
		</view>

		<view class="panel glass-card">
			<view class="panel-title">账户安全</view>
			<view class="row">
				<text>密码强度</text>
				<text class="ok">强</text>
			</view>
			<view class="row">
				<text>双重认证</text>
				<switch color="#2f80ff" :checked="mfaEnabled" @change="onMfaChange" />
			</view>
			<view class="row link" @click="goSettings">
				<text>系统设置</text>
				<text class="arrow">›</text>
			</view>
		</view>

		<view class="panel glass-card">
			<view class="panel-title">历史行为分析</view>
			<view class="stat-row">
				<view>
					<view class="stat-title">通话识别</view>
					<view class="stat-desc">近 30 天识别可疑来电 12 次</view>
				</view>
				<view class="stat-value">12</view>
			</view>
			<view class="stat-row">
				<view>
					<view class="stat-title">成功拦截</view>
					<view class="stat-desc">成功拦截高风险行为 5 次</view>
				</view>
				<view class="stat-value green">5</view>
			</view>
		</view>
	</view>
</template>

<script>
	export default {
		data() {
			return {
				mfaEnabled: true
			}
		},
		onLoad() {
			// 从本地存储加载双重认证状态
			const savedMfaEnabled = uni.getStorageSync('mfaEnabled');
			if (savedMfaEnabled !== null && savedMfaEnabled !== undefined) {
				this.mfaEnabled = savedMfaEnabled;
			}
		},
		watch: {
			mfaEnabled: {
				handler(newMfaEnabled) {
					// 当双重认证状态变化时保存到本地存储
					try {
						uni.setStorageSync('mfaEnabled', newMfaEnabled);
					} catch (e) {
						console.error('保存双重认证状态失败:', e);
					}
				}
			}
		},
		methods: {
			changeAvatar() {
				uni.showToast({
					title: '头像更换功能开发中',
					icon: 'none'
				})
			},
			onMfaChange(e) {
				this.mfaEnabled = e.detail.value
				uni.showToast({
					title: this.mfaEnabled ? '双重认证已开启' : '双重认证已关闭',
					icon: 'none'
				})
			},
			goSettings() {
				uni.navigateTo({
					url: '/pages/settings/index'
				})
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
		left: -80rpx;
		top: 140rpx;
		width: 240rpx;
		height: 240rpx;
		background: radial-gradient(circle, rgba(120, 160, 255, 0.18), rgba(120, 160, 255, 0));
		pointer-events: none;
	}

	.title {
		font-size: var(--page-title-size);
		font-weight: var(--page-title-weight);
		color: var(--page-title-color);
		line-height: var(--page-title-line-height);
	}

	.profile-card {
		margin-top: 20rpx;
		border-radius: 20rpx;
		padding: 30rpx;
		text-align: center;
	}

	.avatar {
		width: 120rpx;
		height: 120rpx;
		border-radius: 50%;
		margin: 0 auto;
		background: linear-gradient(145deg, #5fa4ff, #2468ff);
	}

	.name {
		margin-top: 16rpx;
		font-size: 34rpx;
		font-weight: 700;
		color: #202a43;
	}

	.email {
		margin-top: 6rpx;
		font-size: 24rpx;
		color: #8991a6;
	}

	.pid {
		margin-top: 6rpx;
		font-size: 22rpx;
		color: #b0b6c7;
	}

	.level {
		display: inline-flex;
		align-items: center;
		padding: 6rpx 16rpx;
		border-radius: 999rpx;
		background: #e8f0ff;
		color: #2f80ff;
		font-size: 22rpx;
		white-space: nowrap;
	}

	.profile-actions {
		margin-top: 14rpx;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 10rpx;
	}

	.primary-btn {
		height: 60rpx;
		line-height: 60rpx;
		border-radius: 999rpx;
		background: #ffffff;
		color: #2f80ff;
		border: 2rpx solid #d1e1ff;
		font-size: 24rpx;
		padding: 0 22rpx;
		white-space: nowrap;
	}

	.panel {
		margin-top: 16rpx;
		border-radius: 20rpx;
		padding: 24rpx;
	}

	.panel-title {
		font-size: 30rpx;
		font-weight: 700;
		color: #202a43;
	}

	.row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding-top: 18rpx;
		font-size: 26rpx;
		color: #303a52;
	}

	.ok {
		color: #24b36b;
	}

	.row.link {
		border-top-width: 1rpx;
		border-top-style: solid;
		border-top-color: #f0f2f7;
		margin-top: 12rpx;
		padding-top: 20rpx;
	}

	.arrow {
		color: #c0c5d3;
	}

	.panel:last-child {
		margin-bottom: 20rpx;
	}

	.stat-row {
		margin-top: 16rpx;
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.stat-title {
		font-size: 26rpx;
		color: #303a52;
	}

	.stat-desc {
		margin-top: 4rpx;
		font-size: 22rpx;
		color: #a0a6b8;
	}

	.stat-value {
		font-size: 32rpx;
		font-weight: 700;
		color: #f2994a;
	}

	.stat-value.green {
		color: #27ae60;
	}
</style>

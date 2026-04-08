<template>
	<view class="page">
		<view class="bg-glow"></view>
		<view class="status-holder"></view>
		<view class="top-brand fade-up">
			<view class="brand-left">
				<view class="back-btn" @click="goBack">
					<uni-icons type="back" size="24" color="#1f2a44"></uni-icons>
				</view>
				<view class="logo-dot">
					<view class="logo-icon">🛡️</view>
				</view>
				<view>
					<view class="brand-title">安全中心</view>
					<view class="brand-sub">全面守护您的财产安全</view>
				</view>
			</view>
			<view class="brand-right">
				<view class="notification-badge" @click="refreshStatus">
					<uni-icons type="refresh" size="20" color="#617191"></uni-icons>
				</view>
			</view>
		</view>

		<view class="safety-score fade-up">
			<view class="score-circle">
				<view class="score-value">{{ safetyScore }}<text class="score-unit">%</text></view>
				<view class="score-label">安全指数</view>
			</view>
			<view class="score-desc">您的账户安全状态良好</view>
		</view>

		<view class="panel fade-up glass-card">
			<view class="panel-head">
				<view class="panel-title">
					<uni-icons type="stats-bars" size="20" color="#2f64f5"></uni-icons>
					安全数据统计
				</view>
			</view>
			<view class="stats-row">
				<view class="stat-card blue">
					<view class="stat-label">报告总数</view>
					<view class="stat-num">{{ totalAlerts }}</view>
				</view>
				<view class="stat-card yellow">
					<view class="stat-label">高风险报告</view>
					<view class="stat-num">{{ todayBlocked }}</view>
				</view>
				<view class="stat-card green">
					<view class="stat-label">风险下降</view>
					<view class="stat-num">{{ safetyScore }}%</view>
				</view>
			</view>
		</view>

		<view class="panel fade-up glass-card">
			<view class="panel-head">
				<view class="panel-title">
					<uni-icons type="shield" size="20" color="#2f64f5"></uni-icons>
					防护状态
				</view>
			</view>
			<view class="status-list">
				<view class="status-item">
					<view class="status-icon">
						<uni-icons type="checkmark" size="20" color="#22C55E"></uni-icons>
					</view>
					<view class="status-content">
						<view class="status-name">账户保护</view>
						<view class="status-desc">已开启双重认证</view>
					</view>
					<view class="status-dot online"></view>
				</view>
				<view class="status-item">
					<view class="status-icon">
						<uni-icons type="checkmark" size="20" color="#22C55E"></uni-icons>
					</view>
					<view class="status-content">
						<view class="status-name">交易防护</view>
						<view class="status-desc">实时监控异常交易</view>
					</view>
					<view class="status-dot online"></view>
				</view>
				<view class="status-item">
					<view class="status-icon">
						<uni-icons type="checkmark" size="20" color="#22C55E"></uni-icons>
					</view>
					<view class="status-content">
						<view class="status-name">隐私保护</view>
						<view class="status-desc">数据加密存储</view>
					</view>
					<view class="status-dot online"></view>
				</view>
				<view class="status-item">
					<view class="status-icon">
						<uni-icons type="alert" size="20" color="#F59E0B"></uni-icons>
					</view>
					<view class="status-content">
						<view class="status-name">系统更新</view>
						<view class="status-desc">有新版本可用</view>
					</view>
					<view class="status-dot warning"></view>
				</view>
			</view>
		</view>

		<view class="panel fade-up glass-card">
			<view class="panel-head">
				<view class="panel-title">
					<uni-icons type="chatbubble" size="20" color="#2f64f5"></uni-icons>
					最新安全动态
				</view>
				<text class="head-more" @click="viewAllAlerts">
					查看全部
					<uni-icons type="arrow-right" size="14" color="#8E95A8"></uni-icons>
				</text>
			</view>
			<view class="alert-list">
				<view class="alert-item" v-for="(alert, index) in recentAlerts" :key="index">
					<view class="alert-icon">
						<uni-icons :type="alert.icon" size="20" :color="alert.color"></uni-icons>
					</view>
					<view class="alert-content">
						<view class="alert-title">{{ alert.title }}</view>
						<view class="alert-time">{{ alert.time }}</view>
					</view>
					<view class="alert-dot" :style="{background: alert.color}"></view>
				</view>
			</view>
		</view>

		<view class="panel fade-up glass-card">
			<view class="panel-head">
				<view class="panel-title">
					<uni-icons type="settings" size="20" color="#2f64f5"></uni-icons>
					安全设置
				</view>
			</view>
			<view class="setting-list">
				<view class="setting-item" @click="toggleSetting('notification')">
					<view class="setting-left">
						<view class="setting-icon">
							<uni-icons type="notification" size="20" color="#2f64f5"></uni-icons>
						</view>
						<view class="setting-text">
							<view class="setting-name">安全通知</view>
							<view class="setting-desc">接收安全预警</view>
						</view>
					</view>
					<view class="setting-switch">
						<uni-icons :type="settings.notification ? 'checkmarkempty' : 'closeempty'" size="20" :color="settings.notification ? '#22C55E' : '#9CA3AF'"></uni-icons>
					</view>
				</view>
				<view class="setting-item" @click="toggleSetting('autoBlock')">
					<view class="setting-left">
						<view class="setting-icon">
							<uni-icons type="block" size="20" color="#2f64f5"></uni-icons>
						</view>
						<view class="setting-text">
							<view class="setting-name">自动拦截</view>
							<view class="setting-desc">拦截高风险来电</view>
						</view>
					</view>
					<view class="setting-switch">
						<uni-icons :type="settings.autoBlock ? 'checkmarkempty' : 'closeempty'" size="20" :color="settings.autoBlock ? '#22C55E' : '#9CA3AF'"></uni-icons>
					</view>
				</view>
				<view class="setting-item" @click="toggleSetting('familyGuard')">
					<view class="setting-left">
						<view class="setting-icon">
							<uni-icons type="person" size="20" color="#2f64f5"></uni-icons>
						</view>
						<view class="setting-text">
							<view class="setting-name">家庭守护</view>
							<view class="setting-desc">保护家人安全</view>
						</view>
					</view>
					<view class="setting-switch">
						<uni-icons :type="settings.familyGuard ? 'checkmarkempty' : 'closeempty'" size="20" :color="settings.familyGuard ? '#22C55E' : '#9CA3AF'"></uni-icons>
					</view>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
	export default {
		data() {
			return {
				safetyScore: 96,
				totalAlerts: 128,
				todayBlocked: 5,
				settings: {
					notification: true,
					autoBlock: true,
					familyGuard: true
				},
				recentAlerts: [
					{
						title: '检测到疑似诈骗电话',
						time: '2分钟前',
						icon: 'alert',
						color: '#EF4444'
					},
					{
						title: '家人安全状态更新',
						time: '15分钟前',
						icon: 'person',
						color: '#22C55E'
					},
					{
						title: '系统安全升级完成',
						time: '1小时前',
						icon: 'info',
						color: '#2F80FF'
					}
				]
			}
		},
		methods: {
			goBack() {
				uni.navigateBack()
			},
			refreshStatus() {
				uni.showToast({
					title: '状态已刷新',
					icon: 'success'
				})
			},
			toggleSetting(key) {
				this.settings[key] = !this.settings[key]
				uni.showToast({
					title: this.settings[key] ? '已开启' : '已关闭',
					icon: 'none'
				})
			},
			viewAllAlerts() {
				uni.navigateTo({
					url: '/pages/alerts/index'
				})
			}
		}
	}
</script>

<style lang="scss">
	.page {
		min-height: 100vh;
		background: transparent;
		padding: 24rpx 28rpx 60rpx;
		box-sizing: border-box;
		position: relative;
		overflow: hidden;
	}

	.bg-glow {
		position: absolute;
		right: -120rpx;
		top: 20rpx;
		width: 360rpx;
		height: 360rpx;
		background: radial-gradient(circle, rgba(110, 157, 255, 0.25), rgba(110, 157, 255, 0));
		pointer-events: none;
	}

	.status-holder {
		height: calc(var(--status-bar-height) + 12rpx);
	}

	.top-brand {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 20rpx;
	}

	.brand-left {
		display: flex;
		align-items: center;
		gap: 16rpx;
	}

	.back-btn {
		width: 48rpx;
		height: 48rpx;
		border-radius: 14rpx;
		background: #f5f7fb;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-right: 8rpx;
	}

	.logo-dot {
		width: 68rpx;
		height: 68rpx;
		border-radius: 22rpx;
		background: linear-gradient(145deg, #5fa4ff, #2468ff);
		box-shadow: 0 16rpx 36rpx rgba(47, 128, 255, 0.32);
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.logo-icon {
		font-size: 34rpx;
	}

	.brand-right {
		display: flex;
		align-items: center;
		gap: 12rpx;
	}

	.notification-badge {
		width: 48rpx;
		height: 48rpx;
		border-radius: 14rpx;
		background: #f5f7fb;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.brand-title {
		font-size: 32rpx;
		font-weight: 700;
		color: #1f2a44;
	}

	.brand-sub {
		font-size: 22rpx;
		color: #8f96a8;
		margin-top: 2rpx;
	}

	.safety-score {
		margin-top: 28rpx;
		text-align: center;
	}

	.score-circle {
		width: 200rpx;
		height: 200rpx;
		border-radius: 50%;
		background: linear-gradient(135deg, #4facfe, #00f2fe);
		box-shadow: 0 20rpx 40rpx rgba(79, 172, 254, 0.3);
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		margin: 0 auto 16rpx;
		color: #fff;
	}

	.score-value {
		font-size: 60rpx;
		font-weight: 700;
	}

	.score-unit {
		font-size: 32rpx;
		font-weight: 500;
		margin-left: 4rpx;
	}

	.score-label {
		font-size: 24rpx;
		opacity: 0.9;
		margin-top: 8rpx;
	}

	.score-desc {
		font-size: 26rpx;
		color: #5f6880;
	}

	.panel {
		margin-top: 28rpx;
		border-radius: 32rpx;
		padding: 36rpx;
	}

	.panel-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 20rpx;
	}

	.panel-title {
		font-size: 32rpx;
		font-weight: 700;
		color: #1f2a44;
		display: flex;
		align-items: center;
		gap: 10rpx;
	}

	.head-more {
		color: #8e95a8;
		font-size: 24rpx;
		display: flex;
		align-items: center;
		gap: 6rpx;
	}

	.stats-row {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 16rpx;
	}

	.stat-card {
		padding: 20rpx;
		border-radius: 20rpx;
	}

	.stat-card.blue {
		background: linear-gradient(135deg, #e8f0ff, #dbe8ff);
	}

	.stat-card.yellow {
		background: linear-gradient(135deg, #fff8e7, #ffecc4);
	}

	.stat-card.green {
		background: linear-gradient(135deg, #e6f9ee, #d1f7e1);
	}

	.stat-label {
		font-size: 22rpx;
		color: #5e6a86;
	}

	.stat-num {
		margin-top: 8rpx;
		font-size: 40rpx;
		font-weight: 700;
		color: #1f2a44;
	}

	.status-list {
		margin-top: 20rpx;
	}

	.status-item {
		display: flex;
		align-items: center;
		padding: 20rpx 0;
		border-bottom: 1px solid #f0f2f7;
	}

	.status-item:last-child {
		border-bottom: 0;
	}

	.status-icon {
		width: 52rpx;
		height: 52rpx;
		border-radius: 14rpx;
		background: #f5f7fb;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-right: 16rpx;
		flex-shrink: 0;
	}

	.status-content {
		flex: 1;
	}

	.status-name {
		font-size: 28rpx;
		font-weight: 500;
		color: #1f2a44;
	}

	.status-desc {
		font-size: 22rpx;
		color: #8f96a8;
		margin-top: 4rpx;
	}

	.status-dot {
		width: 12rpx;
		height: 12rpx;
		border-radius: 50%;
		margin-left: 12rpx;
		flex-shrink: 0;
	}

	.status-dot.online {
		background: #22C55E;
	}

	.status-dot.warning {
		background: #F59E0B;
	}

	.alert-list {
		margin-top: 16rpx;
	}

	.alert-item {
		display: flex;
		align-items: center;
		padding: 20rpx 0;
		border-bottom: 1px solid #f0f2f7;
	}

	.alert-item:last-child {
		border-bottom: 0;
	}

	.alert-icon {
		width: 52rpx;
		height: 52rpx;
		border-radius: 14rpx;
		background: #f5f7fb;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-right: 16rpx;
		flex-shrink: 0;
	}

	.alert-content {
		flex: 1;
	}

	.alert-title {
		font-size: 28rpx;
		font-weight: 500;
		color: #1f2a44;
	}

	.alert-time {
		font-size: 22rpx;
		color: #8f96a8;
		margin-top: 4rpx;
	}

	.alert-dot {
		width: 12rpx;
		height: 12rpx;
		border-radius: 50%;
		margin-left: 12rpx;
		flex-shrink: 0;
	}

	.setting-list {
		margin-top: 20rpx;
	}

	.setting-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 24rpx 0;
		border-bottom: 1px solid #f0f2f7;
	}

	.setting-item:last-child {
		border-bottom: 0;
	}

	.setting-left {
		display: flex;
		align-items: center;
		gap: 16rpx;
		flex: 1;
	}

	.setting-icon {
		width: 52rpx;
		height: 52rpx;
		border-radius: 14rpx;
		background: #f5f7fb;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}

	.setting-text {
		flex: 1;
	}

	.setting-name {
		font-size: 28rpx;
		font-weight: 500;
		color: #1f2a44;
	}

	.setting-desc {
		font-size: 22rpx;
		color: #8f96a8;
		margin-top: 4rpx;
	}

	.setting-switch {
		display: flex;
		align-items: center;
	}

	.fade-up {
		animation: fadeUp 0.5s ease both;
	}

	.fade-up:nth-child(1) { animation-delay: 0.05s; }
	.fade-up:nth-child(2) { animation-delay: 0.1s; }
	.fade-up:nth-child(3) { animation-delay: 0.15s; }
	.fade-up:nth-child(4) { animation-delay: 0.2s; }
	.fade-up:nth-child(5) { animation-delay: 0.25s; }
	.fade-up:nth-child(6) { animation-delay: 0.3s; }

	@keyframes fadeUp {
		from {
			opacity: 0;
			transform: translateY(16rpx);
		}

		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
</style>

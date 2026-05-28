<template>
	<view class="page" :class="{ 'theme-guardian': isGuardianTheme }">
		<view class="bg-glow"></view>
		<view class="status-holder"></view>
		<view class="top-brand">
			<view class="brand-left">
				<view class="logo-dot">
					<image class="logo-dot-img" src="/static/安全工具 .png" mode="aspectFit" />
				</view>
				<view>
					<view class="brand-title">安全工具</view>
					<view class="brand-sub">全方位守护您的财产安全</view>
				</view>
			</view>
		</view>

		<view class="quick-grid">
			<view v-for="(card, index) in quickCards" :key="card.title" class="quick-card" :class="card.theme" hover-class="quick-card-hover"
				@click="tapAction(card)">
				<view class="card-icon">
					<image v-if="card.iconSrc" class="card-icon-img" :src="card.iconSrc" mode="aspectFit" />
					<text v-else class="card-icon-fallback">{{ card.icon }}</text>
				</view>
				<view class="quick-content">
					<view class="quick-title">{{ card.title }}</view>
					<view class="quick-sub">{{ card.desc }}</view>
				</view>
				<view class="card-arrow">
					<uni-icons type="arrow-right" size="16" color="rgba(255,255,255,0.8)"></uni-icons>
				</view>
			</view>
		</view>

		<view class="panel glass-card">
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
						<image v-if="alert.iconSrc" class="alert-icon-img" :src="alert.iconSrc" mode="aspectFit" />
						<uni-icons v-else :type="alert.icon" size="20" :color="alert.color"></uni-icons>
					</view>
					<view class="alert-content">
						<view class="alert-title">{{ alert.title }}</view>
						<view class="alert-time">{{ alert.time }}</view>
					</view>
					<view class="alert-dot" :style="{background: alert.color}"></view>
				</view>
			</view>
		</view>

		<view class="panel glass-card">
			<view class="panel-title">
				<uni-icons type="settings" size="20" color="#2f64f5"></uni-icons>
				快速设置
			</view>
			<view class="setting-list">
				<view class="setting-item" @click="openSetting('notification')">
					<view class="setting-left">
						<view class="setting-icon">
						<uni-icons type="notification" size="20" color="#2f64f5"></uni-icons>
					</view>
						<view class="setting-text">
							<view class="setting-name">推送通知</view>
							<view class="setting-desc">实时接收安全预警</view>
						</view>
					</view>
					<view class="setting-switch">
						<uni-icons type="checkmarkempty" size="20" color="#22C55E"></uni-icons>
					</view>
				</view>
				<view class="setting-item" @click="openSetting('family')">
					<view class="setting-left">
						<view class="setting-icon">
						<uni-icons type="person" size="20" color="#2f64f5"></uni-icons>
					</view>
						<view class="setting-text">
							<view class="setting-name">家庭守护</view>
							<view class="setting-desc">已绑定3位家人</view>
						</view>
					</view>
					<uni-icons type="right" size="16" color="#AAB3C7"></uni-icons>
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
				quickCards: [{
						title: '安全中心',
						desc: '安全报告与列表同步（与网页一致）',
						theme: 'tool-blue',
						iconSrc: '/static/安全中心 .png',
						url: '/pages/report/index'
					},
					{
						title: '预警中心',
						desc: '查看最新安全预警',
						theme: 'tool-amber',
						iconSrc: '/static/预警中心 .png',
						url: '/pages/alerts/index'
					},
					{
						title: '监护人管理',
						desc: '管理被监护人安全守护',
						theme: 'tool-teal',
						iconSrc: '/static/监护人管理.png',
						url: '/pages/guardian/index'
					},
					{
						title: '反诈检测',
						desc: '文字图片语音检测',
						theme: 'tool-violet',
						iconSrc: '/static/反诈检测.png',
						url: '/pages/detect/index'
					}
				],
				recentAlerts: []
			}
		},
		onShow() {
			this.fetchRecentAlerts()
		},
		methods: {
			getCurrentEmail() {
				const accounts = uni.getStorageSync('user_accounts') || []
				const idx = Number(uni.getStorageSync('active_user_account_index') || 0)
				return String(accounts[idx]?.email || '').trim()
			},
			formatTime(time) {
				const t = new Date(time || Date.now()).getTime()
				const diff = Date.now() - t
				const minute = 60 * 1000
				const hour = 60 * minute
				if (diff < hour) return `${Math.max(1, Math.floor(diff / minute))}分钟前`
				if (diff < 24 * hour) return `${Math.floor(diff / hour)}小时前`
				return `${Math.floor(diff / (24 * hour))}天前`
			},
			mapLevel(text) {
				const raw = String(text || '').toLowerCase()
				if (raw.includes('high') || raw.includes('高')) return 'high'
				if (raw.includes('medium') || raw.includes('中')) return 'medium'
				return 'low'
			},
			async fetchRecentAlerts() {
				const email = this.getCurrentEmail()
				if (!email) {
					this.recentAlerts = []
					return
				}
				let res
				try {
					res = await uni.request({
						url: `${getApiBaseUrl()}/api/notifications`,
						method: 'GET',
						data: { email }
					})
				} catch (e) {
					this.recentAlerts = []
					return
				}
				if (res.statusCode !== 200 || !res.data?.success || !Array.isArray(res.data.items)) {
					this.recentAlerts = []
					return
				}
				this.recentAlerts = res.data.items.slice(0, 3).map((item) => {
					const level = this.mapLevel([item.level, item.riskLevel, item.title, item.message, item.content].filter(Boolean).join(' '))
					return {
						title: item.title || '安全预警',
						time: this.formatTime(item.createdAt),
						icon: 'info-filled',
						color: level === 'high' ? '#EF4444' : level === 'medium' ? '#F59E0B' : '#22C55E',
						iconSrc: ''
					}
				})
			},
			tapAction(card) {
				if (card.url) {
					uni.navigateTo({
						url: card.url
					})
				} else {
					uni.showToast({
						title: `${card.title} 开发中`,
						icon: 'none'
					})
				}
			},
			viewAllAlerts() {
				uni.navigateTo({
					url: '/pages/alerts/index'
				})
			},
			openSetting(type) {
				uni.showToast({
					title: `打开${type}设置`,
					icon: 'none'
				})
			}
		}
	}
</script>

<style lang="scss">
	.page {
		min-height: 100vh;
		background: linear-gradient(180deg, #f3f6fc 0%, #eef2f9 100%);
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

	.logo-dot {
		width: 68rpx;
		height: 68rpx;
		border-radius: 22rpx;
		background: linear-gradient(135deg, #4f94ff, #2f64f5);
		box-shadow: 0 10rpx 24rpx rgba(47, 100, 245, 0.28);
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.logo-dot-img {
		width: 44rpx;
		height: 44rpx;
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

	.quick-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 24rpx;
		margin-top: 28rpx;
	}

	.quick-card {
		border-radius: 32rpx;
		padding: 36rpx 32rpx;
		color: #fff;
		box-shadow: 0 12rpx 32rpx rgba(31, 42, 68, 0.12);
		position: relative;
		overflow: hidden;
		display: flex;
		flex-direction: column;
		gap: 16rpx;
		min-height: 200rpx;
	}

	.card-icon {
		width: 72rpx;
		height: 72rpx;
		margin-bottom: 8rpx;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.card-icon-img {
		width: 64rpx;
		height: 64rpx;
	}

	.card-icon-fallback {
		font-size: 52rpx;
		line-height: 1;
	}

	.quick-content {
		flex: 1;
	}

	.card-arrow {
		align-self: flex-end;
		margin-top: auto;
	}

	.quick-card-hover {
		opacity: 0.96;
	}

	/* 四宫格工具卡：与下方统计区蓝/黄/绿呼应，每张区分色 */
	.quick-card.tool-blue {
		background: linear-gradient(145deg, #5b8def 0%, #3d6fd8 45%, #2f5fc9 100%);
		box-shadow: 0 12rpx 32rpx rgba(47, 111, 216, 0.28);
	}

	.quick-card.tool-amber {
		background: linear-gradient(145deg, #f0a84a 0%, #e8942e 45%, #d67d16 100%);
		box-shadow: 0 12rpx 32rpx rgba(214, 125, 22, 0.25);
	}

	.quick-card.tool-teal {
		background: linear-gradient(145deg, #3db8a8 0%, #2a9d8f 50%, #1f7f73 100%);
		box-shadow: 0 12rpx 32rpx rgba(31, 127, 115, 0.26);
	}

	.quick-card.tool-violet {
		background: linear-gradient(145deg, #8b76e8 0%, #6b5ad4 48%, #5548b8 100%);
		box-shadow: 0 12rpx 32rpx rgba(85, 72, 184, 0.26);
	}

	.quick-title {
		font-size: 34rpx;
		font-weight: 700;
	}

	.quick-sub {
		font-size: 25rpx;
		margin-top: 8rpx;
		opacity: 0.9;
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

	.alert-icon-img {
		width: 36rpx;
		height: 36rpx;
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
		margin-top: 16rpx;
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

</style>

<template>
	<view class="page" :class="{ 'theme-guardian': isGuardianTheme }">
		<view class="bg-glow"></view>
		<view class="status-holder"></view>
		<view class="top-brand fade-up">
			<view class="brand-left">
				<view class="back-btn" @click="goBack">
					<uni-icons type="back" size="24" color="#1f2a44"></uni-icons>
				</view>
				<view class="logo-dot">
					<image class="logo-dot-img" src="/static/预警中心 .png" mode="aspectFit" />
				</view>
				<view>
					<view class="brand-title">预警中心</view>
					<view class="brand-sub">实时安全预警信息</view>
				</view>
			</view>
			<view class="brand-right">
				<view class="notification-badge" @click="markAllRead">
					<uni-icons type="checkmark" size="20" color="#617191"></uni-icons>
				</view>
			</view>
		</view>

		<view class="safety-score fade-up">
			<view class="score-circle">
				<view class="score-value">{{ unreadCount }}</view>
				<view class="score-label">未读预警</view>
			</view>
			<view class="score-desc">您有 {{ unreadCount }} 条未读预警信息</view>
		</view>

		<view class="alert-stats fade-up">
			<view class="stat-card danger">
				<view class="stat-value">{{ totalCount }}</view>
				<view class="stat-label">待处理预警</view>
			</view>
			<view class="stat-card warning">
				<view class="stat-value">{{ highRiskCount }}</view>
				<view class="stat-label">高风险预警</view>
			</view>
			<view class="stat-card info">
				<view class="stat-value">{{ mediumRiskCount }}</view>
				<view class="stat-label">已处理预警</view>
			</view>
		</view>

		<view class="panel fade-up glass-card">
			<view class="panel-title panel-title-with-action">
				<view class="panel-title-main">
					<uni-icons type="time" size="20" color="#2f64f5"></uni-icons>
					<text>最新预警</text>
				</view>
				<text
					class="mark-all-read-btn"
					:class="{ disabled: unreadCount === 0 }"
					@click.stop="markAllRead"
				>一键已读</text>
			</view>
			<view class="alert-list">
				<view
					class="alert-item"
					v-for="(alert, index) in filteredAlerts"
					:key="alert.id"
					:class="{ unread: alertRowUnread(alert), acknowledged: alert.acknowledged }"
					@click="markAsRead(alert)"
				>
					<view class="alert-icon" :class="alert.level">
						<uni-icons type="info-filled" size="20" :color="alert.iconColor"></uni-icons>
					</view>
					<view class="alert-content">
						<view class="alert-title-row">
							<view class="alert-title">{{ alert.title }}</view>
							<text v-if="alert.acknowledged" class="ack-tag">已知晓</text>
						</view>
						<view class="alert-desc">{{ alert.description }}</view>
						<view class="alert-meta">
							<text class="alert-time">{{ alert.time }}</text>
							<text class="alert-level" :class="alert.level">{{ alert.levelText }}</text>
						</view>
						<view v-if="alert.level === 'high' && !alert.acknowledged" class="alert-actions" @click.stop>
							<button class="ack-btn" size="mini" @click="acknowledgeAlert(alert)">已知晓</button>
							<text class="ack-hint">知晓后不再弹窗提醒该条</text>
						</view>
					</view>
					<view v-if="alertRowUnread(alert)" class="status-dot online"></view>
				</view>
			</view>
		</view>

		<view class="panel fade-up glass-card">
			<view class="panel-title">
				<uni-icons type="shield" size="20" color="#2f64f5"></uni-icons>
				预警分类
			</view>
			<view class="category-list">
				<view class="category-item" v-for="(category, index) in categories" :key="index" @click="filterByCategory(category.name)">
					<view class="category-icon" :class="category.theme">
						<uni-icons :type="category.icon" size="20" color="#fff"></uni-icons>
					</view>
					<view class="category-content">
						<view class="category-name">{{ category.name }}</view>
						<view class="category-count">{{ category.count }}条</view>
					</view>
				</view>
			</view>
		</view>

		<view class="panel fade-up glass-card">
			<view class="panel-title">
				<uni-icons type="settings" size="20" color="#2f64f5"></uni-icons>
				预警设置
			</view>
			<view class="setting-list">
				<view class="setting-item" @click="toggleSetting('highRisk')">
					<view class="setting-left">
						<view class="setting-icon">
							<uni-icons type="alert" size="20" color="#EF4444"></uni-icons>
						</view>
						<view class="setting-text">
							<view class="setting-name">高风险预警</view>
							<view class="setting-desc">实时推送高风险预警</view>
						</view>
					</view>
					<view class="setting-switch">
						<uni-icons :type="settings.highRisk ? 'checkmarkempty' : 'closeempty'" size="20" :color="settings.highRisk ? '#22C55E' : '#9CA3AF'"></uni-icons>
					</view>
				</view>
				<view class="setting-item" @click="toggleSetting('mediumRisk')">
					<view class="setting-left">
						<view class="setting-icon">
							<uni-icons type="alert" size="20" color="#F59E0B"></uni-icons>
						</view>
						<view class="setting-text">
							<view class="setting-name">中风险预警</view>
							<view class="setting-desc">推送中风险预警</view>
						</view>
					</view>
					<view class="setting-switch">
						<uni-icons :type="settings.mediumRisk ? 'checkmarkempty' : 'closeempty'" size="20" :color="settings.mediumRisk ? '#22C55E' : '#9CA3AF'"></uni-icons>
					</view>
				</view>
				<view class="setting-item" @click="toggleSetting('lowRisk')">
					<view class="setting-left">
						<view class="setting-icon">
							<uni-icons type="alert" size="20" color="#22C55E"></uni-icons>
						</view>
						<view class="setting-text">
							<view class="setting-name">低风险预警</view>
							<view class="setting-desc">推送低风险预警</view>
						</view>
					</view>
					<view class="setting-switch">
						<uni-icons :type="settings.lowRisk ? 'checkmarkempty' : 'closeempty'" size="20" :color="settings.lowRisk ? '#22C55E' : '#9CA3AF'"></uni-icons>
					</view>
				</view>
				<view class="setting-item" @click="toggleSetting('sound')">
					<view class="setting-left">
						<view class="setting-icon">
							<uni-icons type="volume-medium" size="20" color="#2f64f5"></uni-icons>
						</view>
						<view class="setting-text">
							<view class="setting-name">预警声音</view>
							<view class="setting-desc">收到预警时播放声音</view>
						</view>
					</view>
					<view class="setting-switch">
						<uni-icons :type="settings.sound ? 'checkmarkempty' : 'closeempty'" size="20" :color="settings.sound ? '#22C55E' : '#9CA3AF'"></uni-icons>
					</view>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
import { getApiBaseUrl } from '@/utils/apiBase.js'
import { acknowledgeRiskNotifyId, isRiskNotifyAcknowledged } from '@/utils/riskAcknowledge.js'

const ALERT_READ_KEY = 'alert_read_ids'

export default {
	data() {
		return {
			settings: {
				highRisk: true,
				mediumRisk: true,
				lowRisk: false,
				sound: true
			},
			alerts: [],
			categories: [],
			activeCategory: '',
			loaded: false
		}
	},
	computed: {
		unreadCount() {
			return this.alerts.filter((a) => this.alertRowUnread(a)).length
		},
		totalCount() {
			return this.filteredAlerts.filter((a) => this.alertRowUnread(a)).length
		},
		highRiskCount() {
			return this.filteredAlerts.filter((a) => a.level === 'high' && !a.acknowledged).length
		},
		mediumRiskCount() {
			return this.filteredAlerts.filter((a) => a.read || a.acknowledged).length
		},
		filteredAlerts() {
			if (!this.activeCategory) return this.alerts
			return this.alerts.filter((item) => item.category === this.activeCategory)
		}
	},
	onShow() {
		this.fetchNotifications()
	},
	methods: {
		/** 高风险：未「已知晓」即视为待处理；中/低风险：点过即已读即可 */
		alertRowUnread(alert) {
			if (alert.level === 'high') return !alert.acknowledged
			return !alert.read
		},
		goBack() {
			uni.navigateBack()
		},
		getCurrentEmail() {
			const accounts = uni.getStorageSync('user_accounts') || []
			const idx = Number(uni.getStorageSync('active_user_account_index') || 0)
			return accounts[idx]?.email || ''
		},
		getReadSet() {
			const ids = uni.getStorageSync(ALERT_READ_KEY) || []
			return new Set(Array.isArray(ids) ? ids : [])
		},
		saveReadSet(setObj) {
			uni.setStorageSync(ALERT_READ_KEY, Array.from(setObj))
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
		buildCategories(list) {
			const bucket = {
				诈骗电话: 0,
				异常交易: 0,
				系统通知: 0,
				家人安全: 0
			}
			list.forEach((item) => {
				if (item.category && bucket[item.category] !== undefined) bucket[item.category] += 1
			})
			this.categories = [
				{ name: '诈骗电话', count: bucket['诈骗电话'], icon: 'phone', theme: 'danger' },
				{ name: '异常交易', count: bucket['异常交易'], icon: 'cash', theme: 'warning' },
				{ name: '系统通知', count: bucket['系统通知'], icon: 'info', theme: 'info' },
				{ name: '家人安全', count: bucket['家人安全'], icon: 'person', theme: 'success' }
			]
		},
		async fetchNotifications() {
			const email = this.getCurrentEmail()
			if (!email) return
			let reqRes
			try {
				reqRes = await uni.request({
					url: `${getApiBaseUrl()}/api/notifications`,
					method: 'GET',
					data: { email }
				})
			} catch (e) {
				uni.showToast({ title: '加载预警失败', icon: 'none' })
				return
			}
			if (reqRes.statusCode !== 200 || !reqRes.data?.success) {
				uni.showToast({ title: '加载预警失败', icon: 'none' })
				return
			}
			const readSet = this.getReadSet()
			const mapped = (reqRes.data.items || []).map((item) => {
				const levelSource = [item.level, item.riskLevel, item.title, item.message, item.content]
					.filter(Boolean)
					.join(' ')
				const level = this.mapLevel(levelSource)
				const id =
					item.id != null && item.id !== ''
						? String(item.id)
						: `${String(item.to || '')}-${item.createdAt || ''}`
				const isGuardian = String(item.type || '').includes('guardian')
				const acknowledged = level === 'high' && isRiskNotifyAcknowledged(id)
				return {
					id,
					title: item.title || (isGuardian ? '监护通知' : '安全预警'),
					description: item.message || item.content || '收到一条新的风险提醒',
					time: this.formatTime(item.createdAt),
					level,
					levelText: level === 'high' ? '高风险' : level === 'medium' ? '中风险' : '低风险',
					icon: 'info-filled',
					iconColor: level === 'high' ? '#EF4444' : level === 'medium' ? '#F59E0B' : '#22C55E',
					category: isGuardian ? '家人安全' : level === 'high' ? '诈骗电话' : level === 'medium' ? '异常交易' : '系统通知',
					read: readSet.has(id) || acknowledged,
					acknowledged
				}
			})
			this.alerts = mapped
			this.buildCategories(mapped)
			this.loaded = true
		},
		markAllRead() {
			if (this.unreadCount === 0) {
				uni.showToast({ title: '暂无未读预警', icon: 'none' })
				return
			}
			const readSet = this.getReadSet()
			this.alerts.forEach((alert) => {
				readSet.add(alert.id)
				if (alert.level === 'high' && !alert.acknowledged) {
					acknowledgeRiskNotifyId(alert.id)
				}
			})
			this.saveReadSet(readSet)
			this.alerts = this.alerts.map((a) => ({
				...a,
				read: true,
				acknowledged: a.level === 'high' ? true : a.acknowledged
			}))
			uni.showToast({ title: '已全部标为已读', icon: 'success' })
		},
		acknowledgeAlert(alert) {
			if (alert.level !== 'high' || alert.acknowledged) return
			acknowledgeRiskNotifyId(alert.id)
			const readSet = this.getReadSet()
			readSet.add(alert.id)
			this.saveReadSet(readSet)
			alert.read = true
			alert.acknowledged = true
			uni.showToast({ title: '已知晓，不再提醒该条', icon: 'success' })
		},
		markAsRead(alert) {
			if (alert.read) return
			const readSet = this.getReadSet()
			readSet.add(alert.id)
			this.saveReadSet(readSet)
			alert.read = true
		},
		filterByCategory(category) {
			this.activeCategory = this.activeCategory === category ? '' : category
			uni.showToast({ title: this.activeCategory ? `已筛选${category}` : '已取消筛选', icon: 'none' })
		},
		toggleSetting(key) {
			this.settings[key] = !this.settings[key]
			uni.showToast({ title: this.settings[key] ? '已开启' : '已关闭', icon: 'none' })
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

	.logo-dot-img {
		width: 44rpx;
		height: 44rpx;
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

	.score-label {
		font-size: 24rpx;
		opacity: 0.9;
		margin-top: 8rpx;
	}

	.score-desc {
		font-size: 26rpx;
		color: #5f6880;
	}

	.alert-stats {
		margin-top: 28rpx;
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 16rpx;
	}

	.stat-card {
		padding: 24rpx;
		border-radius: 24rpx;
		text-align: center;
		box-shadow: 0 8rpx 20rpx rgba(0, 0, 0, 0.1);
	}

	.stat-card.danger {
		background: linear-gradient(135deg, #fee2e2, #fecaca);
	}

	.stat-card.warning {
		background: linear-gradient(135deg, #fef3c7, #fde68a);
	}

	.stat-card.info {
		background: linear-gradient(135deg, #dbeafe, #bfdbfe);
	}

	.stat-value {
		font-size: 40rpx;
		font-weight: 700;
		color: #1f2a44;
	}

	.stat-label {
		font-size: 22rpx;
		color: #5f6880;
		margin-top: 8rpx;
	}

	.panel {
		margin-top: 28rpx;
		border-radius: 32rpx;
		padding: 36rpx;
	}

	.panel-title {
		font-size: 32rpx;
		font-weight: 700;
		color: #1f2a44;
		display: flex;
		align-items: center;
		gap: 10rpx;
	}

	.panel-title-with-action {
		justify-content: space-between;
		gap: 16rpx;
	}

	.panel-title-main {
		display: flex;
		align-items: center;
		gap: 10rpx;
		flex: 1;
		min-width: 0;
	}

	.mark-all-read-btn {
		font-size: 26rpx;
		font-weight: 600;
		color: #2877ff;
		padding: 8rpx 16rpx;
		border-radius: 999rpx;
		background: rgba(47, 128, 255, 0.1);
		flex-shrink: 0;
	}

	.mark-all-read-btn.disabled {
		color: #b0b6c7;
		background: #f3f4f6;
	}

	.alert-list {
		margin-top: 20rpx;
	}

	.alert-item {
		display: flex;
		align-items: flex-start;
		padding: 24rpx 0;
		border-bottom: 1px solid #f0f2f7;
		position: relative;
	}

	.alert-item.unread {
		background: rgba(243, 244, 246, 0.3);
		border-radius: 16rpx;
		margin: 8rpx 0;
		padding: 24rpx 16rpx;
	}

	.alert-item.acknowledged {
		opacity: 0.88;
	}

	.alert-item:last-child {
		border-bottom: 0;
	}

	.alert-icon {
		width: 52rpx;
		height: 52rpx;
		border-radius: 14rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-right: 16rpx;
		flex-shrink: 0;
	}

	.alert-icon.high {
		background: #fee2e2;
	}

	.alert-icon.medium {
		background: #fef3c7;
	}

	.alert-icon.low {
		background: #dcfce7;
	}

	.alert-content {
		flex: 1;
	}

	.alert-title-row {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 12rpx;
	}

	.alert-title {
		font-size: 28rpx;
		font-weight: 600;
		color: #1f2a44;
		flex: 1;
	}

	.ack-tag {
		font-size: 20rpx;
		color: #15803d;
		background: #dcfce7;
		padding: 4rpx 12rpx;
		border-radius: 8rpx;
		flex-shrink: 0;
	}

	.alert-actions {
		margin-top: 14rpx;
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 12rpx;
	}

	.ack-btn {
		margin: 0;
		padding: 0 22rpx;
		height: 52rpx;
		line-height: 52rpx;
		font-size: 24rpx;
		background: linear-gradient(135deg, #3f8cff, #2877ff);
		color: #fff;
		border-radius: 999rpx;
		border: none;
	}

	.ack-hint {
		font-size: 20rpx;
		color: #9ca3af;
		flex: 1;
		min-width: 200rpx;
	}

	.alert-desc {
		font-size: 24rpx;
		color: #5f6880;
		margin-top: 8rpx;
		line-height: 1.5;
	}

	.alert-meta {
		margin-top: 12rpx;
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.alert-time {
		font-size: 22rpx;
		color: #8f96a8;
	}

	.alert-level {
		padding: 4rpx 12rpx;
		border-radius: 999rpx;
		font-size: 20rpx;
		font-weight: 500;
	}

	.alert-level.high {
		background: #fee2e2;
		color: #dc2626;
	}

	.alert-level.medium {
		background: #fef3c7;
		color: #d97706;
	}

	.alert-level.low {
		background: #dcfce7;
		color: #15803d;
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

	.category-list {
		margin-top: 20rpx;
	}

	.category-item {
		display: flex;
		align-items: center;
		padding: 20rpx 0;
		border-bottom: 1px solid #f0f2f7;
	}

	.category-item:last-child {
		border-bottom: 0;
	}

	.category-icon {
		width: 52rpx;
		height: 52rpx;
		border-radius: 14rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-right: 16rpx;
		flex-shrink: 0;
	}

	.category-icon.danger {
		background: linear-gradient(135deg, #ef4444, #dc2626);
	}

	.category-icon.warning {
		background: linear-gradient(135deg, #f59e0b, #d97706);
	}

	.category-icon.info {
		background: linear-gradient(135deg, #4facfe, #00f2fe);
	}

	.category-icon.success {
		background: linear-gradient(135deg, #10b981, #059669);
	}

	.category-content {
		flex: 1;
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.category-name {
		font-size: 28rpx;
		font-weight: 500;
		color: #1f2a44;
	}

	.category-count {
		font-size: 22rpx;
		color: #8f96a8;
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

	.theme-guardian .ack-btn {
		background: linear-gradient(135deg, #ef5350, #c62828) !important;
	}

	.theme-guardian .mark-all-read-btn {
		color: #c62828;
		background: rgba(198, 40, 40, 0.1);
	}

	.theme-guardian .mark-all-read-btn.disabled {
		color: #b0b6c7;
		background: #f3f4f6;
	}
</style>
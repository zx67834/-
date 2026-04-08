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
					<view class="logo-icon">👨‍👩‍👧</view>
				</view>
				<view>
					<view class="brand-title">监护人管理</view>
					<view class="brand-sub">守护家人安全</view>
				</view>
			</view>
			<view class="brand-right">
				<view class="add-btn" @click="addFamilyMember">
				<uni-icons type="plus" size="20" color="#2f64f5"></uni-icons>
			</view>
			</view>
		</view>

		<view class="family-stats fade-up">
			<view class="stat-card">
				<view class="stat-value">{{ familyMembers.length }}</view>
				<view class="stat-label">已绑定成员</view>
			</view>
			<view class="stat-card">
				<view class="stat-value">{{ safeCount }}</view>
				<view class="stat-label">安全状态</view>
			</view>
			<view class="stat-card">
				<view class="stat-value">{{ alertCount }}</view>
				<view class="stat-label">今日预警</view>
			</view>
		</view>

		<view class="panel fade-up glass-card">
			<view class="panel-title">
				<uni-icons type="person" size="20" color="#2f64f5"></uni-icons>
				家庭成员
			</view>
			<view class="family-list">
				<view class="family-item" v-for="(member, index) in familyMembers" :key="index" @click="viewMemberDetail(member)">
					<view class="family-avatar" :class="member.theme">
						{{ member.avatar }}
					</view>
					<view class="family-content">
						<view class="family-name">{{ member.name }}</view>
						<view class="family-relation">{{ member.relation }}</view>
						<view class="family-status" :class="member.status">
							<uni-icons :type="member.statusIcon" size="16" :color="member.statusColor"></uni-icons>
							{{ member.statusText }}
						</view>
					</view>
					<view class="family-actions">
						<view class="action-btn" @click.stop="editMember(member)">
					<uni-icons type="compose" size="18" color="#2f64f5"></uni-icons>
				</view>
						<view class="action-btn" @click.stop="removeMember(index)">
							<uni-icons type="trash" size="18" color="#EF4444"></uni-icons>
						</view>
					</view>
				</view>
			</view>
		</view>

		<view class="panel fade-up glass-card">
			<view class="panel-title">
				<uni-icons type="time" size="20" color="#2f64f5"></uni-icons>
				近期活动
			</view>
			<view class="activity-list">
				<view class="activity-item" v-for="(activity, index) in recentActivities" :key="index">
					<view class="activity-icon" :class="activity.type">
						<uni-icons :type="activity.icon" size="20" :color="activity.color"></uni-icons>
					</view>
					<view class="activity-content">
						<view class="activity-text">{{ activity.text }}</view>
						<view class="activity-time">{{ activity.time }}</view>
					</view>
				</view>
			</view>
		</view>

		<view class="panel fade-up glass-card">
			<view class="panel-title">
				<uni-icons type="settings" size="20" color="#2f64f5"></uni-icons>
				守护设置
			</view>
			<view class="setting-list">
				<view class="setting-item" @click="toggleSetting('autoMonitor')">
					<view class="setting-left">
						<view class="setting-icon">
						<uni-icons type="eye" size="20" color="#2f64f5"></uni-icons>
					</view>
						<view class="setting-text">
							<view class="setting-name">自动监控</view>
							<view class="setting-desc">自动监控家人安全状态</view>
						</view>
					</view>
					<view class="setting-switch">
						<uni-icons :type="settings.autoMonitor ? 'checkmarkempty' : 'closeempty'" size="20" :color="settings.autoMonitor ? '#22C55E' : '#9CA3AF'"></uni-icons>
					</view>
				</view>
				<view class="setting-item" @click="toggleSetting('alertShare')">
					<view class="setting-left">
						<view class="setting-icon">
						<uni-icons type="share" size="20" color="#2f64f5"></uni-icons>
					</view>
						<view class="setting-text">
							<view class="setting-name">预警共享</view>
							<view class="setting-desc">与家人共享安全预警</view>
						</view>
					</view>
					<view class="setting-switch">
						<uni-icons :type="settings.alertShare ? 'checkmarkempty' : 'closeempty'" size="20" :color="settings.alertShare ? '#22C55E' : '#9CA3AF'"></uni-icons>
					</view>
				</view>
				<view class="setting-item" @click="toggleSetting('emergencyCall')">
					<view class="setting-left">
						<view class="setting-icon">
						<uni-icons type="phone" size="20" color="#2f64f5"></uni-icons>
					</view>
						<view class="setting-text">
							<view class="setting-name">紧急呼叫</view>
							<view class="setting-desc">一键呼叫家人</view>
						</view>
					</view>
					<view class="setting-switch">
						<uni-icons :type="settings.emergencyCall ? 'checkmarkempty' : 'closeempty'" size="20" :color="settings.emergencyCall ? '#22C55E' : '#9CA3AF'"></uni-icons>
					</view>
				</view>
			</view>
		</view>

		<!-- 添加成员弹窗 -->
		<uni-popup :visible="showAddDialog" @change="showAddDialog = $event" type="center" :mask-click="false">
			<view class="dialog-content">
				<view class="dialog-header">
					<view class="dialog-title">添加家庭成员</view>
					<view class="dialog-close" @click="closeAddDialog">
						<uni-icons type="close" size="24" color="#999"></uni-icons>
					</view>
				</view>
				<view class="dialog-body">
					<view class="form-item">
						<view class="form-label">姓名</view>
						<input v-model="newMember.name" class="form-input" placeholder="请输入姓名" />
					</view>
					<view class="form-item">
						<view class="form-label">关系</view>
						<picker mode="selector" :range="relationOptions" @change="e => newMember.relation = relationOptions[e.detail.value]">
							<view class="form-picker">{{ newMember.relation || '请选择关系' }}</view>
						</picker>
					</view>
					<view class="form-item">
						<view class="form-label">手机号</view>
						<input v-model="newMember.phone" class="form-input" placeholder="请输入手机号" />
					</view>
				</view>
				<view class="dialog-footer">
					<button class="dialog-btn cancel" @click="closeAddDialog">取消</button>
					<button class="dialog-btn submit" @click="confirmAddMember">添加</button>
				</view>
			</view>
		</uni-popup>
	</view>
</template>

<script>
	export default {
		data() {
			return {
				showAddDialog: false,
				settings: {
					autoMonitor: true,
					alertShare: true,
					emergencyCall: true
				},
				newMember: {
					name: '',
					relation: '',
					phone: ''
				},
				relationOptions: ['父母', '配偶', '子女', '其他'],
				familyMembers: [
					{
						id: 1,
						name: '张三',
						relation: '父亲',
						avatar: '👨',
						theme: 'blue',
						status: 'safe',
						statusText: '安全',
						statusIcon: 'checkmark',
						statusColor: '#22C55E'
					},
					{
						id: 2,
						name: '李四',
						relation: '母亲',
						avatar: '👩',
						theme: 'pink',
						status: 'safe',
						statusText: '安全',
						statusIcon: 'checkmark',
						statusColor: '#22C55E'
					},
					{
						id: 3,
						name: '王五',
						relation: '儿子',
						avatar: '🧒',
						theme: 'green',
						status: 'warning',
						statusText: '需关注',
						statusIcon: 'alert',
						statusColor: '#F59E0B'
					}
				],
				recentActivities: [
					{
						text: '张三完成了安全验证',
						time: '10分钟前',
						type: 'success',
						icon: 'checkmark',
						color: '#22C55E'
					},
					{
						text: '王五收到了安全预警',
						time: '1小时前',
						type: 'warning',
						icon: 'alert',
						color: '#F59E0B'
					},
					{
						text: '李四更新了安全设置',
						time: '2小时前',
						type: 'info',
					icon: 'info',
					color: '#2f64f5'
					}
				]
			}
		},
		computed: {
			safeCount() {
				return this.familyMembers.filter(member => member.status === 'safe').length
			},
			alertCount() {
				return this.familyMembers.filter(member => member.status === 'warning' || member.status === 'danger').length
			}
		},
		methods: {
			goBack() {
				uni.navigateBack()
			},
			addFamilyMember() {
				this.newMember = {
					name: '',
					relation: '',
					phone: ''
				}
				this.showAddDialog = true
			},
			closeAddDialog() {
				this.showAddDialog = false
			},
			confirmAddMember() {
				if (!this.newMember.name || !this.newMember.relation) {
					uni.showToast({
						title: '请填写完整信息',
						icon: 'none'
					})
					return
				}
				
				const themes = ['blue', 'pink', 'green', 'purple']
				const newMember = {
					id: Date.now(),
					...this.newMember,
					avatar: '👤',
					theme: themes[this.familyMembers.length % themes.length],
					status: 'safe',
					statusText: '安全',
					statusIcon: 'checkmark',
					statusColor: '#22C55E'
				}
				
				this.familyMembers.push(newMember)
				this.showAddDialog = false
				uni.showToast({
					title: '添加成功',
					icon: 'success'
				})
			},
			viewMemberDetail(member) {
				uni.showToast({
					title: `查看${member.name}详情`,
					icon: 'none'
				})
			},
			editMember(member) {
				uni.showToast({
					title: `编辑${member.name}信息`,
					icon: 'none'
				})
			},
			removeMember(index) {
				uni.showModal({
					title: '确认删除',
					content: '确定要删除这个家庭成员吗？',
					confirmText: '删除',
					cancelText: '取消',
					success: (res) => {
						if (res.confirm) {
							this.familyMembers.splice(index, 1)
							uni.showToast({
								title: '删除成功',
								icon: 'success'
							})
						}
					}
				})
			},
			toggleSetting(key) {
				this.settings[key] = !this.settings[key]
				uni.showToast({
					title: this.settings[key] ? '已开启' : '已关闭',
					icon: 'none'
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

	.add-btn {
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

	.family-stats {
		margin-top: 28rpx;
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 16rpx;
	}

	.stat-card {
		padding: 24rpx;
		border-radius: 24rpx;
		text-align: center;
		background: linear-gradient(135deg, #e8f0ff, #dbe8ff);
		box-shadow: 0 8rpx 20rpx rgba(0, 0, 0, 0.1);
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

	.family-list {
		margin-top: 20rpx;
	}

	.family-item {
		display: flex;
		align-items: center;
		padding: 24rpx 0;
		border-bottom: 1px solid #f0f2f7;
	}

	.family-item:last-child {
		border-bottom: 0;
	}

	.family-avatar {
		width: 72rpx;
		height: 72rpx;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-right: 20rpx;
		font-size: 36rpx;
		flex-shrink: 0;
	}

	.family-avatar.blue {
		background: linear-gradient(135deg, #4f94ff, #2f6fff);
		color: #fff;
	}

	.family-avatar.pink {
		background: linear-gradient(135deg, #ff6c99, #e44986);
		color: #fff;
	}

	.family-avatar.green {
		background: linear-gradient(135deg, #10b981, #059669);
		color: #fff;
	}

	.family-avatar.purple {
		background: linear-gradient(135deg, #a855f7, #9333ea);
		color: #fff;
	}

	.family-content {
		flex: 1;
	}

	.family-name {
		font-size: 30rpx;
		font-weight: 600;
		color: #1f2a44;
	}

	.family-relation {
		font-size: 24rpx;
		color: #5f6880;
		margin-top: 4rpx;
	}

	.family-status {
		margin-top: 8rpx;
		display: flex;
		align-items: center;
		gap: 6rpx;
		font-size: 22rpx;
	}

	.family-status.safe {
		color: #22C55E;
	}

	.family-status.warning {
		color: #F59E0B;
	}

	.family-status.danger {
		color: #EF4444;
	}

	.family-actions {
		display: flex;
		gap: 16rpx;
	}

	.action-btn {
		width: 48rpx;
		height: 48rpx;
		border-radius: 12rpx;
		background: #f5f7fb;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.activity-list {
		margin-top: 20rpx;
	}

	.activity-item {
		display: flex;
		align-items: flex-start;
		padding: 20rpx 0;
		border-bottom: 1px solid #f0f2f7;
	}

	.activity-item:last-child {
		border-bottom: 0;
	}

	.activity-icon {
		width: 52rpx;
		height: 52rpx;
		border-radius: 14rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-right: 16rpx;
		flex-shrink: 0;
	}

	.activity-icon.success {
		background: #e6f9ee;
	}

	.activity-icon.warning {
		background: #fef3c7;
	}

	.activity-icon.info {
		background: #dbeafe;
	}

	.activity-content {
		flex: 1;
	}

	.activity-text {
		font-size: 26rpx;
		color: #1f2a44;
	}

	.activity-time {
		font-size: 22rpx;
		color: #8f96a8;
		margin-top: 4rpx;
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

	.dialog-content {
		width: 90%;
		max-width: 640rpx;
		background: #fff;
		border-radius: 32rpx;
		padding: 32rpx;
		box-shadow: 0 20rpx 60rpx rgba(0, 0, 0, 0.2);
	}

	.dialog-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 32rpx;
	}

	.dialog-title {
		font-size: 36rpx;
		font-weight: 700;
		color: #202a43;
	}

	.dialog-close {
		width: 72rpx;
		height: 72rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 50%;
		transition: background-color 0.2s;
	}

	.dialog-close:hover {
		background-color: #f0f0f0;
	}

	.dialog-body {
		margin-bottom: 32rpx;
	}

	.form-item {
		margin-bottom: 28rpx;
	}

	.form-label {
		font-size: 28rpx;
		font-weight: 600;
		color: #202a43;
		margin-bottom: 12rpx;
	}

	.form-input {
		width: 100%;
		height: 88rpx;
		border: 1px solid #e6ecf8;
		border-radius: 18rpx;
		padding: 0 20rpx;
		font-size: 28rpx;
		color: #333;
	}

	.form-picker {
		width: 100%;
		height: 88rpx;
		border: 1px solid #e6ecf8;
		border-radius: 18rpx;
		padding: 0 20rpx;
		font-size: 28rpx;
		color: #333;
		display: flex;
		align-items: center;
	}

	.dialog-footer {
		display: flex;
		gap: 20rpx;
	}

	.dialog-btn {
		flex: 1;
		height: 88rpx;
		border-radius: 18rpx;
		font-size: 28rpx;
		font-weight: 600;
	}

	.dialog-btn.cancel {
		background: #f0f2f7;
		color: #666;
	}

	.dialog-btn.submit {
		background: linear-gradient(135deg, #4facfe, #00f2fe);
		color: #fff;
		box-shadow: 0 8rpx 20rpx rgba(79, 172, 254, 0.3);
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
</style>

<template>
	<view class="page" :class="{ 'theme-guardian': isGuardianUser }">
		<view class="bg-glow"></view>
		<view class="status-holder"></view>
		<view class="top-brand fade-up">
			<view class="brand-left">
				<view class="back-btn" @click="goBack">
					<uni-icons type="back" size="24" color="#1f2a44"></uni-icons>
				</view>
				<view class="logo-dot">
					<image class="logo-dot-img" src="/static/监护人管理.png" mode="aspectFit" />
				</view>
				<view>
					<view class="brand-title">监护人管理</view>
					<view class="brand-sub">{{
						isGuardianUser
							? '守护被监护人安全 · 绑定数据与网页监护人端共用后端'
							: '查看与您绑定的监护人 · 与网页端同一套账号绑定'
					}}</view>
				</view>
			</view>
		</view>

		<view class="family-stats fade-up">
			<view class="stat-card">
				<view class="stat-value">{{ familyMembers.length }}</view>
				<view class="stat-label">{{ isGuardianUser ? '已绑定被监护人' : '已绑定监护人' }}</view>
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
			<view class="panel-head-row">
				<view class="panel-title">
					<uni-icons type="person" size="20" :color="accentColor"></uni-icons>
					{{ isGuardianUser ? '被监护人' : '我的监护人' }}
				</view>
				<view
					v-if="isGuardianUser"
					class="panel-add-btn"
					hover-class="panel-add-btn-hover"
					@tap.stop="addFamilyMember"
				>
					<uni-icons type="plus" size="22" :color="accentColor"></uni-icons>
				</view>
			</view>
			<view v-if="!familyMembers.length" class="empty-hint">
				{{
					isGuardianUser
						? '暂无被监护人，点击上方「+」添加绑定'
						: '暂无绑定的监护人，需由监护人在其账号中添加您为被监护人'
				}}
			</view>
			<view class="family-list">
				<view class="family-item" v-for="(member, index) in familyMembers" :key="member.id || index" @click="viewMemberDetail(member)">
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
					<view v-if="isGuardianUser" class="family-actions">
						<view class="action-btn" @click.stop="editMember(member)">
							<uni-icons type="compose" size="18" :color="accentColor"></uni-icons>
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
				<uni-icons type="time" size="20" :color="accentColor"></uni-icons>
				近期活动
			</view>
			<view class="activity-list">
				<view class="activity-item" v-for="(activity, index) in recentActivities" :key="index">
					<view class="activity-icon" :class="activity.type">
						<uni-icons type="info-filled" size="20" :color="activity.color"></uni-icons>
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
				<uni-icons type="settings" size="20" :color="accentColor"></uni-icons>
				守护设置
			</view>
			<view class="setting-list">
				<view class="setting-item" @click="toggleSetting('autoMonitor')">
					<view class="setting-left">
						<view class="setting-icon">
						<uni-icons type="eye" size="20" :color="accentColor"></uni-icons>
					</view>
						<view class="setting-text">
							<view class="setting-name">自动监控</view>
							<view class="setting-desc">{{ isGuardianUser ? '自动监控被监护人安全状态' : '关注与您相关的安全动态' }}</view>
						</view>
					</view>
					<view class="setting-switch">
						<uni-icons :type="settings.autoMonitor ? 'checkmarkempty' : 'closeempty'" size="20" :color="settings.autoMonitor ? '#22C55E' : '#9CA3AF'"></uni-icons>
					</view>
				</view>
				<view class="setting-item" @click="toggleSetting('alertShare')">
					<view class="setting-left">
						<view class="setting-icon">
						<uni-icons type="share" size="20" :color="accentColor"></uni-icons>
					</view>
						<view class="setting-text">
							<view class="setting-name">预警共享</view>
							<view class="setting-desc">{{ isGuardianUser ? '共享被监护人安全预警' : '向监护人同步重要预警' }}</view>
						</view>
					</view>
					<view class="setting-switch">
						<uni-icons :type="settings.alertShare ? 'checkmarkempty' : 'closeempty'" size="20" :color="settings.alertShare ? '#22C55E' : '#9CA3AF'"></uni-icons>
					</view>
				</view>
				<view class="setting-item" @click="toggleSetting('emergencyCall')">
					<view class="setting-left">
						<view class="setting-icon">
						<uni-icons type="phone" size="20" :color="accentColor"></uni-icons>
					</view>
						<view class="setting-text">
							<view class="setting-name">紧急呼叫</view>
							<view class="setting-desc">{{ isGuardianUser ? '一键联系被监护人' : '一键联系监护人' }}</view>
						</view>
					</view>
					<view class="setting-switch">
						<uni-icons :type="settings.emergencyCall ? 'checkmarkempty' : 'closeempty'" size="20" :color="settings.emergencyCall ? '#22C55E' : '#9CA3AF'"></uni-icons>
					</view>
				</view>
			</view>
		</view>

		<!-- 仅监护人可添加被监护人（uni-popup 须 ref.open/close） -->
		<uni-popup v-if="isGuardianUser" ref="addMemberPopup" type="center" :is-mask-click="false">
			<view class="dialog-content" @tap.stop>
				<view class="dialog-header">
					<view class="dialog-title">添加被监护人</view>
					<view class="dialog-close" @click="closeAddDialog">
						<uni-icons type="close" size="24" color="#999"></uni-icons>
					</view>
				</view>
				<view class="dialog-body">
					<view class="form-item">
						<view class="form-label">被监护人姓名</view>
						<input v-model="newMember.name" class="form-input" placeholder="请输入被监护人姓名" />
					</view>
					<view class="form-item">
						<view class="form-label">关系（您对 Ta）</view>
						<picker mode="selector" :range="relationOptions" @change="onRelationPick">
							<view class="form-picker">{{ newMember.relation || '请选择关系' }}</view>
						</picker>
					</view>
					<view class="form-item">
						<view class="form-label">被监护人手机号</view>
						<input v-model="newMember.phone" class="form-input" placeholder="选填" />
					</view>
					<view class="form-item">
						<view class="form-label">被监护人邮箱</view>
						<input v-model="newMember.account" class="form-input" placeholder="被监护人登录邮箱" />
					</view>
					<view class="form-item">
						<view class="form-label">被监护人密码</view>
						<view class="password-row">
							<input
								v-model="newMember.password"
								class="form-input password-input"
								:password="!newMemberPasswordVisible"
								placeholder="用于校验账号，不会上传明文存储"
							/>
							<text class="password-toggle" @click="newMemberPasswordVisible = !newMemberPasswordVisible">{{ newMemberPasswordVisible ? '隐藏' : '显示' }}</text>
						</view>
					</view>
				</view>
				<view class="dialog-footer">
					<button class="dialog-btn cancel" @click="closeAddDialog">取消</button>
					<button class="dialog-btn submit" @click="confirmAddMember">添加绑定</button>
				</view>
			</view>
		</uni-popup>
	</view>
</template>

<script>
import { getApiBaseUrl } from '@/utils/apiBase.js'

export default {
	data() {
		return {
			isGuardianUser: false,
			settings: {
				autoMonitor: true,
				alertShare: true,
				emergencyCall: true
			},
			newMember: {
				name: '',
				relation: '',
				phone: '',
				account: '',
				password: ''
			},
			newMemberPasswordVisible: false,
			familyMembers: [],
			recentActivities: []
		}
	},
	computed: {
		accentColor() {
			return this.isGuardianUser ? '#DC2626' : '#2f64f5'
		},
		relationOptions() {
			return this.isGuardianUser
				? ['子女', '父母', '配偶', '亲属', '其他']
				: ['父亲', '母亲', '家长', '法定监护人', '其他']
		},
		safeCount() {
			return this.familyMembers.filter((member) => member.status === 'safe').length
		},
		alertCount() {
			return this.familyMembers.filter((member) => member.status === 'warning' || member.status === 'danger').length
		}
	},
	onShow() {
		const acc = this.getCurrentAccount()
		this.isGuardianUser = acc.userType === '监护人'
		this.loadAll()
	},
	methods: {
		parseResponseBody(data) {
			if (data == null || data === '') return {}
			if (typeof data === 'object' && !Array.isArray(data)) return data
			if (typeof data === 'string') {
				try {
					return JSON.parse(data)
				} catch {
					return {}
				}
			}
			return {}
		},
		normalizeHttpResponse(res) {
			if (Array.isArray(res) && res.length >= 2) {
				const inner = res[1]
				return inner ? this.normalizeHttpResponse(inner) : { statusCode: 0, data: {}, header: {} }
			}
			if (!res || typeof res !== 'object') {
				return { statusCode: 0, data: {}, header: {} }
			}
			return {
				statusCode: res.statusCode,
				data: this.parseResponseBody(res.data),
				header: res.header || {}
			}
		},
		/** 用 success/fail 封装，避免部分端上 await uni.request 返回值异常；并解析字符串 JSON */
		requestApi(path, options = {}) {
			const baseUrl = getApiBaseUrl()
			const urlPrimary = `${baseUrl}${path}`
			const urlFallback =
				baseUrl.includes('127.0.0.1') ? urlPrimary.replace(/127\.0\.0\.1/g, 'localhost') : null

			const buildOpts = (fullUrl) => {
				const opts = { ...options, url: fullUrl }
				const h = opts.header || {}
				const ct = String(h['Content-Type'] || h['content-type'] || '').toLowerCase()
				if (
					ct.includes('application/json') &&
					opts.data != null &&
					typeof opts.data === 'object' &&
					!(opts.data instanceof ArrayBuffer)
				) {
					opts.data = JSON.stringify(opts.data)
				}
				return opts
			}

			const run = (fullUrl) =>
				new Promise((resolve, reject) => {
					uni.request({
						...buildOpts(fullUrl),
						success: (raw) => resolve(this.normalizeHttpResponse(raw)),
						fail: (err) => reject(err || new Error('request:fail'))
					})
				})

			return run(urlPrimary).catch((primaryErr) => {
				if (!urlFallback || urlFallback === urlPrimary) return Promise.reject(primaryErr)
				return run(urlFallback).catch(() => Promise.reject(primaryErr))
			})
		},
		getCurrentAccount() {
			const accounts = uni.getStorageSync('user_accounts') || []
			const idx = Number(uni.getStorageSync('active_user_account_index') || 0)
			return accounts[idx] || {}
		},
		getCurrentEmail() {
			return this.getCurrentAccount().email || ''
		},
		getLocalAccountNameByEmail(email) {
			const target = String(email || '').trim().toLowerCase()
			if (!target) return ''
			const accounts = uni.getStorageSync('user_accounts') || []
			if (!Array.isArray(accounts)) return ''
			const hit = accounts.find((acc) => String(acc?.email || '').trim().toLowerCase() === target)
			return String(hit?.name || '').trim()
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
		levelToStatus(levelText) {
			const v = String(levelText || '').toLowerCase()
			if (v.includes('high') || v.includes('高')) return { status: 'danger', statusText: '高风险', statusIcon: 'alert', statusColor: '#EF4444' }
			if (v.includes('medium') || v.includes('中')) return { status: 'warning', statusText: '需关注', statusIcon: 'alert', statusColor: '#F59E0B' }
			return { status: 'safe', statusText: '安全', statusIcon: 'checkmark', statusColor: '#22C55E' }
		},
		async loadAll() {
			await Promise.all([this.loadFamilyMembers(), this.loadActivities()])
		},
		async loadFamilyMembers() {
			const me = this.getCurrentEmail()
			if (!me) {
				this.familyMembers = []
				return
			}
			let res
			try {
				res = await this.requestApi('/api/guardian/links', {
					method: 'GET',
					data: this.isGuardianUser ? { guardianEmail: me } : { wardEmail: me }
				})
			} catch (e) {
				this.familyMembers = []
				const msg = String(e?.errMsg || e?.message || '')
				const netFail = /fail|timeout|abort|连接|网络/i.test(msg)
				uni.showToast({
					title: netFail ? '无法连接后端：请到系统设置填写电脑IP的API地址' : '加载绑定列表失败',
					icon: 'none',
					duration: 2800
				})
				return
			}
			const httpOk = res.statusCode === 200 || res.statusCode === '200' || Number(res.statusCode) === 200
			if (!httpOk || res.data?.success === false) {
				this.familyMembers = []
				uni.showToast({
					title: res.data?.error || `请求失败(${res.statusCode || '?'})`,
					icon: 'none'
				})
				return
			}
			const themes = ['blue', 'pink', 'green', 'purple']
			const items = res?.data?.items || []
			if (this.isGuardianUser) {
				this.familyMembers = items.map((item, idx) => ({
					id: item.id || `${item.guardianEmail}-${item.wardEmail}`,
					name: this.getLocalAccountNameByEmail(item.wardEmail) || item.wardName || '被监护人',
					relation: item.relationship || '家人',
					phone: item.guardianPhone || '',
					account: item.wardEmail || '',
					avatar: (item.wardName || '被').charAt(0),
					theme: themes[idx % themes.length],
					...this.levelToStatus(item.riskLevel)
				}))
			} else {
				this.familyMembers = items.map((item, idx) => ({
					id: item.id || `${item.guardianEmail}-${item.wardEmail}`,
					name: this.getLocalAccountNameByEmail(item.guardianEmail) || item.guardianName || '监护人',
					relation: item.relationship || '监护人',
					phone: item.guardianPhone || '',
					account: item.guardianEmail || '',
					avatar: (item.guardianName || '监').charAt(0),
					theme: themes[idx % themes.length],
					...this.levelToStatus(item.riskLevel)
				}))
			}
		},
		async loadActivities() {
			const email = this.getCurrentEmail()
			if (!email) {
				this.recentActivities = []
				return
			}
			let res
			try {
				res = await this.requestApi('/api/notifications', {
					method: 'GET',
					data: { email }
				})
			} catch (e) {
				this.recentActivities = []
				return
			}
			const httpOk = res.statusCode === 200 || res.statusCode === '200' || Number(res.statusCode) === 200
			if (!httpOk || res.data?.success === false) {
				this.recentActivities = []
				return
			}
			const items = res?.data?.items || []
			this.recentActivities = items.slice(0, 6).map((item) => {
				const text = item.message || item.title || '收到一条监护提醒'
				const raw = String(item.level || item.riskLevel || text).toLowerCase()
				const warning = raw.includes('high') || raw.includes('中') || raw.includes('alert')
				return {
					text,
					time: this.formatTime(item.createdAt),
					type: warning ? 'warning' : 'info',
					icon: 'info-filled',
					color: warning ? '#F59E0B' : this.accentColor
				}
			})
		},
		goBack() {
			uni.navigateBack()
		},
		onRelationPick(e) {
			const i = Number(e.detail.value)
			const list = this.relationOptions
			this.newMember.relation = list[i] || ''
		},
		addFamilyMember() {
			if (!this.isGuardianUser) {
				return
			}
			if (!this.getCurrentEmail()) {
				uni.showToast({ title: '请先登录', icon: 'none' })
				return
			}
			this.newMember = { name: '', relation: '', phone: '', account: '', password: '' }
			this.newMemberPasswordVisible = false
			this.$nextTick(() => {
				const popup = this.$refs.addMemberPopup
				if (popup && typeof popup.open === 'function') {
					popup.open('center')
				}
			})
		},
		closeAddDialog() {
			this.newMemberPasswordVisible = false
			const popup = this.$refs.addMemberPopup
			if (popup && typeof popup.close === 'function') {
				popup.close()
			}
		},
		async confirmAddMember() {
			if (!this.isGuardianUser) {
				return
			}
			const me = this.getCurrentAccount()
			const myEmail = me.email
			if (!myEmail) {
				uni.showToast({ title: '请先登录账号', icon: 'none' })
				return
			}
			if (!this.newMember.name || !this.newMember.relation || !this.newMember.account || !this.newMember.password) {
				uni.showToast({ title: '请填写姓名、关系、邮箱与密码', icon: 'none' })
				return
			}
			if (!this.newMember.account.includes('@')) {
				uni.showToast({
					title: '被监护人邮箱格式不正确',
					icon: 'none'
				})
				return
			}
			const wardEmailNorm = String(this.newMember.account).trim().toLowerCase()
			const dup = this.familyMembers.some((m) => String(m.account || '').trim().toLowerCase() === wardEmailNorm)
			if (dup) {
				uni.showToast({ title: '该被监护人已绑定', icon: 'none' })
				return
			}
			let loginRes
			uni.showLoading({ title: '校验账号…' })
			try {
				loginRes = await this.requestApi('/api/auth/login', {
					method: 'POST',
					header: { 'Content-Type': 'application/json' },
					data: {
						email: this.newMember.account,
						password: this.newMember.password
					}
				})
			} catch (e) {
				uni.hideLoading()
				uni.showToast({ title: '认证服务不可用', icon: 'none' })
				return
			}
			uni.hideLoading()
			const loginOk =
				loginRes.statusCode === 200 ||
				loginRes.statusCode === '200' ||
				Number(loginRes.statusCode) === 200
			if (!loginOk || !loginRes.data?.success) {
				uni.showToast({ title: loginRes.data?.error || '被监护人账号或密码错误', icon: 'none' })
				return
			}
			const wardUser = loginRes.data.user || {}
			if (wardUser.userType === '监护人') {
				uni.showToast({ title: '该账号为监护人，不能作为被监护人绑定', icon: 'none' })
				return
			}
			const body = {
				guardianEmail: myEmail,
				guardianName: me.name || '监护人',
				guardianPhone: me.phone || this.newMember.phone || '',
				wardEmail: this.newMember.account,
				wardName: wardUser.name || this.newMember.name,
				relationship: this.newMember.relation
			}
			let res
			try {
				res = await this.requestApi('/api/guardian/link', {
					method: 'POST',
					header: { 'Content-Type': 'application/json' },
					data: body
				})
			} catch (e) {
				uni.showToast({ title: '绑定失败', icon: 'none' })
				return
			}
			const linkOk = res.statusCode === 200 || res.statusCode === '200' || Number(res.statusCode) === 200
			if (!linkOk || !res.data?.success) {
				uni.showToast({ title: res.data?.error || '绑定失败', icon: 'none' })
				return
			}
			this.closeAddDialog()
			await this.loadFamilyMembers()
			uni.showToast({
				title: '被监护人绑定成功',
				icon: 'success'
			})
		},
		viewMemberDetail(member) {
			uni.showToast({ title: `${member.name}：${member.statusText}`, icon: 'none' })
		},
		editMember(member) {
			uni.showToast({ title: `暂不支持编辑${member.name}`, icon: 'none' })
		},
		removeMember(index) {
			if (!this.isGuardianUser) {
				return
			}
			const member = this.familyMembers[index]
			const myEmail = this.getCurrentEmail()
			if (!member?.account || !myEmail) return
			const unlinkBody = { guardianEmail: myEmail, wardEmail: member.account }
			uni.showModal({
				title: '确认解除',
				content: '确定解除与该被监护人的绑定吗？',
				confirmText: '解除',
				cancelText: '取消',
				success: async (ret) => {
					if (!ret.confirm) return
					let res
					try {
						res = await this.requestApi('/api/guardian/unlink', {
							method: 'POST',
							header: { 'Content-Type': 'application/json' },
							data: unlinkBody
						})
					} catch (e) {
						uni.showToast({ title: '删除失败', icon: 'none' })
						return
					}
					const unlinkOk = res.statusCode === 200 || res.statusCode === '200' || Number(res.statusCode) === 200
					if (!unlinkOk || !res.data?.success) {
						uni.showToast({ title: res.data?.error || '删除失败', icon: 'none' })
						return
					}
					await this.loadFamilyMembers()
					uni.showToast({ title: '已解除绑定', icon: 'success' })
				}
			})
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

	.panel-head-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 16rpx;
		margin-bottom: 8rpx;
	}

	.panel-add-btn {
		width: 56rpx;
		height: 56rpx;
		border-radius: 16rpx;
		background: #eef3ff;
		border: 1rpx solid #d6e2ff;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		position: relative;
		z-index: 2;
	}

	.panel-add-btn-hover {
		opacity: 0.85;
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
		flex: 1;
		min-width: 0;
	}

	.empty-hint {
		margin-top: 16rpx;
		padding: 24rpx;
		font-size: 24rpx;
		color: #8f96a8;
		line-height: 1.5;
		background: #f7f9fc;
		border-radius: 16rpx;
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

	.theme-guardian .logo-dot {
		background: linear-gradient(145deg, #ef4444, #dc2626);
		box-shadow: 0 16rpx 36rpx rgba(220, 38, 38, 0.32);
	}

	.theme-guardian .panel-add-btn {
		background: #fee2e2;
		border-color: #fecaca;
	}

	.theme-guardian .stat-card {
		background: linear-gradient(135deg, #fee2e2, #fecaca);
	}

	.theme-guardian .action-btn {
		background: #fef2f2;
	}

	.theme-guardian .activity-icon.info {
		background: #fee2e2;
	}

	.theme-guardian .setting-icon {
		background: #fef2f2;
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

	.password-row {
		display: flex;
		align-items: center;
		border: 1px solid #e6ecf8;
		border-radius: 18rpx;
		padding-right: 16rpx;
		min-height: 88rpx;
	}

	.password-row .password-input {
		flex: 1;
		min-width: 0;
		border: none;
		border-radius: 18rpx 0 0 18rpx;
	}

	.password-toggle {
		font-size: 26rpx;
		color: #4facfe;
		padding: 8rpx 0 8rpx 8rpx;
		white-space: nowrap;
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

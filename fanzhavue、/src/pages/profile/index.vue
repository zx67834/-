<template>
	<view class="page" :class="{ 'theme-guardian': isGuardianTheme }">
		<view class="bg-glow"></view>
		<view class="status-holder"></view>
		<view class="top-brand">
			<view class="brand-left">
				<view class="logo-dot">
					<image class="logo-dot-img" src="/static/个人中心.png" mode="aspectFit" />
				</view>
				<view>
					<view class="brand-title">个人中心</view>
					<view class="brand-sub">账号与身份管理</view>
				</view>
			</view>
		</view>
		<view class="profile-card glass-card">
			<view class="avatar" @click="handleAvatarClick" v-if="!isLoggedIn || !activeAccount.avatar">
				<uni-icons class="avatar-placeholder-icon" type="person-filled" size="56" color="#ffffff"></uni-icons>
			</view>
			<image :src="activeAccount.avatar" class="avatar-image" @click="previewAvatar" v-else></image>
			<view class="name">{{ isLoggedIn ? activeAccount.name : '未登录' }}</view>
			<view class="email">{{ isLoggedIn ? activeAccount.email : '请登录以查看个人信息' }}</view>
			<view class="pid" v-if="isLoggedIn">用户ID：{{ activeAccount.uid }}</view>
			<view class="identity-row" v-if="isLoggedIn">
				<text class="identity-label">身份类型</text>
				<text v-if="activeAccount.userType === '监护人'" class="identity-tag guardian">监护人</text>
				<text v-else class="identity-tag user">普通用户</text>
			</view>
			<view class="personal-info" v-if="isLoggedIn">
				<view class="info-row">
					<text class="info-label">性别：</text>
					<text class="info-value">{{ activeAccount.gender || '未设置' }}</text>
				</view>
				<view class="info-row">
					<text class="info-label">生日：</text>
					<text class="info-value">{{ activeAccount.birthday || '未设置' }}</text>
				</view>
				<view class="info-row">
					<text class="info-label">地址：</text>
					<text class="info-value">{{ activeAccount.city || '未设置' }}</text>
				</view>
				<view class="info-row">
					<text class="info-label">职业：</text>
					<text class="info-value">{{ activeAccount.occupation || '未设置' }}</text>
				</view>
			</view>
			<view class="profile-actions">
				<view class="level" v-if="isLoggedIn">{{ activeAccount.level }} · {{ activeAccount.risk }}</view>
				<view class="auth-buttons" v-if="isLoggedIn">
					<button class="auth-btn register-btn" size="mini" @click="changeAvatar">更换头像</button>
					<button class="auth-btn logout-btn" size="mini" @click="logout">退出登录</button>
					<button class="auth-btn logout-btn" size="mini" @click="deleteAccount">注销账号</button>
				</view>
				<view class="auth-buttons" v-else>
					<button class="auth-btn login-btn" size="mini" @click="openAuthPopup('login')">登录</button>
					<button class="auth-btn register-btn" size="mini" @click="openAuthPopup('register')">注册</button>
				</view>
			</view>
		</view>



		<view class="panel glass-card">
			<view class="panel-title">账户安全</view>
			<view class="row">
				<text>密码强度</text>
				<text :class="passwordStrengthInfo.className">{{ passwordStrengthInfo.label }}</text>
			</view>
			<view class="strength-tip">{{ passwordStrengthInfo.tip }}</view>
			<view class="row link" @click="goSettings">
				<text>系统设置</text>
				<text class="arrow">›</text>
			</view>
		</view>

		<view class="panel glass-card" v-if="isLoggedIn && activeAccount.userType === '监护人'">
			<view class="panel-title">账号管理</view>
			<view class="account-list">
				<view class="account-item" v-for="(item, index) in accounts" :key="item.uid">
					<view class="account-main" @click="switchAccount(index)">
						<view class="account-name">
							{{ item.name }}
							<text class="current-tag" v-if="activeAccountIndex === index">当前账号</text>
						</view>
						<view class="account-email">{{ item.email }}</view>
					</view>
					<text class="delete-btn" v-if="accounts.length > 1" @click="removeAccount(index)">删除</text>
				</view>
				<view class="add-account-btn" @click="openAddAccountPopup">
					<text class="add-account-icon">+</text>
					<text class="add-account-text">添加账号</text>
				</view>
			</view>
		</view>
		<view class="panel glass-card" v-else-if="isLoggedIn">
			<view class="panel-title">账号管理</view>
			<view class="login-hint">当前账号不是监护人，暂无账号管理权限</view>
		</view>
		<view class="panel glass-card" v-else>
			<view class="panel-title">账号管理</view>
			<view class="login-hint">请登录后查看账号管理信息</view>
		</view>

		<view class="overlay" v-if="showAuthPopup" @click="closeAuthPopup">
			<view class="popup-card glass-card" @click.stop>
				<view class="popup-title">{{ authMode === 'login' ? '账号登录' : '账号注册' }}</view>
				<input class="input" v-model="authForm.email" placeholder="请输入邮箱" />
				<view class="password-row">
					<input
						class="input password-input"
						v-model="authForm.password"
						:password="!authPasswordVisible"
						placeholder="请输入密码（至少6位）"
					/>
					<text class="password-toggle" @click="authPasswordVisible = !authPasswordVisible">{{ authPasswordVisible ? '隐藏' : '显示' }}</text>
				</view>
				<view v-if="authMode === 'register'" class="pwd-hint-row">
					<text class="pwd-hint-label">密码强度：</text>
					<text :class="registerPasswordStrengthInfo.className">{{ registerPasswordStrengthInfo.label }}</text>
					<text class="pwd-hint-tip">{{ registerPasswordStrengthInfo.tip }}</text>
				</view>
				<input class="input" v-if="authMode === 'register'" v-model="authForm.name" placeholder="请输入昵称" />
				<input class="input" v-if="authMode === 'register'" v-model="authForm.phone" placeholder="请输入手机号" />
				<picker v-if="authMode === 'register'" class="picker-wrap" :range="userTypes" :value="userTypeIndex" @change="onUserTypeChange">
					<view class="picker-input">用户类型：{{ authForm.userType }}</view>
				</picker>
				<picker v-if="authMode === 'register'" class="picker-wrap" :range="roleOptions" :value="roleIndex" @change="onRoleChange">
					<view class="picker-input">具体角色：{{ authForm.role }}</view>
				</picker>
				<view class="popup-actions">
					<button class="ghost-btn" size="mini" @click="closeAuthPopup">取消</button>
					<button class="confirm-btn" size="mini" @click="submitAuth">{{ authMode === 'login' ? '登录' : '注册' }}</button>
				</view>
			</view>
		</view>

		<!-- 添加账号弹窗 -->
		<view class="overlay" v-if="showAddAccountPopup" @click="closeAddAccountPopup">
			<view class="popup-card glass-card" @click.stop>
				<view class="popup-title">添加账号</view>
				<view class="login-hint" style="margin-bottom: 12rpx; text-align: left;">使用已在服务端注册的邮箱与密码登录并加入列表</view>
				<input class="input" v-model="addAccountForm.email" placeholder="请输入邮箱" />
				<view class="password-row">
					<input
						class="input password-input"
						v-model="addAccountForm.password"
						:password="!addAccountPasswordVisible"
						placeholder="请输入密码（至少6位）"
					/>
					<text class="password-toggle" @click="addAccountPasswordVisible = !addAccountPasswordVisible">{{ addAccountPasswordVisible ? '隐藏' : '显示' }}</text>
				</view>
				<view class="popup-actions">
					<button class="ghost-btn" size="mini" @click="closeAddAccountPopup">取消</button>
					<button class="confirm-btn" size="mini" @click="submitAddAccount">添加</button>
				</view>
			</view>
		</view>

		<!-- 个人信息修改弹窗 -->
		<view class="overlay" v-if="showEditProfilePopup" @click="closeEditProfilePopup">
			<view class="popup-card glass-card" @click.stop>
				<view class="popup-title">修改个人信息</view>
				<view class="avatar-section">
					<view class="avatar-container" @click="changeAvatarInEdit">
						<image :src="editForm.avatar" class="edit-avatar" v-if="editForm.avatar"></image>
						<view class="edit-avatar placeholder" v-else>
							<uni-icons type="person-filled" size="52" color="#ffffff"></uni-icons>
							<text class="placeholder-text">更换头像</text>
						</view>
						<text class="avatar-hint">点击更换头像</text>
					</view>
				</view>
				<view class="form-section">
					<input class="form-input" v-model="editForm.name" placeholder="请输入昵称" />
					<input class="form-input" v-model="editForm.email" placeholder="请输入邮箱" />
					<view class="form-item">
						<text class="form-label">性别</text>
						<view class="gender-options">
							<view class="gender-option" @click="editForm.gender = '男'">
								<view class="radio" :class="{ 'checked': editForm.gender === '男' }"></view>
								<text>男</text>
							</view>
							<view class="gender-option" @click="editForm.gender = '女'">
								<view class="radio" :class="{ 'checked': editForm.gender === '女' }"></view>
								<text>女</text>
							</view>
						</view>
					</view>
					<input class="form-input" v-model="editForm.birthday" placeholder="请输入生日" />
					<input class="form-input" v-model="editForm.city" placeholder="请输入城市" />
					<input class="form-input" v-model="editForm.occupation" placeholder="请输入职业" />
				</view>
				<view class="popup-actions">
					<button class="cancel-btn" size="mini" @click="closeEditProfilePopup">取消</button>
					<button class="save-btn" size="mini" @click="submitEditProfile">保存</button>
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
						isLoggedIn: false,
						showAuthPopup: false,
						showEditProfilePopup: false,
						showAddAccountPopup: false,
						authPasswordVisible: false,
						addAccountPasswordVisible: false,
						authMode: 'login',
				activeAccountIndex: 0,
				accounts: [{
					name: '王小明',
					email: 'wanqxm@example.com',
					uid: 'USER_20250302',
					level: '普通用户',
					risk: '中风险',
					userType: '用户',
					password: '123456',
					gender: '男',
					birthday: '2022-01-12',
					city: '天津市 天津市 和平区',
					occupation: '11110013'
				}],
				authForm: {
					email: ''
					,
					password: '',
					name: '',
					phone: '',
					userType: '用户',
					role: '普通用户'
				},
				userTypes: ['用户', '监护人'],
				userRoles: ['普通用户', '高风险用户', '老年人', '学生', '财会人员', '企业主'],
				guardianRoles: ['家长', '法定监护人', '其他监护人'],
				addAccountForm: {
					email: '',
					password: ''
				},
				editForm: {
				name: '',
				email: '',
				avatar: '',
				gender: '男',
				birthday: '2022-01-12',
				city: '天津市 天津市 和平区',
				occupation: '11110013'
			}
			}
		},
		computed: {
			activeAccount() {
				return this.accounts[this.activeAccountIndex] || this.accounts[0]
			},
			roleOptions() {
				return this.authForm.userType === '监护人' ? this.guardianRoles : this.userRoles
			},
			userTypeIndex() {
				const idx = this.userTypes.indexOf(this.authForm.userType)
				return idx >= 0 ? idx : 0
			},
			roleIndex() {
				const idx = this.roleOptions.indexOf(this.authForm.role)
				return idx >= 0 ? idx : 0
			},
			registerPasswordStrengthInfo() {
				const pwd = String(this.authForm.password || '')
				if (!pwd) {
					return {
						label: '未输入',
						className: 'warn',
						tip: '建议至少8位，包含大小写字母、数字和符号'
					}
				}
				const { score } = this.evaluatePasswordStrength(pwd)
				if (score >= 4) {
					return {
						label: '强',
						className: 'ok',
						tip: '强度良好，可用于注册'
					}
				}
				if (score >= 3) {
					return {
						label: '中',
						className: 'warn',
						tip: '建议增加特殊字符或长度'
					}
				}
				return {
					label: '弱',
					className: 'danger',
					tip: '建议提高复杂度后再注册'
				}
			},
			passwordStrengthInfo() {
				if (!this.isLoggedIn || !this.activeAccount) {
					return {
						label: '未检测',
						className: 'warn',
						tip: '登录后可检测当前账号密码强度'
					}
				}
				const pwd = String(this.activeAccount.password || '')
				const { score } = this.evaluatePasswordStrength(pwd)
				if (!pwd) {
					return {
						label: '未设置',
						className: 'warn',
						tip: '当前账号未保存密码，请重新登录后检测'
					}
				}
				if (score >= 4) {
					return {
						label: '强',
						className: 'ok',
						tip: '密码复杂度较高，安全性较好'
					}
				}
				if (score >= 3) {
					return {
						label: '中',
						className: 'warn',
						tip: '建议补充大写字母或特殊字符，提升安全性'
					}
				}
				return {
					label: '弱',
					className: 'danger',
					tip: '密码较弱，建议至少8位并混合大小写、数字和符号'
				}
			}
		},
		onLoad() {
			this.syncLoginStateFromStorage()
		},
		onShow() {
			// 从设置页退出等会改 storage，回到「我的」或切换 tab 时需重新同步，否则界面仍像已登录
			this.syncLoginStateFromStorage()
		},
		watch: {
			accounts: {
				handler(newAccounts) {
					uni.setStorageSync('user_accounts', newAccounts)
				},
				deep: true
			},
			activeAccountIndex(newIndex) {
				uni.setStorageSync('active_user_account_index', newIndex)
			},
			isLoggedIn(newFlag) {
				uni.setStorageSync('is_logged_in', newFlag ? '1' : '0')
			}
		},
		methods: {
			evaluatePasswordStrength(password) {
				const pwd = String(password || '')
				let score = 0
				if (pwd.length >= 8) score += 1
				if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) score += 1
				if (/\d/.test(pwd)) score += 1
				if (/[^A-Za-z0-9]/.test(pwd)) score += 1
				if (pwd.length >= 12) score += 1
				return { score }
			},
			syncLoginStateFromStorage() {
				const cacheAccounts = uni.getStorageSync('user_accounts')
				if (Array.isArray(cacheAccounts) && cacheAccounts.length) {
					this.accounts = cacheAccounts
				}
				const loggedInFlag = uni.getStorageSync('is_logged_in')
				this.isLoggedIn = loggedInFlag === true || loggedInFlag === 1 || loggedInFlag === '1' || loggedInFlag === 'true'
				const cacheActiveIndex = uni.getStorageSync('active_user_account_index')
				const normalizedIndex = Number(cacheActiveIndex)
				if (!Number.isNaN(normalizedIndex) && normalizedIndex >= 0 && normalizedIndex < this.accounts.length) {
					this.activeAccountIndex = normalizedIndex
				}
				if (typeof this.refreshGuardianTheme === 'function') {
					this.refreshGuardianTheme()
				}
			},
			/** 将后端 /api/auth/login 返回的 user 写入本地多账号列表（与网页端一致） */
			syncAccountFromBackendUser(user, password) {
				if (!user || !user.email) return
				let userType = user.userType || '用户'
				if (userType === '用户' && user.role && String(user.role).includes('监护人')) {
					userType = '监护人'
				}
				const emailNorm = String(user.email).trim().toLowerCase()
				const existingIdx = this.accounts.findIndex(
					(item) => String(item.email || '').trim().toLowerCase() === emailNorm
				)
				const base = {
					name: user.name,
					email: user.email,
					password,
					uid: `USER_${user.id || Date.now()}`,
					level: user.role || '普通用户',
					risk: user.riskLevel || '低风险',
					phone: user.phone || '',
					userType,
					bio: user.bio || ''
				}
				if (existingIdx >= 0) {
					const prev = this.accounts[existingIdx]
					this.accounts[existingIdx] = {
						...prev,
						...base,
						gender: prev.gender || '男',
						birthday: prev.birthday || '',
						city: prev.city || '',
						occupation: prev.occupation || '',
						avatar: prev.avatar || ''
					}
					this.activeAccountIndex = existingIdx
				} else {
					this.accounts.push({
						...base,
						gender: '男',
						birthday: '',
						city: '',
						occupation: ''
					})
					this.activeAccountIndex = this.accounts.length - 1
				}
			},
			changeAvatar() {
				// 跳转到个人信息修改页面
				this.handleAvatarClick();
			},
			previewAvatar() {
				// 头像预览
				if (this.activeAccount.avatar) {
					uni.previewImage({
						urls: [this.activeAccount.avatar],
						current: this.activeAccount.avatar
					});
				}
			},
			changeAvatarInEdit() {
				// 在个人信息修改页面更换头像
				uni.chooseImage({
					count: 1,
					sizeType: ['original', 'compressed'],
					sourceType: ['album', 'camera'],
					success: (res) => {
						const tempFilePaths = res.tempFilePaths
						// 这里可以添加上传到服务器的逻辑
						// 暂时只存储本地路径
						this.editForm.avatar = tempFilePaths[0]
						uni.showToast({
							title: '头像选择成功',
							icon: 'success'
						})
					},
					fail: () => {
						uni.showToast({
							title: '选择图片失败',
							icon: 'none'
						})
					}
				})
			},
			goSettings() {
				uni.navigateTo({
					url: '/pages/settings/index'
				})
			},
			openAuthPopup(mode) {
				this.authMode = mode
				this.authPasswordVisible = false
				this.showAuthPopup = true
			},
			closeAuthPopup() {
				this.showAuthPopup = false
				this.authPasswordVisible = false
				this.authForm = {
					email: ''
					,
					password: '',
					name: '',
					phone: '',
					userType: '用户',
					role: '普通用户'
				}
			},
			onUserTypeChange(e) {
				const nextType = this.userTypes[e.detail.value] || '用户'
				this.authForm.userType = nextType
				this.authForm.role = nextType === '监护人' ? this.guardianRoles[0] : this.userRoles[0]
			},
			onRoleChange(e) {
				this.authForm.role = this.roleOptions[e.detail.value] || this.roleOptions[0]
			},
			async submitAuth() {
				const email = (this.authForm.email || '').trim()
				const password = (this.authForm.password || '').trim()
				if (!email || !password) {
					uni.showToast({
						title: '请输入邮箱和密码',
						icon: 'none'
					})
					return
				}
				if (!email.includes('@')) {
					uni.showToast({
						title: '请输入有效邮箱',
						icon: 'none'
					})
					return
				}
				if (password.length < 6) {
					uni.showToast({
						title: '密码至少6位',
						icon: 'none'
					})
					return
				}
				if (this.authMode === 'login') {
					let res
					try {
						res = await uni.request({
							url: `${getApiBaseUrl()}/api/auth/login`,
							method: 'POST',
							header: { 'Content-Type': 'application/json' },
							data: { email, password }
						})
					} catch (error) {
						uni.showToast({
							title: '无法连接认证服务',
							icon: 'none'
						})
						return
					}
					if (res.statusCode !== 200 || !res.data?.success) {
						uni.showToast({
							title: res.data?.error || '账号或密码错误',
							icon: 'none'
						})
						return
					}
					const user = res.data.user
					this.syncAccountFromBackendUser(user, password)
					this.isLoggedIn = true
					this.closeAuthPopup()
					this.refreshGuardianTheme()
					uni.showToast({
						title: '登录成功',
						icon: 'success'
					})
					return
				}
				const name = (this.authForm.name || '').trim()
				const phone = (this.authForm.phone || '').trim()
				const userType = this.authForm.userType
				const role = this.authForm.role
				if (!name) {
					uni.showToast({
						title: '请输入昵称',
						icon: 'none'
					})
					return
				}
				if (!phone) {
					uni.showToast({
						title: '请输入手机号',
						icon: 'none'
					})
					return
				}
				if (!userType || !role) {
					uni.showToast({
						title: '请选择用户类型和角色',
						icon: 'none'
					})
					return
				}
				if (this.registerPasswordStrengthInfo.label === '弱') {
					uni.showToast({
						title: '密码强度过弱，请提升后注册',
						icon: 'none'
					})
					return
				}
				const alreadyExist = this.accounts.some(item => item.email === email)
				if (alreadyExist) {
					uni.showToast({
						title: '该邮箱已注册',
						icon: 'none'
					})
					return
				}
				let res
				try {
					res = await uni.request({
						url: `${getApiBaseUrl()}/api/auth/register`,
						method: 'POST',
						header: { 'Content-Type': 'application/json' },
						data: {
							name,
							email,
							password,
							phone,
							role: `${userType} - ${role}`
						}
					})
				} catch (error) {
					uni.showToast({
						title: '无法连接认证服务',
						icon: 'none'
					})
					return
				}
				if (res.statusCode !== 200 || !res.data?.success) {
					uni.showToast({
						title: res.data?.error || '注册失败',
						icon: 'none'
					})
					return
				}
				const user = res.data.user || {}
				this.accounts.push({
					name: user.name || name,
					email: user.email || email,
					password,
					uid: `USER_${user.id || Date.now()}`,
					level: user.role || role,
					risk: user.riskLevel || '低风险',
					phone: user.phone || phone,
					userType: user.userType || userType,
					gender: '男',
					birthday: '',
					city: '',
					occupation: ''
				})
				this.activeAccountIndex = this.accounts.length - 1
				this.isLoggedIn = true
				this.closeAuthPopup()
				this.refreshGuardianTheme()
				uni.showToast({
					title: '注册并登录成功',
					icon: 'success'
				})
			},
			switchAccount(index) {
				this.activeAccountIndex = index
				this.refreshGuardianTheme()
				uni.showToast({
					title: '已切换账号',
					icon: 'none'
				})
			},
			logout() {
				if (!this.isLoggedIn) {
					uni.showToast({
						title: '当前未登录',
						icon: 'none'
					})
					return
				}
				uni.showModal({
					title: '确认登出',
					content: '确定要退出登录吗？',
					confirmText: '退出登录',
					cancelText: '取消',
					confirmColor: '#d64545',
					success: (res) => {
						if (!res.confirm) return
						this.isLoggedIn = false
						this.showAuthPopup = false
						this.showEditProfilePopup = false
						this.showAddAccountPopup = false
						this.refreshGuardianTheme()
						uni.showToast({
							title: '已退出登录',
							icon: 'none'
						})
					}
				})
			},
			async deleteAccount() {
				if (!this.isLoggedIn || !this.activeAccount?.email) {
					uni.showToast({
						title: '当前未登录',
						icon: 'none'
					})
					return
				}
				uni.showModal({
					title: '确认注销',
					content: '注销后账号、报告与监护关系将被删除，且不可恢复。',
					confirmText: '确认注销',
					confirmColor: '#d64545',
					success: async (ret) => {
						if (!ret.confirm) return
						uni.showLoading({ title: '注销中' })
						let res
						try {
							res = await this.requestApi('/api/auth/user', {
								method: 'DELETE',
								header: { 'Content-Type': 'application/json' },
								data: { email: this.activeAccount.email }
							})
						} catch (e) {
							uni.hideLoading()
							uni.showToast({
								title: '注销失败，请检查网络',
								icon: 'none'
							})
							return
						}
						uni.hideLoading()
						if (res.statusCode !== 200 || !res.data?.success) {
							uni.showToast({
								title: res.data?.error || '注销失败',
								icon: 'none'
							})
							return
						}

						const currentIndex = this.activeAccountIndex
						this.accounts.splice(currentIndex, 1)
						if (this.accounts.length === 0) {
							this.activeAccountIndex = 0
						} else {
							this.activeAccountIndex = Math.max(0, currentIndex - 1)
						}
						this.isLoggedIn = false
						this.refreshGuardianTheme()
						uni.showToast({
							title: '账号已注销',
							icon: 'success'
						})
					}
				})
			},
			removeAccount(index) {
					if (this.accounts.length <= 1) {
						uni.showToast({
							title: '至少保留一个账号',
							icon: 'none'
						})
						return
					}
					const removedCurrent = this.activeAccountIndex === index
					this.accounts.splice(index, 1)
					if (removedCurrent) {
						this.activeAccountIndex = 0
						this.isLoggedIn = false
					} else if (this.activeAccountIndex > index) {
						this.activeAccountIndex -= 1
					}
					uni.showToast({
						title: '账号已删除',
						icon: 'none'
					})
					this.refreshGuardianTheme()
				},
				openAddAccountPopup() {
					this.addAccountForm = {
						email: '',
						password: ''
					}
					this.addAccountPasswordVisible = false
					this.showAddAccountPopup = true
				},
				closeAddAccountPopup() {
					this.showAddAccountPopup = false
					this.addAccountPasswordVisible = false
					this.addAccountForm = {
						email: '',
						password: ''
					}
				},
				async submitAddAccount() {
					const email = (this.addAccountForm.email || '').trim()
					const password = (this.addAccountForm.password || '').trim()
					
					if (!email || !password) {
						uni.showToast({
							title: '请输入邮箱和密码',
							icon: 'none'
						})
						return
					}
					
					if (!email.includes('@')) {
						uni.showToast({
							title: '请输入有效邮箱',
							icon: 'none'
						})
						return
					}
					
					if (password.length < 6) {
						uni.showToast({
							title: '密码至少6位',
							icon: 'none'
						})
						return
					}

					const emailNorm = email.toLowerCase()
					const alreadyInList = this.accounts.some(
						(item) => String(item.email || '').trim().toLowerCase() === emailNorm
					)
					if (alreadyInList) {
						uni.showToast({
							title: '该邮箱已在列表中',
							icon: 'none'
						})
						return
					}

					let res
					try {
						res = await uni.request({
							url: `${getApiBaseUrl()}/api/auth/login`,
							method: 'POST',
							header: { 'Content-Type': 'application/json' },
							data: { email, password }
						})
					} catch (error) {
						uni.showToast({
							title: '无法连接认证服务',
							icon: 'none'
						})
						return
					}
					if (res.statusCode !== 200 || !res.data?.success) {
						uni.showToast({
							title: res.data?.error || '账号或密码错误',
							icon: 'none'
						})
						return
					}

					this.syncAccountFromBackendUser(res.data.user, password)
					this.closeAddAccountPopup()
					this.refreshGuardianTheme()
					uni.showToast({
						title: '账号已添加并同步',
						icon: 'success'
					})
				},
			handleAvatarClick() {
				if (!this.isLoggedIn) {
					// 未登录时跳转到登录页面
					this.openAuthPopup('login');
				} else {
					// 已登录时打开个人信息修改弹窗
					// 初始化表单数据
					this.editForm = {
						name: this.activeAccount.name,
						email: this.activeAccount.email,
						avatar: this.activeAccount.avatar || '',
						gender: this.activeAccount.gender || '男',
						birthday: this.activeAccount.birthday || '2022-01-12',
						city: this.activeAccount.city || '天津市 天津市 和平区',
						occupation: this.activeAccount.occupation || '11110013'
					};
					this.showEditProfilePopup = true;
				}
			},
			closeEditProfilePopup() {
				this.showEditProfilePopup = false;
				this.editForm = {
					name: '',
					email: '',
					avatar: '',
					gender: '男',
					birthday: '2022-01-12',
					city: '天津市 天津市 和平区',
					occupation: '11110013'
				};
			},
			requestApi(path, options = {}) {
				return new Promise((resolve, reject) => {
					uni.request({
						url: `${getApiBaseUrl()}${path}`,
						...options,
						success: (res) => resolve(res),
						fail: (err) => reject(err || new Error('request:fail'))
					})
				})
			},
			async syncProfileToGuardianLinks(updatedAccount) {
				const email = String(updatedAccount?.email || '').trim().toLowerCase()
				const name = String(updatedAccount?.name || '').trim()
				if (!email || !name) return
				const isGuardian = String(updatedAccount?.userType || '').includes('监护人')
				let linksRes
				try {
					linksRes = await this.requestApi('/api/guardian/links', {
						method: 'GET',
						data: isGuardian ? { guardianEmail: email } : { wardEmail: email }
					})
				} catch (e) {
					return
				}
				if (linksRes.statusCode !== 200 || !linksRes.data?.success || !Array.isArray(linksRes.data.items)) return
				const links = linksRes.data.items
				for (const item of links) {
					const payload = {
						guardianEmail: item.guardianEmail,
						guardianName: isGuardian ? name : item.guardianName,
						guardianPhone: item.guardianPhone || '',
						wardEmail: item.wardEmail,
						wardName: isGuardian ? item.wardName : name,
						relationship: item.relationship || '家人',
						riskLevel: item.riskLevel || '低风险'
					}
					try {
						await this.requestApi('/api/guardian/link', {
							method: 'POST',
							header: { 'Content-Type': 'application/json' },
							data: payload
						})
					} catch (e) {
						// 单条失败不影响其余同步
					}
				}
			},
			async submitEditProfile() {
				const name = (this.editForm.name || '').trim();
				const email = (this.editForm.email || '').trim();
				if (!name || !email) {
					uni.showToast({
						title: '请输入昵称和邮箱',
						icon: 'none'
					});
					return;
				}
				if (!email.includes('@')) {
					uni.showToast({
						title: '请输入有效邮箱',
						icon: 'none'
					});
					return;
				}
				// 检查邮箱是否已被其他账号使用
				const emailExists = this.accounts.some((account, index) => 
					account.email === email && index !== this.activeAccountIndex
				);
				if (emailExists) {
					uni.showToast({
						title: '该邮箱已被其他账号使用',
						icon: 'none'
					});
					return;
				}
				const originalEmail = String(this.activeAccount.email || '').trim().toLowerCase();
				let res;
				try {
					res = await this.requestApi('/api/auth/user', {
						method: 'PUT',
						header: { 'Content-Type': 'application/json' },
						data: {
							originalEmail,
							email,
							name,
							phone: this.activeAccount.phone || '',
							bio: this.activeAccount.bio || ''
						}
					});
				} catch (e) {
					uni.showToast({
						title: '无法连接服务器',
						icon: 'none'
					});
					return;
				}
				if (res.statusCode !== 200 || !res.data?.success) {
					uni.showToast({
						title: res.data?.error || '保存失败',
						icon: 'none'
					});
					return;
				}

				const backendUser = res.data.user || {};
				this.accounts[this.activeAccountIndex] = {
					...this.accounts[this.activeAccountIndex],
					name: backendUser.name || name,
					email: backendUser.email || email,
					phone: backendUser.phone || this.activeAccount.phone,
					bio: backendUser.bio ?? this.activeAccount.bio,
					userType: backendUser.userType || this.activeAccount.userType,
					role: backendUser.role || this.activeAccount.role,
					avatar: this.editForm.avatar,
					gender: this.editForm.gender,
					birthday: this.editForm.birthday,
					city: this.editForm.city,
					occupation: this.editForm.occupation
				};
				await this.syncProfileToGuardianLinks(this.accounts[this.activeAccountIndex]);
				this.closeEditProfilePopup();
				uni.showToast({
					title: '个人信息更新成功',
					icon: 'success'
				});
			}
		}
	}
</script>

<style lang="scss">
	.page {
		min-height: 100vh;
		background: linear-gradient(180deg, #f3f6fc 0%, #eef2f9 100%);
		padding: 24rpx 28rpx calc(24rpx + env(safe-area-inset-bottom));
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
		min-height: 72rpx;
	}

	.brand-left {
		display: flex;
		align-items: center;
		gap: 16rpx;
		flex: 1;
		min-width: 0;
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
		flex-shrink: 0;
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

	.profile-card {
		margin-top: 20rpx;
		border-radius: 24rpx;
		padding: 30rpx;
		text-align: center;
	}

	.avatar {
		width: 120rpx;
		height: 120rpx;
		border-radius: 50%;
		margin: 0 auto;
		background: linear-gradient(135deg, #4f94ff, #2f64f5);
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.avatar-placeholder-icon {
		line-height: 1;
	}

	.avatar-image {
		width: 120rpx;
		height: 120rpx;
		border-radius: 50%;
		margin: 0 auto;
		object-fit: cover;
		cursor: pointer;
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

		.identity-row {
			margin-top: 14rpx;
			display: flex;
			align-items: center;
			justify-content: center;
			gap: 12rpx;
			flex-wrap: wrap;
		}

		.identity-label {
			font-size: 22rpx;
			color: #8991a6;
		}

		.identity-tag {
			font-size: 22rpx;
			font-weight: 600;
			padding: 6rpx 20rpx;
			border-radius: 999rpx;
		}

		.identity-tag.guardian {
			color: #b71c1c;
			background: #ffebee;
			border: 1rpx solid #ffcdd2;
		}

		.identity-tag.user {
			color: #1565c0;
			background: #e3f2fd;
			border: 1rpx solid #bbdefb;
		}

		.theme-guardian .identity-tag.user {
			color: #7f1d1d;
			background: rgba(255, 255, 255, 0.85);
			border-color: rgba(198, 40, 40, 0.25);
		}

		.personal-info {
			margin-top: 16rpx;
			width: 100%;
			padding: 0 20rpx;
		}

		.info-row {
			display: flex;
			align-items: center;
			margin-bottom: 10rpx;
			font-size: 24rpx;
		}

		.info-label {
			color: #8991a6;
			margin-right: 12rpx;
			min-width: 80rpx;
		}

		.info-value {
			color: #303a52;
			flex: 1;
			text-align: left;
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

		.auth-buttons {
			display: flex;
			gap: 12rpx;
			margin-top: 14rpx;
		}

		.auth-btn {
			height: 60rpx;
			line-height: 60rpx;
			border-radius: 999rpx;
			font-size: 24rpx;
			padding: 0 22rpx;
			white-space: nowrap;
		}

		.login-btn {
			background: #2f80ff;
			color: #fff;
			border: 2rpx solid #2f80ff;
		}

		.register-btn {
			background: #ffffff;
			color: #2f80ff;
			border: 2rpx solid #d1e1ff;
		}

		.logout-btn {
			background: #fff5f5;
			color: #d64545;
			border: 2rpx solid #f0c4c4;
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

	.warn {
		color: #f2994a;
	}
	.danger {
		color: #e95a5a;
	}
	.strength-tip {
		margin-top: 8rpx;
		font-size: 22rpx;
		color: #8b94a8;
	}
	.pwd-hint-row {
		margin: -2rpx 0 10rpx;
		display: flex;
		align-items: center;
		gap: 8rpx;
		flex-wrap: wrap;
	}
	.pwd-hint-label {
		font-size: 22rpx;
		color: #7e879c;
	}
	.pwd-hint-tip {
		font-size: 20rpx;
		color: #9aa3b8;
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

	.account-list {
		margin-top: 14rpx;
	}

	.action-row {
		display: flex;
		gap: 12rpx;
		margin-top: 16rpx;
	}

	.small-btn {
		height: 56rpx;
		line-height: 56rpx;
		border-radius: 999rpx;
		border: 2rpx solid #d7dfef;
		background: #fff;
		color: #60708f;
		font-size: 22rpx;
		padding: 0 18rpx;
	}

	.primary-solid {
		background: #2f80ff;
		color: #fff;
		border-color: #2f80ff;
	}

	.danger-btn {
		border-color: #f4cdcd;
		color: #d25d5d;
	}

	.account-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 16rpx 0;
		border-bottom: 1rpx solid #eef1f7;
	}

	.account-item:last-child {
		border-bottom: 0;
	}

	.account-main {
		flex: 1;
	}

	.account-name {
		font-size: 26rpx;
		color: #2c3550;
	}

	.current-tag {
		margin-left: 10rpx;
		font-size: 20rpx;
		color: #2f80ff;
		background: #e9f2ff;
		padding: 2rpx 10rpx;
		border-radius: 999rpx;
	}

	.account-email {
		margin-top: 4rpx;
		font-size: 22rpx;
		color: #9aa2b6;
	}

	.delete-btn {
			color: #e45d5d;
			font-size: 24rpx;
			padding-left: 16rpx;
		}

		.login-hint {
			padding: 20rpx 0;
			text-align: center;
			color: #8991a6;
			font-size: 24rpx;
		}

	.add-account-btn {
			margin-top: 16rpx;
			height: 80rpx;
			border-radius: 12rpx;
			border: 2rpx dashed #b9cff9;
			color: #2f80ff;
			background: #f4f8ff;
			font-size: 26rpx;
			display: flex;
			align-items: center;
			justify-content: center;
			gap: 12rpx;
			cursor: pointer;
		}

		.add-account-icon {
			font-size: 32rpx;
			font-weight: bold;
		}

		.add-account-text {
			font-size: 26rpx;
		}

	/* 弹窗样式 */
	.overlay {
		position: fixed;
		inset: 0;
		background: rgba(19, 29, 48, 0.35);
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 24rpx;
		z-index: 999;
	}

	.popup-card {
		width: 100%;
		border-radius: 20rpx;
		padding: 24rpx;
	}

	.popup-title {
		font-size: 30rpx;
		font-weight: 700;
		color: #202a43;
		margin-bottom: 16rpx;
	}

	.input {
		height: 74rpx;
		background: #f6f8fc;
		border-radius: 14rpx;
		padding: 0 20rpx;
		font-size: 24rpx;
		color: #2d3650;
		margin-bottom: 12rpx;
	}

	.password-row {
		display: flex;
		align-items: center;
		margin-bottom: 12rpx;
		background: #f6f8fc;
		border-radius: 14rpx;
		padding-right: 16rpx;
		min-height: 74rpx;
	}

	.password-row .password-input {
		flex: 1;
		margin-bottom: 0;
		background: transparent;
		min-width: 0;
	}

	.password-toggle {
		font-size: 24rpx;
		color: #2f80ff;
		padding: 8rpx 0 8rpx 8rpx;
		white-space: nowrap;
	}

	.picker-wrap {
		margin-bottom: 12rpx;
	}

	.picker-input {
		height: 74rpx;
		background: #f6f8fc;
		border-radius: 14rpx;
		padding: 0 20rpx;
		font-size: 24rpx;
		color: #2d3650;
		display: flex;
		align-items: center;
	}

	/* 弹窗表单项目 */
	.popup-form-item {
		margin-bottom: 12rpx;
		border-bottom: none;
		height: auto;
		padding: 0;
	}

	/* 性别选项 */
	.gender-options {
		display: flex;
		gap: 40rpx;
	}

	.gender-option {
		display: flex;
		align-items: center;
		gap: 8rpx;
	}

	.radio {
		width: 32rpx;
		height: 32rpx;
		border: 2rpx solid #ddd;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.radio.checked {
		border-color: #2f80ff;
		background: #2f80ff;
	}

	.radio.checked::after {
		content: '';
		width: 16rpx;
		height: 16rpx;
		background: #fff;
		border-radius: 50%;
	}

	.popup-actions {
		display: flex;
		justify-content: flex-end;
		gap: 12rpx;
		margin-top: 8rpx;
	}

	.ghost-btn {
		height: 58rpx;
		line-height: 58rpx;
		border-radius: 999rpx;
		border: 2rpx solid #d7dfef;
		color: #6f7890;
		background: #fff;
		padding: 0 22rpx;
		font-size: 24rpx;
	}

	.confirm-btn {
			height: 58rpx;
			line-height: 58rpx;
			border-radius: 999rpx;
			color: #fff;
			background: linear-gradient(135deg, #3f8cff, #2877ff);
			padding: 0 22rpx;
			font-size: 24rpx;
		}

		/* 头像部分样式 */
		.avatar-section {
			display: flex;
			flex-direction: column;
			align-items: center;
			margin-bottom: 30rpx;
		}

		.avatar-container {
			display: flex;
			flex-direction: column;
			align-items: center;
			cursor: pointer;
		}

		.edit-avatar {
			width: 160rpx;
			height: 160rpx;
			border-radius: 50%;
			object-fit: cover;
		}

		.edit-avatar.placeholder {
			background: linear-gradient(145deg, #5fa4ff, #2468ff);
			display: flex;
			flex-direction: column;
			align-items: center;
			justify-content: center;
			gap: 10rpx;
			color: #fff;
			font-size: 24rpx;
			box-sizing: border-box;
		}

		.placeholder-text {
			font-size: 24rpx;
			color: rgba(255, 255, 255, 0.95);
			line-height: 1.2;
		}

		.avatar-hint {
			margin-top: 12rpx;
			font-size: 24rpx;
			color: #8991a6;
			text-align: center;
		}

		/* 表单部分样式 */
		.form-section {
			width: 100%;
		}

		.form-input {
			height: 80rpx;
			background: #f6f8fc;
			border-radius: 12rpx;
			padding: 0 24rpx;
			font-size: 26rpx;
			color: #2d3650;
			margin-bottom: 16rpx;
			border: 1rpx solid #e0e0e0;
		}

		.form-item {
			height: 80rpx;
			display: flex;
			align-items: center;
			margin-bottom: 16rpx;
		}

		.form-label {
			font-size: 26rpx;
			color: #303a52;
			margin-right: 30rpx;
			min-width: 80rpx;
		}

		/* 按钮样式 */
		.cancel-btn {
			height: 80rpx;
			line-height: 80rpx;
			border-radius: 12rpx;
			border: 2rpx solid #d7dfef;
			color: #6f7890;
			background: #fff;
			padding: 0 40rpx;
			font-size: 26rpx;
			flex: 1;
			margin-right: 12rpx;
		}

		.save-btn {
			height: 80rpx;
			line-height: 80rpx;
			border-radius: 12rpx;
			color: #fff;
			background: #2f80ff;
			padding: 0 40rpx;
			font-size: 26rpx;
			flex: 1;
			margin-left: 12rpx;
		}

		/* 性别选项 */
		.gender-options {
			display: flex;
			gap: 40rpx;
		}

		.gender-option {
			display: flex;
			align-items: center;
			gap: 10rpx;
		}

		.radio {
			width: 36rpx;
			height: 36rpx;
			border: 2rpx solid #ddd;
			border-radius: 50%;
			display: flex;
			align-items: center;
			justify-content: center;
		}

		.radio.checked {
			border-color: #2f80ff;
			background: #2f80ff;
		}

		.radio.checked::after {
			content: '';
			width: 18rpx;
			height: 18rpx;
			background: #fff;
			border-radius: 50%;
		}
</style>

<template>
	<view class="page">
		<view class="bg-glow"></view>
		<view class="title">个人中心</view>
		<view class="profile-card glass-card">
			<view class="avatar" @click="handleAvatarClick" v-if="!isLoggedIn || !activeAccount.avatar">
			</view>
			<image :src="activeAccount.avatar" class="avatar-image" @click="previewAvatar" v-else></image>
			<view class="name">{{ isLoggedIn ? activeAccount.name : '未登录' }}</view>
			<view class="email">{{ isLoggedIn ? activeAccount.email : '请登录以查看个人信息' }}</view>
			<view class="pid" v-if="isLoggedIn">用户ID：{{ activeAccount.uid }}</view>
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
				<button class="primary-btn" size="mini" @click="changeAvatar" v-if="isLoggedIn">更换头像</button>
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

		<view class="panel glass-card" v-if="isLoggedIn">
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
		<view class="panel glass-card" v-else>
			<view class="panel-title">账号管理</view>
			<view class="login-hint">请登录后查看账号管理信息</view>
		</view>

		<view class="overlay" v-if="showAuthPopup" @click="closeAuthPopup">
			<view class="popup-card glass-card" @click.stop>
				<view class="popup-title">{{ authMode === 'login' ? '账号登录' : '账号注册' }}</view>
				<input class="input" v-model="authForm.email" placeholder="请输入邮箱" />
				<input class="input" v-model="authForm.password" password placeholder="请输入密码（至少6位）" />
				<input class="input" v-if="authMode === 'register'" v-model="authForm.name" placeholder="请输入昵称" />
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
				<input class="input" v-model="addAccountForm.name" placeholder="请输入昵称" />
				<input class="input" v-model="addAccountForm.email" placeholder="请输入邮箱" />
				<input class="input" v-model="addAccountForm.password" password placeholder="请输入密码（至少6位）" />
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
	export default {
		data() {
					return {
						mfaEnabled: true,
						isLoggedIn: false,
						showAuthPopup: false,
						showEditProfilePopup: false,
						showAddAccountPopup: false,
						authMode: 'login',
				activeAccountIndex: 0,
				accounts: [{
					name: '王小明',
					email: 'wanqxm@example.com',
					uid: 'USER_20250302',
					level: '普通用户',
					risk: '中风险',
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
					name: ''
				},
				addAccountForm: {
					name: '',
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
			}
		},
		onLoad() {
			// 从本地存储加载双重认证状态
			const savedMfaEnabled = uni.getStorageSync('mfaEnabled');
			if (savedMfaEnabled !== null && savedMfaEnabled !== undefined) {
				this.mfaEnabled = savedMfaEnabled;
			}
			const cacheAccounts = uni.getStorageSync('user_accounts')
			if (Array.isArray(cacheAccounts) && cacheAccounts.length) {
				this.accounts = cacheAccounts
			}
			const loggedInFlag = uni.getStorageSync('is_logged_in')
			this.isLoggedIn = Boolean(loggedInFlag)
			const cacheActiveIndex = uni.getStorageSync('active_user_account_index')
			if (typeof cacheActiveIndex === 'number' && cacheActiveIndex >= 0 && cacheActiveIndex < this.accounts.length) {
				this.activeAccountIndex = cacheActiveIndex
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
			},
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
				uni.setStorageSync('is_logged_in', newFlag)
			}
		},
		methods: {
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
			},
			openAuthPopup(mode) {
				this.authMode = mode
				this.showAuthPopup = true
			},
			closeAuthPopup() {
				this.showAuthPopup = false
				this.authForm = {
					email: ''
					,
					password: '',
					name: ''
				}
			},
			submitAuth() {
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
					const accountIndex = this.accounts.findIndex(
						item => item.email === email && item.password === password
					)
					if (accountIndex < 0) {
						uni.showToast({
							title: '账号或密码错误',
							icon: 'none'
						})
						return
					}
					this.activeAccountIndex = accountIndex
					this.isLoggedIn = true
					this.closeAuthPopup()
					uni.showToast({
						title: '登录成功',
						icon: 'success'
					})
					return
				}
				const name = (this.authForm.name || '').trim()
				if (!name) {
					uni.showToast({
						title: '请输入昵称',
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
				this.accounts.push({
					name,
					email,
					password,
					uid: `USER_${Date.now()}`,
					level: '普通用户',
					risk: '低风险',
					gender: '男',
					birthday: '',
					city: '',
					occupation: ''
				})
				this.activeAccountIndex = this.accounts.length - 1
				this.isLoggedIn = true
				this.closeAuthPopup()
				uni.showToast({
					title: '注册并登录成功',
					icon: 'success'
				})
			},
			switchAccount(index) {
				this.activeAccountIndex = index
				uni.showToast({
					title: '已切换账号',
					icon: 'none'
				})
			},
			logout() {
				if (!this.isLoggedIn) return
				this.isLoggedIn = false
				uni.showToast({
					title: '已退出登录',
					icon: 'none'
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
				},
				openAddAccountPopup() {
					this.addAccountForm = {
						name: '',
						email: '',
						password: ''
					}
					this.showAddAccountPopup = true
				},
				closeAddAccountPopup() {
					this.showAddAccountPopup = false
					this.addAccountForm = {
						name: '',
						email: '',
						password: ''
					}
				},
				submitAddAccount() {
					const name = (this.addAccountForm.name || '').trim()
					const email = (this.addAccountForm.email || '').trim()
					const password = (this.addAccountForm.password || '').trim()
					
					if (!name || !email || !password) {
						uni.showToast({
							title: '请输入昵称、邮箱和密码',
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
					
					// 检查邮箱是否已被使用
					const emailExists = this.accounts.some(item => item.email === email)
					if (emailExists) {
						uni.showToast({
							title: '该邮箱已被使用',
							icon: 'none'
						})
						return
					}
					
					// 添加新账号
					this.accounts.push({
						name,
						email,
						password,
						uid: `USER_${Date.now()}`,
						level: '普通用户',
						risk: '低风险',
						gender: '男',
						birthday: '',
						city: '',
						occupation: ''
					})
					
					this.closeAddAccountPopup()
					uni.showToast({
						title: '账号添加成功',
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
			submitEditProfile() {
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
				// 更新账号信息
			this.accounts[this.activeAccountIndex] = {
				...this.accounts[this.activeAccountIndex],
				name: name,
				email: email,
				avatar: this.editForm.avatar,
				gender: this.editForm.gender,
				birthday: this.editForm.birthday,
				city: this.editForm.city,
				occupation: this.editForm.occupation
			};
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
		cursor: pointer;
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
			align-items: center;
			justify-content: center;
			color: #fff;
			font-size: 24rpx;
		}

		.placeholder-text {
			font-size: 26rpx;
			color: #fff;
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

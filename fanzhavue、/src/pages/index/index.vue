<template>
	<view class="page" :class="{ 'theme-guardian': isGuardianTheme }">
		<view class="bg-glow"></view>
		<view class="status-holder" :style="headerInsetStyle"></view>
		<view class="top-brand" :style="headerBarStyle">
			<view class="brand-left">
				<view class="logo-dot">
					<image class="logo-dot-img" src="/static/智融反诈.png" mode="aspectFit" />
				</view>
				<view>
					<view class="brand-title">智融反诈</view>
					<view class="brand-sub">全方位反诈检测与防护</view>
				</view>
			</view>
		</view>

		<view class="search-box">
			<uni-icons type="search" size="20" color="#8B91A3"></uni-icons>
			<input class="search-input" v-model="searchText" placeholder="搜索风险号码/网址/输入项" confirm-type="search" @confirm="doSearch" />
			<text v-if="searchText" class="search-clear" @click="searchText = ''">
				<uni-icons type="close" size="16" color="#A4A9B5"></uni-icons>
			</text>
		</view>
		<view class="search-suggest">
			<text class="suggest" v-for="(item, i) in suggestList" :key="i" @click="applySuggest(item)">
				<uni-icons type="compass" size="14" color="#8B91A3"></uni-icons>
				{{ item }}
			</text>
		</view>

		<view class="detect-section">
			<view class="detect-card" hover-class="detect-card-hover" @click="goDetect">
				<view class="detect-icon">
					<view class="icon-circle">
						<image class="detect-main-icon" src="/static/首页智能反炸检测 .png" mode="aspectFit" />
					</view>
				</view>
				<view class="detect-content">
					<view class="detect-title">智能反诈检测</view>
					<view class="detect-desc">支持文字、图片、语音、视频全方位检测</view>
					<view class="detect-tags">
						<view class="detect-tag" v-for="(t, ti) in detectModalityTags" :key="ti">
							<image class="detect-tag-icon" :src="t.iconSrc" mode="aspectFit" />
							<text>{{ t.label }}</text>
						</view>
					</view>
				</view>
				<view class="detect-arrow">
					<uni-icons type="arrow-right" size="20" color="rgba(255,255,255,0.9)"></uni-icons>
				</view>
			</view>
		</view>


		<view class="panel glass-card">
			<view class="panel-head">
				<view class="panel-title">
					<image class="panel-title-icon" src="/static/视频 首页.png" mode="aspectFit" />
					典型诈骗案例科普
				</view>
				<view class="case-nav">
					<view class="nav-btn" @click="prevCase">
						<uni-icons type="left" size="18" color="#8E95A8"></uni-icons>
					</view>
					<text class="case-counter">{{ currentCaseIndex + 1 }} / {{ cases.length }}</text>
					<view class="nav-btn" @click="nextCase">
						<uni-icons type="right" size="18" color="#8E95A8"></uni-icons>
					</view>
				</view>
			</view>
			<view class="video-box" @click="openCase">
				<video
					id="caseVideo"
					class="case-video"
					:src="cases[currentCaseIndex].videoSrc"
					:poster="cases[currentCaseIndex].posterSrc || ''"
					object-fit="cover"
					show-center-play-btn
					controls
					@error="onCaseVideoError"
				></video>
			</view>
			<view class="video-content">
				<view class="video-title">{{ cases[currentCaseIndex].title }}</view>
				<view class="video-desc">{{ cases[currentCaseIndex].description }}</view>
				<view class="video-tags">
					<text class="video-tag" v-for="(tag, index) in cases[currentCaseIndex].tags" :key="index">{{ tag }}</text>
				</view>
			</view>
		</view>

		<view class="panel glass-card">
			<view class="panel-title">
					<image class="panel-title-icon" src="/static/反诈知识库 .png" mode="aspectFit" />
					反诈知识学习
				</view>
			<view class="learn-list">
				<view class="learn-item" v-for="(item, index) in docs" :key="index" @click="openDoc(item)">
					<view class="learn-icon">
						<image v-if="item.iconSrc" class="learn-icon-img" :src="item.iconSrc" mode="aspectFit" />
						<uni-icons v-else type="document" size="20" color="#8F96A8"></uni-icons>
					</view>
					<view class="learn-content">
						<text class="learn-name">{{ item.name }}</text>
					</view>
					<uni-icons type="right" size="16" color="#AAB3C7" class="learn-arrow"></uni-icons>
				</view>
			</view>
			<view class="refresh-bar" @click="refreshHome">
				<uni-icons type="refresh" size="16" color="#7F89A0"></uni-icons>
				上次更新：{{ lastRefresh }} · 点击刷新
			</view>
		</view>
	</view>
</template>

<script>
	import { getApiBaseUrl } from '@/utils/apiBase.js'

	export default {
		data() {
			return {
				searchText: '',
				// —— 冗余：本页模板未使用（旧问答/占位），保留备查 ——
				// question: '',
				// sending: false,
				lastRefresh: '刚刚',
				suggestList: ['风险号码查询', '兼职刷单', '冒充公检法'],
				detectModalityTags: [{
						label: '文字',
						iconSrc: '/static/文字.png'
					},
					{
						label: '图片',
						iconSrc: '/static/图片.png'
					},
					{
						label: '语音',
						iconSrc: '/static/语音.png'
					},
					{
						label: '视频',
						iconSrc: '/static/视频.png'
					}
				],
				// qaTags: ['如何识别诈骗？', '遇到诈骗怎么办？', '联系我们派出所是什么？'],
				// qaMessages: [{
				// 		role: 'ai',
				// 		text: '你好，我是智能助手。你可以问我关于反诈的问题！'
				// 	}
				// ],
				currentCaseIndex: 0,
				cases: [
					{
						title: '【冒充公检法】一个电话骗走老人养老金！',
						description: '骗子冒充公检法人员，以涉嫌洗钱为名，要求老人转账到安全账户',
						tags: ['音视频讲解', '高风险'],
						videoSrc: '',
						videoFallbackSrc: ''
					},
					{
						title: '【网络贷款诈骗】警惕低息贷款陷阱！',
						description: '无需抵押、秒到账？小心背后的骗局',
						tags: ['图文教程', '中风险'],
						videoSrc: '',
						videoFallbackSrc: ''
					},
					{
						title: '【刷单诈骗】轻松赚钱？小心本金不保！',
						description: '网上兼职刷单，先返小利后吞本金',
						tags: ['案例分析', '高风险'],
						videoSrc: '',
						videoFallbackSrc: ''
					},
					{
						title: '【虚假投资理财】高收益背后往往是陷阱',
						description: '以“稳赚不赔”为诱饵，诱导持续转账追加投资',
						tags: ['视频警示', '高风险'],
						videoSrc: '',
						videoFallbackSrc: ''
					}
				],

				docs: [{
						name: '反诈宣传视频',
						iconSrc: '/static/视频.png'
					},
					{
						name: '安全防范手册 (PDF)',
						iconSrc: '/static/pdf首页.png'
					},
					{
						name: '反诈指南 (PDF)',
						iconSrc: '/static/pdf首页.png'
					},
					{
						name: '常见问题 (PDF)',
						iconSrc: '/static/pdf首页.png'
					}
				],
				headerSafeBottomPx: 0,
				headerRightPadPx: 0,
				caseVideoContext: null
			}
		},
		computed: {
			headerInsetStyle() {
				if (this.headerSafeBottomPx > 0) {
					return { height: `${this.headerSafeBottomPx}px` }
				}
				return {}
			},
			headerBarStyle() {
				if (this.headerRightPadPx > 0) {
					return { paddingRight: `${this.headerRightPadPx}px` }
				}
				return {}
			}
		},
		onLoad() {
			this.applyNavSafeArea()
			this.initCaseVideoContext()
			this.initCaseVideoSources()
		},
		//安全区适配（防止返回页面时尺寸变化）
		onShow() {
			this.applyNavSafeArea()
		},
		methods: {
			initCaseVideoSources() {
				const base = getApiBaseUrl().replace(/\/+$/, '')
				this.cases = this.cases.map((item, idx) => {
					const name = `case${idx + 1}.mp4`
					return {
						...item,
						videoSrc: `${base}/data-assets/cases/${name}`,
						videoFallbackSrc: `/static/video/${name}`
					}
				})
			},
			initCaseVideoContext() {
				this.caseVideoContext = uni.createVideoContext('caseVideo', this)
			},
			//UI适配
			applyNavSafeArea() {
				const sys = uni.getSystemInfoSync() || {}
				const sb = Number(sys.statusBarHeight) || 20
				let safeBottom = 0
				let rightPad = 0
				// #ifdef MP-WEIXIN
				try {
					const menu = uni.getMenuButtonBoundingClientRect()
					if (menu && typeof menu.bottom === 'number' && menu.bottom > 0) {
						safeBottom = menu.bottom
					}
					if (menu && typeof menu.left === 'number' && typeof sys.windowWidth === 'number') {
						rightPad = Math.max(0, sys.windowWidth - menu.left + 8)
					}
				} catch (e) {}
				// #endif
				if (!safeBottom) {
					safeBottom = sb + 44
				}
				this.headerSafeBottomPx = safeBottom
				this.headerRightPadPx = rightPad
			},
			doSearch() {
				uni.showToast({
					title: this.searchText ? `搜索：${this.searchText}` : '请输入搜索内容',
					icon: 'none'
				})
			},
			applySuggest(item) {
				this.searchText = item
				this.doSearch()
			},
			// —— 冗余：本页模板未引用 ——
			// tapAction(card) {
			// 	uni.navigateTo({
			// 		url: card.url
			// 	})
			// },
			goDetect() {
				uni.navigateTo({
					url: '/pages/detect/index'
				})
			},
			// fillQuestion(text) {
			// 	this.question = text
			// },
			// sendQuestion() {
			// 	const value = this.question.trim()
			// 	if (!value || this.sending) {
			// 		uni.showToast({
			// 			title: '请输入问题',
			// 			icon: 'none'
			// 		})
			// 		return
			// 	}
			// 	this.qaMessages.push({
			// 		role: 'user',
			// 		text: value
			// 	})
			// 	this.question = ''
			// 	this.sending = true
			// 	setTimeout(() => {
			// 		this.qaMessages.push({
			// 			role: 'ai',
			// 			text: '已收到问题，建议先核验来电身份，不要回拨陌生链接号码。'
			// 		})
			// 		this.sending = false
			// 	}, 500)
			// },
			openDoc(item) {
				const doc = this.resolveDocSource(item)
				if (!doc) {
					uni.showToast({ title: '未找到文档', icon: 'none' })
					return
				}
				const base = getApiBaseUrl().replace(/\/+$/, '')
				const remoteUrl = `${base}${doc.remotePath}`
				uni.showLoading({
					title: '打开中...'
				})
				uni.downloadFile({
					url: remoteUrl,
					success: (res) => {
						if (res.statusCode !== 200 || !res.tempFilePath) {
							this.openLocalDocFallback(doc.localPath)
							return
						}
						uni.openDocument({
							filePath: res.tempFilePath,
							success: () => {
								uni.hideLoading()
								uni.showToast({
									title: '文档已打开',
									icon: 'success'
								})
							},
							fail: () => {
								this.openLocalDocFallback(doc.localPath)
							}
						})
					},
					fail: () => {
						this.openLocalDocFallback(doc.localPath)
					}
				})
			},
			resolveDocSource(item) {
				const name = String(item?.name || '')
				if (name.includes('安全防范手册')) {
					return {
						remotePath: '/data-assets/docs/anti-fraud-handbook.pdf',
						localPath: '/static/反诈宝典.pdf'
					}
				}
				if (name.includes('反诈指南')) {
					return {
						remotePath: '/data-assets/docs/anti-fraud-student.pdf',
						localPath: '/static/反诈宝典学生版.pdf'
					}
				}
				if (name.includes('常见问题')) {
					return {
						remotePath: '/data-assets/docs/anti-fraud-senior.pdf',
						localPath: '/static/反诈宝典老年人版.pdf'
					}
				}
				return null
			},
			openLocalDocFallback(localPath) {
				uni.openDocument({
					filePath: localPath,
					success: () => {
						uni.hideLoading()
						uni.showToast({
							title: '文档已打开',
							icon: 'success'
						})
					},
					fail: (err) => {
						uni.hideLoading()
						console.error('打开文档失败:', err)
						uni.showToast({
							title: '打开失败，请稍后重试',
							icon: 'none'
						})
					}
				})
			},
			prevCase() {
				this.currentCaseIndex = (this.currentCaseIndex - 1 + this.cases.length) % this.cases.length
				this.resetCaseVideo()
			},
			nextCase() {
				this.currentCaseIndex = (this.currentCaseIndex + 1) % this.cases.length
				this.resetCaseVideo()
			},
			openCase() {
				if (!this.caseVideoContext) {
					this.initCaseVideoContext()
				}
				this.caseVideoContext && this.caseVideoContext.play()
			},
			resetCaseVideo() {
				if (!this.caseVideoContext) {
					return
				}
				this.caseVideoContext.stop()
			},
			onCaseVideoError(e) {
				console.error('case video error', e)
				const current = this.cases[this.currentCaseIndex]
				if (current && current.videoFallbackSrc && current.videoSrc !== current.videoFallbackSrc) {
					const fallback = current.videoFallbackSrc
					this.cases.splice(this.currentCaseIndex, 1, {
						...current,
						videoSrc: fallback
					})
					uni.showToast({
						title: '尝试备用视频路径...',
						icon: 'none'
					})
					return
				}
				uni.showToast({
					title: '视频播放失败，请检查编码格式',
					icon: 'none'
				})
			},
			// —— 冗余：本页模板未引用（原 Tab 跳转预留）——
			// goKnowledge() {
			// 	uni.switchTab({
			// 		url: '/pages/knowledge/index'
			// 	})
			// },
			// goAssistant() {
			// 	uni.switchTab({
			// 		url: '/pages/assistant/index'
			// 	})
			// },
			refreshHome() {
				const now = new Date()
				this.lastRefresh = `${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`
				uni.showToast({
					title: '首页内容已刷新',
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
		padding: 24rpx 28rpx calc(60rpx + env(safe-area-inset-bottom));
		padding-left: calc(28rpx + env(safe-area-inset-left));
		padding-right: calc(28rpx + env(safe-area-inset-right));
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
		flex-shrink: 0;
	}

	.top-brand {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 20rpx;
		min-height: 72rpx;
		box-sizing: border-box;
	}

	.brand-left {
		display: flex;
		align-items: center;
		gap: 16rpx;
		flex: 1;
		min-width: 0;
		padding-right: 16rpx;
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

	.search-box {
		height: 96rpx;
		background: rgba(255, 255, 255, 0.95);
		border-radius: 28rpx;
		padding: 0 28rpx;
		display: flex;
		align-items: center;
		box-shadow: 0 8rpx 20rpx rgba(27, 42, 91, 0.08);
		border: 1px solid #e8edf7;
	}

	.search-input {
		flex: 1;
		margin-left: 16rpx;
		font-size: 28rpx;
	}

	.search-clear {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 8rpx;
	}

	.search-suggest {
		display: flex;
		gap: 12rpx;
		margin-top: 14rpx;
		flex-wrap: wrap;
	}

	.suggest {
		background: rgba(255, 255, 255, 0.9);
		padding: 10rpx 18rpx;
		border-radius: 999rpx;
		font-size: 22rpx;
		color: #617191;
		display: flex;
		align-items: center;
		gap: 8rpx;
		box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.04);
	}

	.detect-section {
		margin-top: 28rpx;
	}

	.detect-card {
		border-radius: 32rpx;
		padding: 40rpx 36rpx;
		color: #fff;
		box-shadow: 0 14rpx 30rpx rgba(47, 100, 245, 0.2);
		position: relative;
		overflow: hidden;
		display: flex;
		align-items: center;
		gap: 24rpx;
		background: linear-gradient(135deg, #4f94ff 0%, #2f64f5 100%);
	}

	.detect-card-hover {
		opacity: 0.96;
	}

	.detect-icon {
		position: relative;
		z-index: 1;
		flex-shrink: 0;
	}

	.icon-circle {
		width: 120rpx;
		height: 120rpx;
		border-radius: 50%;
		background: rgba(255, 255, 255, 0.25);
		backdrop-filter: blur(10px);
		display: flex;
		align-items: center;
		justify-content: center;
		box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.15);
	}

	.detect-main-icon {
		width: 72rpx;
		height: 72rpx;
	}

	.detect-content {
		position: relative;
		z-index: 1;
		flex: 1;
	}

	.detect-title {
		font-size: 36rpx;
		font-weight: 700;
		margin-bottom: 8rpx;
	}

	.detect-desc {
		font-size: 24rpx;
		opacity: 0.9;
		margin-bottom: 16rpx;
	}

	.detect-tags {
		display: flex;
		gap: 10rpx;
		flex-wrap: wrap;
	}

	.detect-tag {
		background: rgba(255, 255, 255, 0.25);
		padding: 6rpx 14rpx 6rpx 10rpx;
		border-radius: 999rpx;
		font-size: 20rpx;
		font-weight: 500;
		backdrop-filter: blur(4px);
		display: inline-flex;
		align-items: center;
		gap: 6rpx;
	}

	.detect-tag-icon {
		width: 28rpx;
		height: 28rpx;
		flex-shrink: 0;
	}

	.detect-arrow {
		position: relative;
		z-index: 1;
		flex-shrink: 0;
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

	.panel-title-icon {
		width: 40rpx;
		height: 40rpx;
		flex-shrink: 0;
	}

	.head-more {
		color: #8e95a8;
		font-size: 24rpx;
		display: flex;
		align-items: center;
		gap: 6rpx;
	}

	.case-nav {
		display: flex;
		align-items: center;
		gap: 10rpx;
	}

	.nav-btn {
		width: 48rpx;
		height: 48rpx;
		border-radius: 12rpx;
		background: #f5f7fb;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.case-counter {
		font-size: 22rpx;
		color: #7f89a0;
		font-weight: 500;
		min-width: 80rpx;
		text-align: center;
	}

	/* ========== 冗余：本页模板已移除智能助手区块，以下样式保留备查 ========== */
	// .qa-tags {
	// 	display: flex;
	// 	gap: 12rpx;
	// 	margin: 16rpx 0 0;
	// 	flex-wrap: wrap;
	// }
	//
	// .qa-tag {
	// 	background: #eef4ff;
	// 	color: #2f64f5;
	// 	font-size: 23rpx;
	// 	padding: 10rpx 18rpx;
	// 	border-radius: 999rpx;
	// 	font-weight: 500;
	// }
	//
	// // 智能助手：消息区可滚动，输入栏贴卡片底部
	// .qa-chat-panel {
	// 	display: flex;
	// 	flex-direction: column;
	// 	min-height: 480rpx;
	// 	padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
	// 	box-sizing: border-box;
	// }
	//
	// .qa-chat-body {
	// 	display: flex;
	// 	flex-direction: column;
	// 	flex: 1;
	// 	min-height: 0;
	// 	margin-top: 12rpx;
	// }
	//
	// .qa-messages-scroll {
	// 	flex: 1;
	// 	height: 0;
	// 	min-height: 200rpx;
	// 	max-height: 420rpx;
	// 	width: 100%;
	// }
	//
	// .qa-messages-inner {
	// 	padding-bottom: 8rpx;
	// }
	//
	// .qa-message {
	// 	display: flex;
	// 	align-items: flex-start;
	// 	gap: 12rpx;
	// 	margin-bottom: 14rpx;
	// }
	//
	// .message-avatar {
	// 	width: 44rpx;
	// 	height: 44rpx;
	// 	border-radius: 50%;
	// 	background: linear-gradient(135deg, #4ade80, #22c55e);
	// 	display: flex;
	// 	align-items: center;
	// 	justify-content: center;
	// 	flex-shrink: 0;
	// }
	//
	// .message-avatar-ai {
	// 	background: #e8f0ff;
	// 	overflow: hidden;
	// }
	//
	// .message-avatar-img {
	// 	width: 40rpx;
	// 	height: 40rpx;
	// }
	//
	// .user-avatar {
	// 	background: linear-gradient(135deg, #4f94ff, #2f64f5);
	// }
	//
	// .qa-message.user {
	// 	flex-direction: row-reverse;
	// }
	//
	// .qa-bubble {
	// 	background: #f2f6ff;
	// 	padding: 16rpx 20rpx;
	// 	border-radius: 18rpx;
	// 	font-size: 25rpx;
	// 	color: #2f3650;
	// 	line-height: 1.6;
	// 	max-width: 75%;
	// }
	//
	// .qa-bubble.ai {
	// 	border-bottom-left-radius: 4rpx;
	// }
	//
	// .qa-bubble.user {
	// 	background: linear-gradient(135deg, #4f94ff, #2f64f5);
	// 	color: #ffffff;
	// 	border-bottom-right-radius: 4rpx;
	// }
	//
	// .loading-indicator {
	// 	display: flex;
	// 	align-items: center;
	// 	padding: 16rpx 0;
	// }
	//
	// .loading-dots {
	// 	display: flex;
	// 	gap: 6rpx;
	// }
	//
	// .loading-dots view {
	// 	width: 12rpx;
	// 	height: 12rpx;
	// 	background: #2f64f5;
	// 	border-radius: 50%;
	// 	animation: bounce 1.4s infinite ease-in-out both;
	// }
	//
	// .loading-dots view:nth-child(1) {
	// 	animation-delay: -0.32s;
	// }
	//
	// .loading-dots view:nth-child(2) {
	// 	animation-delay: -0.16s;
	// }
	//
	// /* 冗余块内keyframes：与上方 loading 配对，首页未用时可整块恢复 */
	// @keyframes bounce {
	// 	0%, 80%, 100% {
	// 		transform: scale(0);
	// 	}
	// 	40% {
	// 		transform: scale(1);
	// 	}
	// }
	//
	// .qa-chat-body .ask-row {
	// 	margin-top: auto;
	// 	padding-top: 16rpx;
	// 	flex-shrink: 0;
	// }
	//
	// .ask-row {
	// 	display: flex;
	// 	align-items: center;
	// 	gap: 14rpx;
	// }
	//
	// .ask-input {
	// 	flex: 1;
	// 	background: #f5f7fb;
	// 	border-radius: 20rpx;
	// 	height: 84rpx;
	// 	padding: 0 24rpx;
	// 	font-size: 27rpx;
	// 	border: 1px solid #e8edf7;
	// }
	//
	// .send-btn {
	// 	background: linear-gradient(135deg, #4f94ff, #2f64f5);
	// 	color: #fff;
	// 	border-radius: 16rpx;
	// 	padding: 0 24rpx;
	// 	font-size: 24rpx;
	// 	height: 72rpx;
	// 	display: flex;
	// 	align-items: center;
	// 	justify-content: center;
	// 	gap: 8rpx;
	// 	box-shadow: 0 8rpx 20rpx rgba(79, 172, 254, 0.3);
	// }
	//
	// .send-btn[disabled] {
	// 	opacity: 0.6;
	// }

	.video-box {
		margin-top: 20rpx;
		height: 320rpx;
		border-radius: 28rpx;
		background: #000;
		position: relative;
		overflow: hidden;
	}

	.case-video {
		width: 100%;
		height: 100%;
	}

	.video-content {
		margin-top: 18rpx;
	}

	.video-title {
		font-size: 34rpx;
		font-weight: 700;
		color: #1f2a44;
		line-height: 1.4;
	}

	.video-desc {
		font-size: 27rpx;
		color: #5d6a8a;
		margin-top: 12rpx;
		line-height: 1.6;
	}

	.video-tags {
		display: flex;
		gap: 10rpx;
		margin-top: 14rpx;
		flex-wrap: wrap;
	}

	.video-tag {
		background: #eef4ff;
		color: #2f64f5;
		font-size: 20rpx;
		padding: 6rpx 14rpx;
		border-radius: 999rpx;
		font-weight: 500;
	}

	.learn-list {
		margin-top: 12rpx;
	}

	.learn-item {
		font-size: 28rpx;
		color: #3b445f;
		padding: 24rpx 0;
		border-bottom: 1px solid #f0f2f7;
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 20rpx;
	}

	.learn-item:last-child {
		border-bottom: 0;
	}

	.learn-icon {
		width: 52rpx;
		height: 52rpx;
		border-radius: 14rpx;
		background: #f5f7fb;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}

	.learn-icon-img {
		width: 36rpx;
		height: 36rpx;
	}

	.learn-content {
		flex: 1;
		display: flex;
		align-items: center;
		min-width: 0;
	}

	.learn-name {
		font-weight: 500;
		color: #1f2a44;
	}

	.learn-arrow {
		flex-shrink: 0;
	}

	.refresh-bar {
		margin-top: 14rpx;
		font-size: 20rpx;
		color: #7f89a0;
		text-align: center;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8rpx;
		padding: 12rpx 0;
	}

</style>

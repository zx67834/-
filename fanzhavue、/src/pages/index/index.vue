<template>
	<view class="page">
		<view class="bg-glow"></view>
		<view class="status-holder"></view>
		<view class="top-brand fade-up">
			<view class="brand-left">
				<view class="logo-dot">
					<view class="logo-icon">🛡️</view>
				</view>
				<view>
					<view class="brand-title">示例科技</view>
					<view class="brand-sub">AI反诈助手平台</view>
				</view>
			</view>
			<view class="brand-right">
				<view class="notification-badge">
					<uni-icons type="notification" size="20" color="#617191"></uni-icons>
				</view>
			</view>
		</view>

		<view class="search-box fade-up">
			<uni-icons type="search" size="20" color="#8B91A3"></uni-icons>
			<input class="search-input" v-model="searchText" placeholder="搜索风险号码/网址/输入项" confirm-type="search" @confirm="doSearch" />
			<text v-if="searchText" class="search-clear" @click="searchText = ''">
				<uni-icons type="close" size="16" color="#A4A9B5"></uni-icons>
			</text>
		</view>
		<view class="search-suggest fade-up">
			<text class="suggest" v-for="(item, i) in suggestList" :key="i" @click="applySuggest(item)">
				<uni-icons type="compass" size="14" color="#8B91A3"></uni-icons>
				{{ item }}
			</text>
		</view>

		<view class="quick-grid fade-up">
			<view v-for="(card, index) in quickCards" :key="card.title" class="quick-card" :class="card.theme" hover-class="quick-card-hover"
				@click="tapAction(card)">
				<view class="card-icon">
					<img :src="card.icon" mode="aspectFill" style="width: 60rpx; height: 60rpx;" />
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

		<view class="panel fade-up glass-card">
			<view class="panel-head">
				<view class="panel-title">
					<uni-icons type="chatbubble" size="20" color="#2f64f5"></uni-icons>
					智能助手问答
				</view>
				<text class="head-more" @click="goAssistant">
					进入会话
					<uni-icons type="arrow-right" size="14" color="#8E95A8"></uni-icons>
				</text>
			</view>
			<view class="qa-tags">
				<text class="qa-tag" v-for="(tag, index) in qaTags" :key="index" @click="fillQuestion(tag)">
					{{ tag }}
				</text>
			</view>
			<view class="qa-messages">
				<view class="qa-message" v-for="(m, idx) in qaMessages" :key="idx" :class="m.role">
					<view class="message-avatar" v-if="m.role === 'ai'">
						<uni-icons type="person" size="16" color="white"></uni-icons>
					</view>
					<view class="qa-bubble" :class="m.role">{{ m.text }}</view>
					<view class="message-avatar user-avatar" v-if="m.role === 'user'">
						<uni-icons type="person" size="16" color="white"></uni-icons>
					</view>
				</view>
				<view v-if="sending" class="loading-indicator">
					<view class="loading-dots">
						<view></view>
						<view></view>
						<view></view>
					</view>
				</view>
			</view>
			<view class="ask-row">
				<input v-model="question" class="ask-input" placeholder="请输入您的问题..." confirm-type="send" @confirm="sendQuestion" />
				<button class="send-btn" size="mini" :disabled="sending" @click="sendQuestion">
					<uni-icons type="paperplane" size="16" color="white"></uni-icons>
				</button>
			</view>
		</view>

		<view class="panel fade-up glass-card">
			<view class="panel-head">
				<view class="panel-title">
					<uni-icons type="play" size="20" color="#2f64f5"></uni-icons>
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
				<view class="play-overlay">
					<view class="play-btn">
						<uni-icons type="play" size="28" color="white"></uni-icons>
					</view>
				</view>
			</view>
			<view class="video-content">
				<view class="video-title">{{ cases[currentCaseIndex].title }}</view>
				<view class="video-desc">{{ cases[currentCaseIndex].description }}</view>
				<view class="video-tags">
					<text class="video-tag" v-for="(tag, index) in cases[currentCaseIndex].tags" :key="index">{{ tag }}</text>
				</view>
			</view>
		</view>

		<view class="panel fade-up glass-card">
			<view class="panel-title">
					<uni-icons type="book" size="20" color="#2f64f5"></uni-icons>
					反诈知识学习
				</view>
			<view class="learn-list">
				<view class="learn-item" v-for="(item, index) in docs" :key="index" @click="openDoc(item)">
					<view class="learn-icon">
						<uni-icons type="document" size="20" :color="item.read ? '#22C55E' : '#8F96A8'"></uni-icons>
					</view>
					<view class="learn-content">
						<text class="learn-name">{{ item.name }}</text>
						<text class="learn-status" :class="{ read: item.read }">{{ item.read ? '已读' : '未读' }}</text>
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
	export default {
		data() {
			return {
				searchText: '',
				question: '',
				sending: false,
				lastRefresh: '刚刚',
				suggestList: ['风险号码查询', '兼职刷单', '冒充公检法'],
				qaTags: ['如何识别诈骗?', '遇到诈骗怎么办?', '联系客服'],
				qaMessages: [{
						role: 'ai',
						text: '你好，我是智能助手。你可以问我关于反诈的问题！'
					}
				],
				currentCaseIndex: 0,
				cases: [
					{
						title: '【冒充公检法】一个电话骗走老人养老金！',
						description: '骗子冒充公检法人员，以涉嫌洗钱为名，要求老人转账到安全账户',
						tags: ['音视频讲解', '高风险']
					},
					{
						title: '【网络贷款诈骗】警惕低息贷款陷阱！',
						description: '无需抵押、秒到账？小心背后的骗局',
						tags: ['图文教程', '中风险']
					},
					{
						title: '【刷单诈骗】轻松赚钱？小心本金不保！',
						description: '网上兼职刷单，先返小利后吞本金',
						tags: ['案例分析', '高风险']
					}
				],
				quickCards: [{
						title: '文字反诈检测',
						desc: '输入文字即可检测',
						theme: 'pink',
						icon: '/static/文字.png',
						url: '/pages/detect/index?type=text'
					},
					{
						title: '图片反诈检测',
						desc: '上传图片识别',
						theme: 'blue',
						icon: '/static/图片.png',
						url: '/pages/detect/index?type=image'
					},
					{
						title: '语音反诈检测',
						desc: '上传语音识别',
						theme: 'pink',
						icon: '/static/语音.png',
						url: '/pages/detect/index?type=voice'
					},
					{
						title: '视频反诈分析',
						desc: '上传视频分析',
						theme: 'blue',
						icon: '/static/视频.png',
						url: '/pages/detect/index?type=video'
					}
				],
				docs: [{
						name: '反诈宣传视频',
						read: false
					},
					{
						name: '安全防范手册 (PDF)',
						read: false
					},
					{
						name: '反诈指南 (PDF)',
						read: true
					},
					{
						name: '常见问题 (PDF)',
						read: false
					}
				]
			}
		},
		onLoad() {
			// 从本地存储加载文档阅读状态
			const savedDocs = uni.getStorageSync('docs');
			if (savedDocs) {
				this.docs = savedDocs;
			}
		},
		watch: {
			docs: {
				handler(newDocs) {
					// 当文档状态变化时保存到本地存储
					try {
						uni.setStorageSync('docs', newDocs);
					} catch (e) {
						console.error('保存文档状态失败:', e);
					}
				},
				depth: 2
			}
		},
		methods: {
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
			tapAction(card) {
				uni.navigateTo({
					url: card.url
				})
			},
			fillQuestion(text) {
				this.question = text
			},
			sendQuestion() {
				const value = this.question.trim()
				if (!value || this.sending) {
					uni.showToast({
						title: '请输入问题',
						icon: 'none'
					})
					return
				}
				this.qaMessages.push({
					role: 'user',
					text: value
				})
				this.question = ''
				this.sending = true
				setTimeout(() => {
					this.qaMessages.push({
						role: 'ai',
						text: '已收到问题，建议先核验来电身份，不要回拨陌生链接号码。'
					})
					this.sending = false
				}, 500)
			},
			openDoc(item) {
				item.read = true
				uni.showToast({
					title: `${item.name} 已打开`,
					icon: 'none'
				})
			},
			prevCase() {
				this.currentCaseIndex = (this.currentCaseIndex - 1 + this.cases.length) % this.cases.length
			},
			nextCase() {
				this.currentCaseIndex = (this.currentCaseIndex + 1) % this.cases.length
			},
			openCase() {
				uni.showToast({
					title: '案例播放中',
					icon: 'none'
				})
			},
			goKnowledge() {
				uni.switchTab({
					url: '/pages/knowledge/index'
				})
			},
			goAssistant() {
				uni.switchTab({
					url: '/pages/assistant/index'
				})
			},
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

	.search-box {
		height: 96rpx;
		background: rgba(255, 255, 255, 0.95);
		border-radius: 28rpx;
		padding: 0 28rpx;
		display: flex;
		align-items: center;
		box-shadow: 0 16rpx 40rpx rgba(27, 42, 91, 0.12);
		border: 1px solid rgba(230, 235, 245, 0.8);
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
		transition: transform 0.2s ease, box-shadow 0.2s ease;
		box-shadow: 0 20rpx 40rpx rgba(0, 0, 0, 0.18);
		position: relative;
		overflow: hidden;
		display: flex;
		flex-direction: column;
		gap: 16rpx;
		min-height: 200rpx;
	}

	.card-icon {
		font-size: 52rpx;
		margin-bottom: 8rpx;
	}

	.quick-content {
		flex: 1;
	}

	.card-arrow {
		align-self: flex-end;
		margin-top: auto;
	}

	.quick-card::before {
		content: '';
		position: absolute;
		top: -50%;
		left: -50%;
		width: 200%;
		height: 200%;
		background: linear-gradient(45deg, rgba(255, 255, 255, 0.12), rgba(255, 255, 255, 0) 60%);
		transform: rotate(45deg);
		transition: transform 0.6s ease;
	}

	.quick-card-hover {
		transform: scale(0.97) translateY(-4rpx);
		box-shadow: 0 20rpx 40rpx rgba(0, 0, 0, 0.2);
	}

	.quick-card.pink {
		background: linear-gradient(135deg, #ff6b6b, #ee5a6f);
	}

	.quick-card.blue {
		background: linear-gradient(135deg, #4facfe, #00f2fe);
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

	.qa-tags {
		display: flex;
		gap: 12rpx;
		margin: 16rpx 0;
		flex-wrap: wrap;
	}

	.qa-tag {
		background: linear-gradient(135deg, #e8f0ff, #dbe8ff);
		color: #2f64f5;
		font-size: 23rpx;
		padding: 10rpx 18rpx;
		border-radius: 999rpx;
		font-weight: 500;
	}

	.qa-messages {
		margin-top: 12rpx;
	}

	.qa-message {
		display: flex;
		align-items: flex-start;
		gap: 12rpx;
		margin-bottom: 14rpx;
	}

	.message-avatar {
		width: 44rpx;
		height: 44rpx;
		border-radius: 50%;
		background: linear-gradient(135deg, #4ade80, #22c55e);
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}

	.user-avatar {
		background: linear-gradient(135deg, #4facfe, #00f2fe);
	}

	.qa-message.user {
		flex-direction: row-reverse;
	}

	.qa-bubble {
		background: #f2f6ff;
		padding: 16rpx 20rpx;
		border-radius: 18rpx;
		font-size: 25rpx;
		color: #2f3650;
		line-height: 1.6;
		max-width: 75%;
	}

	.qa-bubble.ai {
		border-bottom-left-radius: 4rpx;
	}

	.qa-bubble.user {
		background: linear-gradient(135deg, #4facfe, #00f2fe);
		color: #ffffff;
		border-bottom-right-radius: 4rpx;
	}

	.loading-indicator {
		display: flex;
		align-items: center;
		padding: 16rpx 0;
	}

	.loading-dots {
		display: flex;
		gap: 6rpx;
	}

	.loading-dots view {
		width: 12rpx;
		height: 12rpx;
		background: #2f64f5;
		border-radius: 50%;
		animation: bounce 1.4s infinite ease-in-out both;
	}

	.loading-dots view:nth-child(1) {
		animation-delay: -0.32s;
	}

	.loading-dots view:nth-child(2) {
		animation-delay: -0.16s;
	}

	@keyframes bounce {
		0%, 80%, 100% {
			transform: scale(0);
		}
		40% {
			transform: scale(1);
		}
	}

	.ask-row {
		margin-top: 18rpx;
		display: flex;
		align-items: center;
		gap: 14rpx;
	}

	.ask-input {
		flex: 1;
		background: #f5f7fb;
		border-radius: 20rpx;
		height: 84rpx;
		padding: 0 24rpx;
		font-size: 27rpx;
		border: 1px solid #e8edf7;
	}

	.send-btn {
		background: linear-gradient(135deg, #4facfe, #00f2fe);
		color: #fff;
		border-radius: 16rpx;
		padding: 0 24rpx;
		font-size: 24rpx;
		height: 72rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8rpx;
		box-shadow: 0 8rpx 20rpx rgba(79, 172, 254, 0.3);
	}

	.send-btn[disabled] {
		opacity: 0.6;
	}

	.video-box {
		margin-top: 20rpx;
		height: 320rpx;
		border-radius: 28rpx;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		position: relative;
		overflow: hidden;
	}

	.play-overlay {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.2);
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.play-btn {
		width: 120rpx;
		height: 120rpx;
		border-radius: 50%;
		background: rgba(255, 255, 255, 0.3);
		backdrop-filter: blur(10px);
		display: flex;
		align-items: center;
		justify-content: center;
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
		background: linear-gradient(135deg, #e8f0ff, #dbe8ff);
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

	.learn-content {
		flex: 1;
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.learn-name {
		font-weight: 500;
		color: #1f2a44;
	}

	.learn-status {
		font-size: 20rpx;
		color: #8f96a8;
		padding: 4rpx 12rpx;
		border-radius: 999rpx;
		background: #f5f7fb;
	}

	.learn-status.read {
		color: #22c55e;
		background: rgba(34, 197, 94, 0.1);
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

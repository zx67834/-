<template>
	<view class="page">
		<view class="bg-glow"></view>
		<view class="status-holder"></view>
		<view class="top-brand fade-up">
			<view class="brand-left">
				<view class="logo-dot"></view>
				<view>
					<view class="brand-title">示例科技</view>
					<view class="brand-sub">AI反诈助手平台</view>
				</view>
			</view>
		</view>

		<view class="search-box fade-up">
			<uni-icons type="search" size="18" color="#A4A9B5"></uni-icons>
			<input class="search-input" v-model="searchText" placeholder="搜索入手号/手机号/输入项" confirm-type="search" @confirm="doSearch" />
			<text v-if="searchText" class="search-clear" @click="searchText = ''">清空</text>
		</view>
		<view class="search-suggest fade-up">
			<text class="suggest" v-for="(item, i) in suggestList" :key="i" @click="applySuggest(item)">{{ item }}</text>
		</view>

		<view class="quick-grid fade-up">
			<view v-for="card in quickCards" :key="card.title" class="quick-card" :class="card.theme" hover-class="quick-card-hover"
				@click="tapAction(card)">
				<view class="quick-title">{{ card.title }}</view>
				<view class="quick-sub">{{ card.desc }}</view>
			</view>
		</view>

		<view class="panel fade-up glass-card">
			<view class="panel-head">
				<view class="panel-title">智能助手问答</view>
				<text class="head-more" @click="goAssistant">进入会话</text>
			</view>
			<view class="qa-tags">
				<text class="qa-tag" @click="fillQuestion('如何识别诈骗?')">如何识别诈骗?</text>
				<text class="qa-tag soft" @click="fillQuestion('联系客服')">联系客服</text>
			</view>
			<view class="qa-bubble" v-for="(m, idx) in qaMessages" :key="idx" :class="m.role">
				{{ m.text }}
			</view>
			<view class="ask-row">
				<input v-model="question" class="ask-input" placeholder="请输入您的问题，例如：如何防范电信诈..." confirm-type="send" @confirm="sendQuestion" />
				<button class="send-btn" size="mini" :disabled="sending" @click="sendQuestion">{{ sending ? '发送中' : '发送' }}</button>
			</view>
		</view>

		<view class="panel fade-up glass-card">
			<view class="panel-head">
				<view class="panel-title">典型诈骗案例科普</view>
				<text class="head-more" @click="goKnowledge">更多</text>
			</view>
			<view class="video-box" @click="openCase"></view>
			<view class="video-title">【冒充公检法】一个电话骗走老人养老金！</view>
		</view>

		<view class="panel fade-up glass-card">
			<view class="panel-title">反诈知识学习</view>
			<view class="learn-item" v-for="item in docs" :key="item.name" @click="openDoc(item)">
				<text>{{ item.name }}</text>
				<text class="learn-status">{{ item.read ? '已读' : '未读' }}</text>
			</view>
			<view class="refresh-bar" @click="refreshHome">上次更新：{{ lastRefresh }} · 点击刷新</view>
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
				qaMessages: [{
						role: 'ai',
						text: '你好，我是智能助手。你可以问：如何识别诈骗？'
					}
				],
				quickCards: [{
						title: '文字反诈检测',
						desc: '输入文字即可检测',
						theme: 'pink',
						url: '/pages/detect/index?type=text'
					},
					{
						title: '图片反诈检测',
						desc: '上传图片识别',
						theme: 'blue',
						url: '/pages/detect/index?type=image'
					},
					{
						title: '语音反诈检测',
						desc: '上传语音识别',
						theme: 'pink',
						url: '/pages/detect/index?type=voice'
					},
					{
						title: '视频反诈检测',
						desc: '上传视频分析',
						theme: 'blue',
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
		padding: 20rpx 20rpx 44rpx;
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
		background: radial-gradient(circle, rgba(110, 157, 255, 0.22), rgba(110, 157, 255, 0));
		pointer-events: none;
	}

	.status-holder {
		height: calc(var(--status-bar-height) + 8rpx);
	}

	.top-brand {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 16rpx;
	}

	.brand-left {
		display: flex;
		align-items: center;
		gap: 14rpx;
	}

	.logo-dot {
		width: 50rpx;
		height: 50rpx;
		border-radius: 16rpx;
		background: linear-gradient(145deg, #5fa4ff, #2468ff);
		box-shadow: 0 10rpx 24rpx rgba(47, 128, 255, 0.25);
	}

	.brand-title {
		font-size: 30rpx;
		font-weight: 700;
		color: #1f2a44;
	}

	.brand-sub {
		font-size: 20rpx;
		color: #8f96a8;
		margin-top: 2rpx;
	}

	.search-box {
		height: 76rpx;
		background: rgba(255, 255, 255, 0.9);
		border-radius: 20rpx;
		padding: 0 24rpx;
		display: flex;
		align-items: center;
		box-shadow: 0 12rpx 26rpx rgba(27, 42, 91, 0.08);
		border: 1px solid rgba(255, 255, 255, 0.9);
	}

	.search-input {
		flex: 1;
		margin-left: 12rpx;
		font-size: 26rpx;
	}

	.search-clear {
		font-size: 22rpx;
		color: #8b91a3;
	}

	.search-suggest {
		display: flex;
		gap: 10rpx;
		margin-top: 10rpx;
	}

	.suggest {
		background: rgba(255, 255, 255, 0.8);
		padding: 6rpx 14rpx;
		border-radius: 999rpx;
		font-size: 21rpx;
		color: #617191;
	}

	.quick-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 16rpx;
		margin-top: 18rpx;
	}

	.quick-card {
		border-radius: 20rpx;
		padding: 24rpx 20rpx;
		color: #fff;
		transition: transform 0.2s ease, box-shadow 0.2s ease;
		box-shadow: 0 14rpx 28rpx rgba(0, 0, 0, 0.13);
		position: relative;
		overflow: hidden;
	}

	.quick-card::before {
		content: '';
		position: absolute;
		top: -50%;
		left: -50%;
		width: 200%;
		height: 200%;
		background: linear-gradient(45deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0) 70%);
		transform: rotate(45deg);
		transition: transform 0.6s ease;
	}

	.quick-card:hover::before {
		transform: rotate(45deg) translateX(100%);
	}

	.quick-card-hover {
		transform: scale(0.985) translateY(-2rpx);
		box-shadow: 0 18rpx 36rpx rgba(0, 0, 0, 0.18);
	}

	.quick-card.pink {
		background: linear-gradient(135deg, #ff6c99, #e44986);
	}

	.quick-card.blue {
		background: linear-gradient(135deg, #4f94ff, #2f6fff);
	}

	.quick-title {
		font-size: 30rpx;
		font-weight: 700;
	}

	.quick-sub {
		font-size: 22rpx;
		margin-top: 8rpx;
		opacity: 0.92;
	}

	.panel {
		margin-top: 16rpx;
		border-radius: 20rpx;
		padding: 22rpx;
	}

	.panel-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.panel-title {
		font-size: 30rpx;
		font-weight: 700;
		color: #1f2a44;
	}

	.head-more {
		color: #8e95a8;
		font-size: 24rpx;
	}

	.qa-tags {
		display: flex;
		gap: 12rpx;
		margin: 14rpx 0;
	}

	.qa-tag {
		background: #e8f0ff;
		color: #2f80ff;
		font-size: 22rpx;
		padding: 8rpx 14rpx;
		border-radius: 999rpx;
	}

	.qa-tag.soft {
		background: #f1f4f9;
		color: #8b91a3;
	}

	.qa-bubble {
		background: #f2f6ff;
		padding: 16rpx;
		border-radius: 14rpx;
		font-size: 24rpx;
		color: #2f3650;
		line-height: 1.6;
		margin-bottom: 10rpx;
	}

	.qa-bubble.user {
		background: #e9f0ff;
		color: #2a4a86;
	}

	.ask-row {
		margin-top: 14rpx;
		display: flex;
		align-items: center;
		gap: 12rpx;
	}

	.ask-input {
		flex: 1;
		background: #f5f7fb;
		border-radius: 14rpx;
		height: 68rpx;
		padding: 0 18rpx;
		font-size: 24rpx;
	}

	.send-btn {
		background: linear-gradient(135deg, #3f8cff, #2877ff);
		color: #fff;
		border-radius: 14rpx;
		padding: 0 22rpx;
		font-size: 24rpx;
	}

	.send-btn[disabled] {
		opacity: 0.75;
	}

	.video-box {
		margin-top: 14rpx;
		height: 220rpx;
		border-radius: 16rpx;
		background: linear-gradient(145deg, #dbe8ff, #c6dbff);
	}

	.video-title {
		font-size: 28rpx;
		font-weight: 600;
		color: #1f2a44;
		margin-top: 14rpx;
	}

	.learn-item {
		font-size: 25rpx;
		color: #3b445f;
		padding: 12rpx 0;
		border-bottom: 1px solid #f0f2f7;
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.learn-item:last-child {
		border-bottom: 0;
	}

	.learn-status {
		font-size: 20rpx;
		color: #8f96a8;
	}

	.refresh-bar {
		margin-top: 10rpx;
		font-size: 20rpx;
		color: #7f89a0;
		text-align: center;
	}

	.fade-up {
		animation: fadeUp 0.45s ease both;
	}

	@keyframes fadeUp {
		from {
			opacity: 0;
			transform: translateY(12rpx);
		}

		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
</style>

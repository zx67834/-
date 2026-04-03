<template>
	<view class="page">
		<view class="bg-glow"></view>
		<view class="header">
			<view class="back-btn" @click="goBack">
				<uni-icons type="back" size="24" color="#333"></uni-icons>
			</view>
			<view class="header-title">知识详情</view>
			<view class="placeholder"></view>
		</view>

		<view v-if="loading" class="loading">
			<uni-icons type="spinner" size="32" color="#2f80ff" animation="spin"></uni-icons>
			<text>加载中...</text>
		</view>

		<view v-else-if="knowledge" class="content">
			<view class="title">{{ knowledge.title }}</view>
			<view class="meta">
				<view class="tag">{{ knowledge.category }}</view>
				<view class="source">{{ knowledge.source }}</view>
				<view class="time">更新时间：{{ formatDate(knowledge.updatedAt) }}</view>
			</view>

			<view class="section">
				<view class="section-title">描述</view>
				<view class="section-content">{{ knowledge.description }}</view>
			</view>

			<view class="section">
				<view class="section-title">详细内容</view>
				<view class="section-content" v-html="formatContent(knowledge.content)"></view>
			</view>
		</view>

		<view v-else class="error">
			<uni-icons type="warn" size="48" color="#ff6b6b"></uni-icons>
			<text>加载失败，请重试</text>
			<button class="retry-btn" @click="loadKnowledge">重新加载</button>
		</view>
	</view>
</template>

<script>
export default {
	data() {
		return {
			knowledge: null,
			loading: true,
			id: ''
		}
	},
	onLoad(options) {
		// 获取传递的知识条目 ID
		this.id = options.id
		// 加载知识详情
		this.loadKnowledge()
	},
	methods: {
		// 加载知识详情
		loadKnowledge() {
			this.loading = true
			uni.request({
				url: `http://localhost:7007/api/knowledge/${this.id}`,
				method: 'GET',
				success: (res) => {
					this.loading = false
					if (res.statusCode === 200 && res.data.success) {
						this.knowledge = res.data.item
					} else {
						uni.showToast({
							title: '加载知识详情失败',
							icon: 'none'
						})
					}
				},
				fail: (err) => {
					this.loading = false
					uni.showToast({
						title: '网络连接失败',
						icon: 'none'
					})
					console.error('加载知识详情失败:', err)
				}
			})
		},
		// 格式化日期
		formatDate(dateString) {
			const date = new Date(dateString)
			const year = date.getFullYear()
			const month = (date.getMonth() + 1).toString().padStart(2, '0')
			const day = date.getDate().toString().padStart(2, '0')
			return `${year}/${month}/${day}`
		},
		// 格式化内容，将换行符转换为 <br>
		formatContent(content) {
			return content.replace(/\n/g, '<br>')
		},
		// 返回上一页
		goBack() {
			uni.navigateBack()
		}
	}
}
</script>

<style lang="scss">
	.page {
		min-height: 100vh;
		background: transparent;
		padding: calc(var(--status-bar-height) + 80rpx) 24rpx 30rpx;
		position: relative;
	}

	.bg-glow {
		position: absolute;
		left: -90rpx;
		top: 130rpx;
		width: 280rpx;
		height: 280rpx;
		background: radial-gradient(circle, rgba(112, 162, 255, 0.2), rgba(112, 162, 255, 0));
		pointer-events: none;
	}

	.header {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		height: 80rpx;
		background: rgba(255, 255, 255, 0.95);
		backdrop-filter: blur(10rpx);
		box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.05);
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0 24rpx;
		z-index: 100;
	}

	.back-btn {
		width: 60rpx;
		height: 60rpx;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.header-title {
		font-size: 30rpx;
		font-weight: 700;
		color: #202a43;
	}

	.placeholder {
		width: 60rpx;
	}

	.loading {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		height: 60vh;
		color: #666;
	}

	.error {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		height: 60vh;
		color: #666;
	}

	.retry-btn {
		margin-top: 20rpx;
		background: #2f80ff;
		color: #fff;
		border-radius: 10rpx;
		padding: 0 30rpx;
	}

	.content {
		background: rgba(255, 255, 255, 0.9);
		border-radius: 20rpx;
		padding: 24rpx;
		box-shadow: 0 6rpx 16rpx rgba(24, 39, 75, 0.05);
	}

	.title {
		font-size: 34rpx;
		font-weight: 700;
		color: #1f2a44;
		line-height: 1.4;
		margin-bottom: 16rpx;
	}

	.meta {
		display: flex;
		flex-wrap: wrap;
		gap: 12rpx;
		margin-bottom: 24rpx;
		padding-bottom: 20rpx;
		border-bottom: 1px solid #f0f2f7;
	}

	.tag {
		background: #eef4ff;
		color: #2f80ff;
		padding: 6rpx 14rpx;
		border-radius: 999rpx;
		font-size: 22rpx;
	}

	.source {
		background: #f0f2f7;
		color: #666;
		padding: 6rpx 14rpx;
		border-radius: 999rpx;
		font-size: 22rpx;
	}

	.time {
		color: #999;
		font-size: 22rpx;
		align-self: center;
	}

	.section {
		margin-bottom: 24rpx;
	}

	.section-title {
		font-size: 26rpx;
		font-weight: 600;
		color: #202a43;
		margin-bottom: 12rpx;
	}

	.section-content {
		font-size: 24rpx;
		color: #5f6880;
		line-height: 1.6;
	}

	/* 处理 HTML 内容的样式 */
	.section-content :deep(p) {
		margin-bottom: 16rpx;
	}

	.section-content :deep(ul) {
		margin-bottom: 16rpx;
		padding-left: 30rpx;
	}

	.section-content :deep(li) {
		margin-bottom: 8rpx;
	}
</style>
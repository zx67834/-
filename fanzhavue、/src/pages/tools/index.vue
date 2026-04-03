<template>
	<view class="page">
		<view class="bg-glow"></view>
		<view class="title">工具箱</view>
		<view class="subtitle">选择检测方式，支持文字、图片、语音与视频。</view>
		<view class="tools">
			<view class="tool-card" :class="item.theme" v-for="item in tools" :key="item.title" hover-class="tool-card-hover" @click="useTool(item)">
				<view>
					<view class="tool-icon-slot">
						<uni-icons :type="item.icon" size="18" color="#ffffff"></uni-icons>
					</view>
					<view class="tool-title">{{ item.title }}</view>
					<view class="tool-desc">{{ item.desc }}</view>
				</view>
				<view class="tool-enter">点击进入</view>
			</view>
		</view>
		<view class="data-panel" hover-class="data-panel-hover" @click="goReport">
			<view class="data-title">检测数据</view>
			<view class="stats-row">
				<view class="stat-card blue">
					<view class="stat-label">报告总数</view>
					<view class="stat-num">{{ reports.length }}</view>
				</view>
				<view class="stat-card yellow">
					<view class="stat-label">高风险</view>
					<view class="stat-num">{{ highRiskCount }}</view>
				</view>
				<view class="stat-card green">
					<view class="stat-label">风险下降</view>
					<view class="stat-num">15%</view>
				</view>
			</view>
			<view class="list-head">
				<text>日期</text>
				<text>风险</text>
				<text>操作</text>
			</view>
			<view class="list-row" v-for="item in reports" :key="item.id">
				<text>{{ item.date }}</text>
				<text :class="['risk', item.riskClass]">{{ item.risk }}</text>
				<view class="actions">
					<text @click="act('查看', item)">查看</text>
					<text @click="act('下载', item)">下载</text>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
	export default {
		data() {
			return {
				tools: [{
						title: '文字反诈检测',
						desc: '识别聊天文本中的风险话术',
						theme: 'pink',
						icon: 'compose',
						url: '/pages/detect/index?type=text'
					},
					{
						title: '图片反诈检测',
						desc: 'OCR + 视觉模型识别伪造截图',
						theme: 'blue',
						icon: 'image',
						url: '/pages/detect/index?type=image'
					},
					{
						title: '语音反诈检测',
						desc: '识别语音诱导和情绪压迫信号',
						theme: 'pink',
						icon: 'mic',
						url: '/pages/detect/index?type=voice'
					},
					{
						title: '视频反诈检测',
						desc: '识别AI换脸等诈骗手法',
						theme: 'blue',
						icon: 'videocam',
						url: '/pages/detect/index?type=video'
					}
				],
				reports: [{
						id: 1,
						date: '2026/04/03',
						risk: '中风险',
						riskClass: 'mid'
					},
					{
						id: 2,
						date: '2026/04/03',
						risk: '高风险',
						riskClass: 'high'
					},
					{
						id: 3,
						date: '2026/04/03',
						risk: '低风险',
						riskClass: 'low'
					},
					{
						id: 4,
						date: '2026/04/03',
						risk: '高风险',
						riskClass: 'high'
					}
				]
			}
		},
		computed: {
			highRiskCount() {
				return this.reports.filter(i => i.riskClass === 'high').length
			}
		},
		methods: {
			useTool(item) {
				uni.navigateTo({
					url: item.url
				})
			},
			goReport() {
				uni.navigateTo({
					url: '/pages/report/index'
				})
			},
			act(type, item) {
				uni.showToast({
					title: `${type} ${item.date}`,
					icon: 'none'
				})
			}
		}
	}
</script>

<style lang="scss">
	.page {
		min-height: 100vh;
		background: rgba(243, 247, 255, 0.7);
		padding: calc(var(--status-bar-height) + 24rpx) 24rpx 24rpx;
		box-sizing: border-box;
		position: relative;
	}

	.bg-glow {
		position: absolute;
		left: -100rpx;
		top: 80rpx;
		width: 300rpx;
		height: 300rpx;
		background: radial-gradient(circle, rgba(121, 144, 255, 0.18), rgba(121, 144, 255, 0));
		pointer-events: none;
	}

	.title {
		font-size: var(--page-title-size);
		font-weight: var(--page-title-weight);
		color: var(--page-title-color);
		line-height: var(--page-title-line-height);
	}

	.subtitle {
		margin-top: 8rpx;
		font-size: 24rpx;
		color: #8890a6;
	}

	.tools {
		margin-top: 20rpx;
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 18rpx;
	}

	.tool-card {
		min-height: 320rpx;
		border-radius: 18rpx;
		padding: 30rpx 24rpx;
		box-shadow: 0 10rpx 26rpx rgba(22, 37, 76, 0.1);
		transition: transform 0.2s ease, box-shadow 0.2s ease;
		color: #fff;
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		opacity: 0.86;
		border: 1px solid rgba(255, 255, 255, 0.38);
		position: relative;
		overflow: hidden;
	}

	.tool-card::before {
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

	.tool-card:hover::before {
		transform: rotate(45deg) translateX(100%);
	}

	.tool-card-hover {
		transform: translateY(-4rpx) scale(0.985);
		box-shadow: 0 16rpx 34rpx rgba(24, 39, 75, 0.2);
		opacity: 1;
	}

	.tool-card.pink {
		background: linear-gradient(135deg, #ff6f9e, #e24b86);
	}

	.tool-card.blue {
		background: linear-gradient(135deg, #4f94ff, #2f6fff);
	}

	.tool-title {
		font-size: 34rpx;
		font-weight: 700;
	}

	.tool-desc {
		margin-top: 14rpx;
		font-size: 25rpx;
		line-height: 1.6;
		opacity: 0.95;
	}

	.tool-enter {
		font-size: 24rpx;
		opacity: 0.9;
	}

	.tool-icon-slot {
		width: 56rpx;
		height: 56rpx;
		border-radius: 12rpx;
		background: rgba(255, 255, 255, 0.22);
		border: 1px dashed rgba(255, 255, 255, 0.55);
		display: flex;
		align-items: center;
		justify-content: center;
		margin-bottom: 16rpx;
	}

	.data-panel {
		margin-top: 14rpx;
		border-radius: 16rpx;
		padding: 20rpx;
		background: rgba(255, 255, 255, 0.65);
		border: 1px solid rgba(210, 222, 246, 0.8);
		box-shadow: 0 8rpx 20rpx rgba(31, 50, 100, 0.08);
	}

	.data-panel-hover {
		transform: translateY(-2rpx);
	}

	.data-title {
		font-size: 30rpx;
		font-weight: 700;
		color: #1f2a44;
	}

	.stats-row {
		margin-top: 12rpx;
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 10rpx;
	}

	.stat-card {
		padding: 12rpx;
		border-radius: 12rpx;
	}

	.stat-card.blue {
		background: #e8f3ff;
	}

	.stat-card.yellow {
		background: #fff6de;
	}

	.stat-card.green {
		background: #eaf9ee;
	}

	.stat-label {
		font-size: 20rpx;
		color: #5e6a86;
	}

	.stat-num {
		margin-top: 4rpx;
		font-size: 36rpx;
		font-weight: 700;
		color: #1f2a44;
	}

	.list-head,
	.list-row {
		margin-top: 10rpx;
		display: grid;
		grid-template-columns: 1.2fr 0.9fr 1.4fr;
		align-items: center;
	}

	.list-head {
		font-size: 22rpx;
		color: #77819a;
		padding-bottom: 8rpx;
		border-bottom: 1px solid #e9eef8;
	}

	.list-row {
		font-size: 22rpx;
		color: #2e3a57;
		padding: 10rpx 0;
		border-bottom: 1px solid #eef2f8;
	}

	.list-row:last-child {
		border-bottom: 0;
	}

	.risk.high {
		color: #e65d5d;
		font-weight: 700;
	}

	.risk.mid {
		color: #d09a00;
		font-weight: 700;
	}

	.risk.low {
		color: #2f9e57;
		font-weight: 700;
	}

	.actions {
		display: flex;
		gap: 10rpx;
		color: #2f80ff;
	}
</style>

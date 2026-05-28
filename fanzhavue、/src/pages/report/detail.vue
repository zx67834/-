<template>
	<scroll-view class="page" scroll-y>
		<view class="card">
			<view class="title-row">
				<view class="title">{{ report.name || '安全报告详情' }}</view>
				<text class="risk-pill" :class="report.riskClass">{{ report.risk || '低风险' }}</text>
			</view>
			<view class="meta">日期：{{ report.date || '--' }}</view>
			<view class="meta">账号：{{ report.authorDisplay || '--' }}</view>
			<view class="meta">事件数：{{ report.events || 0 }}</view>
		</view>

		<view class="card">
			<view class="block-title">思考过程</view>
			<view v-for="(line, idx) in thoughtLines" :key="`th-${idx}`" class="line">{{ line }}</view>
		</view>

		<view class="card">
			<view class="block-title">详细内容</view>
			<view class="text">{{ report.content || '无' }}</view>
		</view>
	</scroll-view>
</template>

<script>
export default {
	data() {
		return {
			report: {}
		}
	},
	computed: {
		thoughtLines() {
			if (Array.isArray(this.report.thoughtLines) && this.report.thoughtLines.length) return this.report.thoughtLines
			return ['（该报告未包含思考过程记录）']
		}
	},
	onLoad() {
		try {
			const item = uni.getStorageSync('current_report_detail')
			if (item && typeof item === 'object') {
				this.report = item
			}
		} catch (e) {}
	}
}
</script>

<style lang="scss">
.page {
	min-height: 100vh;
	background: #f3f6fc;
	padding: 24rpx;
	box-sizing: border-box;
}
.card {
	background: #fff;
	border: 1rpx solid #e6ebf5;
	border-radius: 16rpx;
	padding: 20rpx;
	margin-bottom: 16rpx;
}
.title-row {
	display: flex;
	justify-content: space-between;
	align-items: center;
	gap: 12rpx;
}
.title {
	font-size: 30rpx;
	font-weight: 700;
	color: #1f2a44;
}
.risk-pill {
	padding: 4rpx 12rpx;
	border-radius: 999rpx;
	font-size: 20rpx;
}
.risk-pill.high {
	color: #e95a5a;
	background: #ffecee;
}
.risk-pill.mid {
	color: #d29d00;
	background: #fff7df;
}
.risk-pill.low {
	color: #2c9c55;
	background: #ebf9ef;
}
.meta {
	margin-top: 8rpx;
	font-size: 22rpx;
	color: #60708e;
}
.block-title {
	font-size: 25rpx;
	font-weight: 700;
	color: #25365a;
}
.line,
.text {
	margin-top: 10rpx;
	font-size: 22rpx;
	line-height: 1.6;
	color: #56627d;
	white-space: pre-wrap;
}
</style>

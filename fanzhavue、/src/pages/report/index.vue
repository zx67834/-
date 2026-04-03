<template>
	<scroll-view class="page" scroll-y>
		<view class="header">
			<view class="title">安全报告</view>
			<view class="sub">查看自动生成的安全监测报告，了解风险趋势与防御建议。</view>
		</view>

		<view class="stats-row">
			<view class="stat-card blue">
				<view class="stat-label">报告总数</view>
				<view class="stat-num">4</view>
				<view class="stat-sub">份安全报告</view>
			</view>
			<view class="stat-card yellow">
				<view class="stat-label">高风险报告</view>
				<view class="stat-num">2</view>
				<view class="stat-sub">份高风险</view>
			</view>
			<view class="stat-card green">
				<view class="stat-label">风险下降</view>
				<view class="stat-num">15%</view>
				<view class="stat-sub">近30天风险降低</view>
			</view>
		</view>

		<view class="panel">
			<view class="toolbar">
				<picker mode="selector" :range="riskFilters" :value="riskFilterIndex" @change="onRiskFilterChange">
					<view class="filter-pill">风险筛选：{{ riskFilters[riskFilterIndex] }}</view>
				</picker>
				<view class="page-size">
					<text class="size-label">每页</text>
					<picker mode="selector" :range="pageSizeOptions" :value="pageSizeIndex" @change="onPageSizeChange">
						<view class="size-pill">{{ pageSizeOptions[pageSizeIndex] }}</view>
					</picker>
				</view>
			</view>

			<view class="panel-title">报告列表</view>
			<view class="head-row">
				<text>日期</text>
				<text>名称</text>
				<text>风险</text>
				<text>事件数</text>
				<text>生成方式</text>
				<text>操作</text>
			</view>
			<view class="item-row" v-for="item in pagedReports" :key="item.id">
				<text class="cell date">{{ item.date }}</text>
				<text class="cell name">{{ item.name }}</text>
				<text class="cell risk">
					<text class="risk-pill" :class="item.riskClass">{{ item.risk }}</text>
				</text>
				<text class="cell">{{ item.events }}</text>
				<text class="cell">{{ item.method }}</text>
				<view class="cell act">
					<text @click="act('查看', item)">查看</text>
					<text @click="act('下载', item)">下载</text>
					<text @click="act('分享', item)">分享</text>
				</view>
			</view>

			<view class="pager">
				<text class="pager-info">{{ pageStart }}-{{ pageEnd }} / {{ filteredReports.length }}</text>
				<view class="pager-btns">
					<button class="pager-btn" size="mini" :disabled="page === 1" @click="prevPage">上一页</button>
					<button class="pager-btn" size="mini" :disabled="page >= totalPages" @click="nextPage">下一页</button>
				</view>
			</view>
		</view>

		<view class="bottom-grid">
			<view class="panel">
				<view class="panel-title">报告生成配置</view>
				<view class="form-item">
					<view class="label">生成频率</view>
					<picker mode="selector" :range="frequencies" :value="frequencyIndex" @change="onFrequencyChange">
						<view class="select">{{ frequencies[frequencyIndex] }}</view>
					</picker>
				</view>
				<view class="check-item" v-for="item in options" :key="item.key">
					<checkbox :checked="item.checked" color="#2f80ff" @click="toggleOption(item.key)" />
					<text>{{ item.label }}</text>
				</view>
			</view>

			<view class="panel">
				<view class="panel-title">报告预览</view>
				<view class="preview-box">
					<view class="preview-head">《安全监测报告》样例</view>
					<view class="preview-line">报告期：2025年3月1日 - 2025年3月31日</view>
					<view class="preview-line">风险概览：检测到可疑通话12次，成功拦截8次。</view>
					<view class="preview-line">主要风险类型：AI合成语音诈骗、兼职刷单、虚假征信。</view>
					<view class="preview-line">风险评分：65分（中风险）</view>
					<view class="preview-line">建议：加强通话核验，设置高风险拦截。</view>
					<text class="preview-link" @click="act('下载完整报告', reports[0])">下载完整报告</text>
				</view>
			</view>
		</view>
	</scroll-view>
</template>

<script>
	export default {
		data() {
			return {
				riskFilters: ['全部', '高风险', '中风险', '低风险'],
				riskFilterIndex: 0,
				pageSizeOptions: [4, 6, 8],
				pageSizeIndex: 0,
				page: 1,
				frequencies: ['每天', '每周', '每月'],
				frequencyIndex: 0,
				options: [{
						key: 'auto',
						label: '自动生成日报',
						checked: true
					},
					{
						key: 'chart',
						label: '包含图表',
						checked: true
					},
					{
						key: 'advice',
						label: '包含防御建议',
						checked: true
					},
					{
						key: 'email',
						label: '邮件发送',
						checked: false
					}
				],
				reports: [{
						id: 1,
						date: '2026/04/03',
						name: '安全报告 - 2026/4/3',
						risk: '中风险',
						riskClass: 'mid',
						events: 5,
						method: '手动生成'
					},
					{
						id: 2,
						date: '2026/04/03',
						name: '安全报告 - 2026/4/3',
						risk: '高风险',
						riskClass: 'high',
						events: 3,
						method: '手动生成'
					},
					{
						id: 3,
						date: '2026/04/03',
						name: '安全报告 - 2026/4/3',
						risk: '低风险',
						riskClass: 'low',
						events: 4,
						method: '手动生成'
					},
					{
						id: 4,
						date: '2026/04/03',
						name: '安全报告 - 2026/4/3',
						risk: '高风险',
						riskClass: 'high',
						events: 3,
						method: '手动生成'
					}
				]
			}
		},
		computed: {
			filteredReports() {
				const risk = this.riskFilters[this.riskFilterIndex]
				if (risk === '全部') return this.reports
				return this.reports.filter(r => r.risk === risk)
			},
			pageSize() {
				return Number(this.pageSizeOptions[this.pageSizeIndex])
			},
			totalPages() {
				const total = Math.ceil(this.filteredReports.length / this.pageSize)
				return total || 1
			},
			pagedReports() {
				const start = (this.page - 1) * this.pageSize
				return this.filteredReports.slice(start, start + this.pageSize)
			},
			pageStart() {
				if (!this.filteredReports.length) return 0
				return (this.page - 1) * this.pageSize + 1
			},
			pageEnd() {
				return Math.min(this.page * this.pageSize, this.filteredReports.length)
			}
		},
		methods: {
			onFrequencyChange(e) {
				this.frequencyIndex = Number(e.detail.value)
			},
			toggleOption(key) {
				const hit = this.options.find(o => o.key === key)
				if (hit) hit.checked = !hit.checked
			},
			onRiskFilterChange(e) {
				this.riskFilterIndex = Number(e.detail.value)
				this.page = 1
			},
			onPageSizeChange(e) {
				this.pageSizeIndex = Number(e.detail.value)
				this.page = 1
			},
			prevPage() {
				if (this.page > 1) this.page -= 1
			},
			nextPage() {
				if (this.page < this.totalPages) this.page += 1
			},
			act(type, item) {
				uni.showToast({
					title: `${type}：${item.name}`,
					icon: 'none'
				})
			}
		}
	}
</script>

<style lang="scss">
	.page {
		min-height: 100vh;
		padding: calc(var(--status-bar-height) + 16rpx) 16rpx 24rpx;
		background: transparent;
	}

	.header {
		margin-bottom: 12rpx;
	}

	.title {
		font-size: var(--page-title-size);
		font-weight: var(--page-title-weight);
		color: var(--page-title-color);
		line-height: var(--page-title-line-height);
	}

	.sub {
		margin-top: 6rpx;
		font-size: 22rpx;
		color: #8792aa;
	}

	.stats-row {
		display: grid;
		grid-template-columns: 1fr;
		gap: 12rpx;
	}

	.stat-card {
		border-radius: 14rpx;
		padding: 14rpx 16rpx;
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
		font-size: 24rpx;
		color: #2a3550;
	}

	.stat-num {
		font-size: 56rpx;
		font-weight: 700;
		line-height: 1.2;
		color: #1f2a44;
		margin-top: 4rpx;
	}

	.stat-sub {
		font-size: 22rpx;
		color: #74819d;
	}

	.panel {
		margin-top: 14rpx;
		background: rgba(255, 255, 255, 0.92);
		border-radius: 14rpx;
		padding: 14rpx;
		border: 1px solid #e8edf7;
	}

	.toolbar {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 10rpx;
	}

	.filter-pill,
	.size-pill {
		height: 52rpx;
		line-height: 52rpx;
		padding: 0 14rpx;
		border-radius: 999rpx;
		background: #f4f7fd;
		border: 1px solid #e5ebf7;
		font-size: 22rpx;
		color: #63708c;
	}

	.page-size {
		display: flex;
		align-items: center;
		gap: 8rpx;
	}

	.size-label {
		font-size: 21rpx;
		color: #8c96ab;
	}

	.panel-title {
		font-size: 28rpx;
		font-weight: 700;
		color: #1f2a44;
		margin-bottom: 10rpx;
	}

	.head-row,
	.item-row {
		display: grid;
		grid-template-columns: 1.1fr 1.8fr 1fr 0.8fr 1fr 1.5fr;
		gap: 8rpx;
		align-items: center;
		font-size: 20rpx;
	}

	.head-row {
		padding: 10rpx 0;
		color: #7f8aa3;
		border-bottom: 1px solid #edf1f8;
	}

	.item-row {
		padding: 12rpx 0;
		border-bottom: 1px solid #f1f4f9;
	}

	.item-row:last-child {
		border-bottom: 0;
	}

	.cell {
		color: #2f3a55;
	}

	.cell.risk {
		font-weight: 700;
	}

	.risk-pill {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: 2rpx 12rpx;
		border-radius: 999rpx;
		font-size: 19rpx;
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

	.cell.act {
		display: flex;
		gap: 10rpx;
		color: #2f80ff;
	}

	.pager {
		margin-top: 10rpx;
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.pager-info {
		font-size: 20rpx;
		color: #8692aa;
	}

	.pager-btns {
		display: flex;
		gap: 8rpx;
	}

	.pager-btn {
		border-radius: 10rpx;
	}

	.bottom-grid {
		margin-top: 14rpx;
		display: grid;
		grid-template-columns: 1fr;
		gap: 12rpx;
	}

	.form-item {
		margin-top: 8rpx;
	}

	.label {
		font-size: 22rpx;
		color: #8b96ab;
	}

	.select {
		margin-top: 8rpx;
		height: 64rpx;
		line-height: 64rpx;
		padding: 0 12rpx;
		border-radius: 10rpx;
		border: 1px solid #e4eaf7;
		font-size: 24rpx;
		color: #2d3854;
	}

	.check-item {
		margin-top: 12rpx;
		display: flex;
		align-items: center;
		gap: 10rpx;
		font-size: 24rpx;
		color: #34415e;
	}

	.preview-box {
		margin-top: 8rpx;
		border: 1px solid #e8edf7;
		border-radius: 10rpx;
		padding: 12rpx;
		background: #fff;
	}

	.preview-head {
		font-size: 24rpx;
		font-weight: 700;
		color: #2b3755;
	}

	.preview-line {
		margin-top: 6rpx;
		font-size: 22rpx;
		color: #667189;
		line-height: 1.55;
	}

	.preview-link {
		margin-top: 10rpx;
		display: inline-block;
		font-size: 22rpx;
		color: #2f80ff;
	}
</style>

<template>
	<scroll-view class="page" :class="{ 'theme-guardian': isGuardianTheme }" scroll-y>
		<view class="bg-glow"></view>
		<view class="top-brand">
			<view class="brand-left">
				<view class="logo-dot">
					<image class="logo-dot-img" src="/static/安全中心 .png" mode="aspectFit" />
				</view>
				<view>
					<view class="brand-title">安全中心</view>
					<view class="brand-sub">安全报告与风险监测</view>
				</view>
			</view>
		</view>

		<view v-if="viewerScopeHint" class="scope-card glass-card">
			<text class="scope-hint-text">{{ viewerScopeHint }}</text>
		</view>

		<view class="stats-panel glass-card" v-if="!loading">
			<view class="stats-row">
				<view class="stat-card blue">
					<view class="stat-label">报告总数</view>
					<view class="stat-num">{{ reportTotal }}</view>
					<view class="stat-sub">份安全报告</view>
				</view>
				<view class="stat-card high-risk">
					<view class="stat-label">高风险报告</view>
					<view class="stat-num">{{ highRiskTotal }}</view>
					<view class="stat-sub">份高风险</view>
				</view>
				<view class="stat-card green">
					<view class="stat-label">风险下降</view>
					<view class="stat-num">{{ riskDecreasePercent }}%</view>
					<view class="stat-sub">近30天降低</view>
				</view>
			</view>
		</view>
		<view v-else class="stats-loading glass-card">
			<view class="loading-spinner"></view>
			<text class="loading-text">同步数据中...</text>
		</view>
		<view v-if="loadError" class="load-err glass-card">{{ loadError }}</view>

		<view class="panel glass-card">
			<view class="toolbar">
				<picker mode="selector" :range="riskFilters" :value="riskFilterIndex" @change="onRiskFilterChange">
					<view class="filter-pill">风险筛选：{{ riskFilters[riskFilterIndex] }}</view>
				</picker>
				<view class="toolbar-actions">
					<text class="sync-link" @click="toggleTimeOrder">时间：{{ timeOrderLabel }}</text>
					<text class="sync-link" @click="fetchReports">同步</text>
				</view>
			</view>

			<view class="panel-head">
				<view class="panel-title">
					<uni-icons type="list" size="18" :color="accentIconColor"></uni-icons>
					报告列表
				</view>
			</view>
			<view v-if="loading" class="loading-hint">正在从服务器同步…</view>
			<view v-if="filteredReports.length === 0 && !loading" class="empty-list">
				<text>暂无报告数据</text>
			</view>
			<view class="report-list">
				<view class="report-item" v-for="item in pagedReports" :key="item.id">
					<view class="report-item-header">
						<view class="report-item-title">{{ item.name }}</view>
						<text class="risk-pill" :class="item.riskClass">{{ item.risk }}</text>
					</view>
					<view class="report-item-info">
						<text class="info-item">{{ item.date }}</text>
						<text class="info-item">{{ isGuardianTheme ? '被监护人' : '账号' }}：{{ item.authorDisplay }}</text>
						<text class="info-item">事件数：{{ item.events }}</text>
					</view>
					<view class="report-item-actions">
						<text class="action-btn" @click="act('查看', item)">查看</text>
						<text class="action-btn" @click="act('下载', item)">下载</text>
						<text class="action-btn" @click="act('分享', item)">分享</text>
						<text v-if="isGuardianTheme" class="action-btn danger" @click="act('删除', item)">删除</text>
					</view>
				</view>
			</view>

			<view class="pager" v-if="filteredReports.length > 0">
				<text class="pager-info">{{ pageStart }}-{{ pageEnd }} / {{ filteredReports.length }}</text>
				<view class="pager-btns">
					<button class="pager-btn" size="mini" :disabled="page === 1" @click="prevPage">上一页</button>
					<button class="pager-btn" size="mini" :disabled="page >= totalPages" @click="nextPage">下一页</button>
				</view>
			</view>
		</view>

	</scroll-view>
</template>

<script>
	import { getApiBaseUrl } from '@/utils/apiBase.js'

	export default {
		data() {
			return {
				riskFilters: ['全部', '高风险', '中风险', '低风险'],
				riskFilterIndex: 0,
				pageSizeOptions: [4, 6, 8],
				pageSizeIndex: 0,
				page: 1,
				timeOrder: 'desc',
				loading: false,
				loadError: '',
				reports: []
			}
		},
		computed: {
			currentAccount() {
				try {
					const raw = uni.getStorageSync('user_accounts')
					const arr = typeof raw === 'string' ? JSON.parse(raw || '[]') : raw
					const idx = Number(uni.getStorageSync('active_user_account_index') || 0)
					return Array.isArray(arr) ? (arr[idx] || arr[0] || null) : null
				} catch {
					return null
				}
			},
			isGuardianTheme() {
				const acc = this.currentAccount
				const userType = String(acc?.userType || '')
				const role = String(acc?.role || '')
				return userType.includes('监护人') || role.includes('监护人')
			},
			accentIconColor() {
				return this.isGuardianTheme ? '#c62828' : '#2f64f5'
			},
			reportTotal() {
				return this.reports.length
			},
			highRiskTotal() {
				return this.reports.filter((r) => r.risk === '高风险').length
			},
			riskDecreasePercent() {
				return this.computeRiskDecrease(this.reports)
			},
			filteredReports() {
				const risk = this.riskFilters[this.riskFilterIndex]
				const base = risk === '全部' ? this.reports : this.reports.filter((r) => r.risk === risk)
				const sorted = [...base].sort((a, b) => {
					const ta = Number(a.dateSort || 0)
					const tb = Number(b.dateSort || 0)
					return this.timeOrder === 'asc' ? ta - tb : tb - ta
				})
				return sorted
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
			},
			activeUserEmail() {
				return String(this.currentAccount?.email || '').trim()
			},
			viewerScopeHint() {
				if (!this.activeUserEmail) {
					return '未检测到登录邮箱，无法加载报告列表；请先登录用户端或监护人端账号。'
				}
				if (this.isGuardianTheme) {
					return '已与服务器同步：汇总显示您所绑定的全部被监护人生成的报告。若列为未记录，表示该条未保存生成者邮箱/姓名（旧数据），请被监护人登录后重新生成。'
				}
				return '已与服务器同步：仅显示当前登录账号本人生成的安全报告。'
			},
			timeOrderLabel() {
				return this.timeOrder === 'asc' ? '顺序' : '倒序'
			}
		},
		onShow() {
			this.fetchReports()
		},
		methods: {
			computeRiskDecrease(items) {
				const RISK_SCORE = {
					high: 100,
					medium: 60,
					low: 20
				}
				const now = Date.now()
				const dayMs = 24 * 60 * 60 * 1000
				const recent = items.filter((r) => {
					const t = r.dateSort
					return t && Number.isFinite(t) && now - t <= 30 * dayMs
				})
				if (recent.length < 2) return 0
				const sorted = [...recent].sort((a, b) => a.dateSort - b.dateSort)
				const mid = Math.ceil(sorted.length / 2)
				const head = sorted.slice(0, mid)
				const tail = sorted.slice(mid)
				const avg = (arr) =>
					arr.reduce((sum, r) => sum + (RISK_SCORE[r.severity] || 0), 0) / Math.max(arr.length, 1)
				const firstAvg = avg(head)
				const secondAvg = avg(tail)
				if (firstAvg <= 0) return 0
				const decrease = ((firstAvg - secondAvg) / firstAvg) * 100
				return Math.max(0, Math.round(decrease))
			},
			getMiniActiveAccount() {
				try {
					const raw = uni.getStorageSync('user_accounts')
					const arr = typeof raw === 'string' ? JSON.parse(raw || '[]') : raw
					const idx = Number(uni.getStorageSync('active_user_account_index') || 0)
					if (Array.isArray(arr) && arr.length) return arr[idx] || arr[0]
				} catch (e) {
					return null
				}
				return null
			},
			normalizeReport(r) {
				const pad2 = (n) => (Number(n) < 10 ? '0' : '') + n
				const sev = r.severity || 'low'
				const risk = sev === 'high' ? '高风险' : sev === 'medium' ? '中风险' : '低风险'
				const riskClass = sev === 'high' ? 'high' : sev === 'medium' ? 'mid' : 'low'
				const d = new Date(r.date)
				const ts = d.getTime()
				const date = Number.isNaN(ts)
					? '--'
					: `${d.getFullYear()}/${pad2(d.getMonth() + 1)}/${pad2(d.getDate())}`
				const ae = String(r.authorEmail || '').trim()
				const an = String(r.authorName || '').trim()
				const whoFallback = this.isGuardianTheme
					? '未记录（无生成账号信息）'
					: '未标注（无生成账号信息）'
				let authorDisplay = an && ae ? `${an}（${ae}）` : (ae || an || '')
				if (!authorDisplay && !this.isGuardianTheme) {
					const acc = this.getMiniActiveAccount()
					const ve = String(acc?.email || '').trim()
					const vn = String(acc?.name || '').trim()
					if (vn && ve) authorDisplay = `${vn}（${ve}）`
					else if (ve || vn) authorDisplay = ve || vn
				}
				if (!authorDisplay) authorDisplay = whoFallback
				const summaryText = String(r.summary || '')
				const contentText = String(r.content || '')
				const thoughtFromSummary = summaryText.includes('【反诈检测流程思考过程】')
					? summaryText.split('【反诈检测流程思考过程】')[1]
					: ''
				const thoughtFromContent = contentText.includes('【反诈检测流程思考过程】')
					? contentText.split('【反诈检测流程思考过程】')[1]
					: ''
				const thoughtRaw = String(thoughtFromContent || thoughtFromSummary || '').trim()
				const thoughtLines = thoughtRaw
					? thoughtRaw.split('\n').map((x) => String(x || '').trim()).filter(Boolean)
					: ['（该报告未包含思考过程记录）']
				return {
					id: r.id,
					date,
					dateSort: Number.isNaN(ts) ? 0 : ts,
					name: r.title || '安全报告',
					authorDisplay,
					risk,
					riskClass,
					events: r.events != null ? r.events : (Array.isArray(r.risks) ? r.risks.length : 0),
					method: '手动生成',
					severity: sev,
					summary: r.summary || '',
					content: contentText,
					rawRisks: Array.isArray(r.risks) ? r.risks : [],
					thoughtLines
				}
			},
			buildReportsRequestUrl() {
				const base = getApiBaseUrl().replace(/\/+$/, '')
				const acc = this.currentAccount
				const email = String(acc?.email || '').trim()
				if (!email) return `${base}/api/reports?_=${Date.now()}`
				const ut = String(acc?.userType || '')
				const role = String(acc?.role || '')
				const viewerType = (ut.includes('监护人') || role.includes('监护人') || this.isGuardianTheme) ? 'guardian' : 'user'
				const q = `viewerEmail=${encodeURIComponent(email)}&viewerType=${encodeURIComponent(viewerType)}&_=${Date.now()}`
				return `${base}/api/reports?${q}`
			},
			fetchReports() {
				this.loading = true
				this.loadError = ''
				const url = this.buildReportsRequestUrl()
				uni.request({
					url,
					method: 'GET',
					success: (res) => {
						this.loading = false
						const data = res.data || {}
						if (!data.success || !Array.isArray(data.reports)) {
							this.loadError = data.error || '加载失败'
							this.reports = []
							return
						}
						if (!url.includes('viewerEmail=')) {
							this.loadError = '请先登录并填写邮箱，再查看安全报告。'
							this.reports = []
							this.page = 1
							return
						}
						this.reports = data.reports.map((row) => this.normalizeReport(row))
						this.page = 1
					},
					fail: () => {
						this.loading = false
						this.loadError = '网络错误，请检查设置中的 API 地址与后端是否启动'
						this.reports = []
					}
				})
			},
			downloadReport(item) {
				if (!item || item.id == null) return
				const base = getApiBaseUrl()
				const url = `${base}/api/reports/${encodeURIComponent(String(item.id))}/download`
				uni.showLoading({
					title: '下载中'
				})
				uni.downloadFile({
					url,
					success: (dl) => {
						if (dl.statusCode !== 200) {
							uni.hideLoading()
							uni.showToast({
								title: `下载失败(${dl.statusCode})`,
								icon: 'none'
							})
							return
						}
						const openLocalFile = (filePath) => {
							uni.openDocument({
								filePath,
								showMenu: true,
								fail: () => {
									uni.showToast({
										title: '已下载，但无法直接打开',
										icon: 'none'
									})
								}
							})
						}
						uni.saveFile({
							tempFilePath: dl.tempFilePath,
							success: (saved) => {
								uni.hideLoading()
								openLocalFile(saved.savedFilePath || dl.tempFilePath)
							},
							fail: () => {
								uni.hideLoading()
								// 部分端 saveFile 失败时，仍可直接打开临时文件
								openLocalFile(dl.tempFilePath)
							}
						})
					},
					fail: (err) => {
						uni.hideLoading()
						const reason = err?.errMsg ? String(err.errMsg).slice(0, 22) : '网络异常'
						uni.showToast({
							title: `下载失败：${reason}`,
							icon: 'none'
						})
					}
				})
			},
			deleteReport(item) {
				if (!item || item.id == null) return
				const acc = this.getMiniActiveAccount()
				const viewerEmail = String(acc?.email || '').trim()
				if (!viewerEmail) {
					uni.showToast({
						title: '未检测到登录邮箱',
						icon: 'none'
					})
					return
				}
				uni.showModal({
					title: '确认删除',
					content: `确定删除报告《${item.name}》？删除后不可恢复。`,
					confirmText: '删除',
					confirmColor: '#e11d48',
					success: (ret) => {
						if (!ret.confirm) return
						uni.showLoading({ title: '删除中' })
						const base = getApiBaseUrl().replace(/\/+$/, '')
						const q = `viewerEmail=${encodeURIComponent(viewerEmail)}&viewerType=guardian`
						uni.request({
							url: `${base}/api/reports/${encodeURIComponent(String(item.id))}?${q}`,
							method: 'DELETE',
							success: (res) => {
								uni.hideLoading()
								const data = res.data || {}
								if ((res.statusCode !== 200 && res.statusCode !== 204) || !data.success) {
									uni.showToast({
										title: data.error || '删除失败',
										icon: 'none'
									})
									return
								}
								uni.showToast({
									title: '删除成功',
									icon: 'success'
								})
								this.fetchReports()
							},
							fail: () => {
								uni.hideLoading()
								uni.showToast({
									title: '网络错误，删除失败',
									icon: 'none'
								})
							}
						})
					}
				})
			},

			openReportDetail(item) {
				if (!item) return
				try {
					uni.setStorageSync('current_report_detail', item)
				} catch (e) {}
				uni.navigateTo({
					url: `/pages/report/detail?id=${encodeURIComponent(String(item.id || ''))}`
				})
			},

			onRiskFilterChange(e) {
				this.riskFilterIndex = Number(e.detail.value)
				this.page = 1
			},
			toggleTimeOrder() {
				this.timeOrder = this.timeOrder === 'asc' ? 'desc' : 'asc'
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
				if (!item) return
				if (type === '查看') {
					this.openReportDetail(item)
					return
				}
				if (type === '下载' || type === '下载完整报告') {
					this.downloadReport(item)
					return
				}
				if (type === '分享') {
					const txt = `${item.name} | ${item.risk} | 事件数 ${item.events}`
					uni.setClipboardData({
						data: txt,
						success: () => {
							uni.showToast({ title: '已复制到剪贴板', icon: 'none' })
						}
					})
					return
				}
				if (type === '删除') {
					this.deleteReport(item)
					return
				}
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
		background: linear-gradient(180deg, #f3f6fc 0%, #eef2f9 100%);
		padding: 24rpx 28rpx calc(32rpx + env(safe-area-inset-bottom));
		box-sizing: border-box;
		position: relative;
		overflow-x: hidden;
	}

	.bg-glow {
		position: absolute;
		right: -120rpx;
		top: -40rpx;
		width: 360rpx;
		height: 360rpx;
		background: radial-gradient(circle, rgba(110, 157, 255, 0.25), rgba(110, 157, 255, 0));
		pointer-events: none;
		z-index: 0;
	}

	.top-brand {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 20rpx;
		min-height: 72rpx;
		position: relative;
		z-index: 1;
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

	.scope-card {
		margin-bottom: 20rpx;
		padding: 24rpx 28rpx;
		position: relative;
		z-index: 1;
	}

	.scope-hint-text {
		font-size: 24rpx;
		color: #5d6a8a;
		line-height: 1.55;
	}

	.stats-panel {
		margin-bottom: 20rpx;
		padding: 28rpx 24rpx;
		position: relative;
		z-index: 1;
	}

	.stats-row {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 16rpx;
	}

	.stat-card {
		border-radius: 20rpx;
		padding: 18rpx 14rpx;
		text-align: center;
		min-width: 0;
	}

	.stat-card.blue {
		background: #e8f3ff;
	}

	.stat-card.high-risk {
		background: linear-gradient(135deg, #ffe4e6, #fecdd3);
		border: 1rpx solid #fca5a5;
	}

	.stat-card.green {
		background: #eaf9ee;
	}

	.stat-label {
		font-size: 20rpx;
		color: #4a5568;
	}

	.stat-num {
		font-size: 40rpx;
		font-weight: 700;
		line-height: 1.15;
		color: #1f2a44;
		margin-top: 6rpx;
	}

	.stat-sub {
		font-size: 18rpx;
		color: #74819d;
		margin-top: 4rpx;
	}

	.stats-loading {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 48rpx 24rpx;
		margin-bottom: 20rpx;
		position: relative;
		z-index: 1;
	}

	.loading-spinner {
		width: 44rpx;
		height: 44rpx;
		border: 3rpx solid #eef2f7;
		border-top-color: #2f64f5;
		border-radius: 50%;
		animation: spin 1s linear infinite;
		margin-bottom: 16rpx;
	}

	.loading-text {
		font-size: 24rpx;
		color: #8692aa;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	.load-err {
		font-size: 24rpx;
		color: #e95a5a;
		margin-bottom: 20rpx;
		padding: 20rpx 24rpx;
		position: relative;
		z-index: 1;
	}

	.panel {
		margin-bottom: 28rpx;
		padding: 32rpx 28rpx;
		position: relative;
		z-index: 1;
	}

	.toolbar {
		display: flex;
		justify-content: space-between;
		align-items: center;
		flex-wrap: wrap;
		gap: 12rpx;
		margin-bottom: 16rpx;
	}
	.toolbar-actions {
		display: flex;
		align-items: center;
		gap: 10rpx;
	}

	.sync-link {
		font-size: 24rpx;
		color: #2f64f5;
		font-weight: 600;
		padding: 8rpx 12rpx;
	}

	.loading-hint {
		font-size: 24rpx;
		color: #74819d;
		margin-bottom: 12rpx;
	}

	.filter-pill,
	.size-pill {
		height: 56rpx;
		line-height: 56rpx;
		padding: 0 18rpx;
		border-radius: 999rpx;
		background: #f4f7fd;
		border: 1px solid #e5ebf7;
		font-size: 24rpx;
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

	.panel-head {
		margin-bottom: 12rpx;
	}

	.panel-title {
		font-size: 30rpx;
		font-weight: 700;
		color: #1f2a44;
		display: flex;
		align-items: center;
		gap: 10rpx;
	}

	.empty-list {
		margin: 48rpx 0;
		text-align: center;
		color: #9aa3b8;
		font-size: 26rpx;
	}

	.report-list {
		margin-top: 8rpx;
	}

	.report-item {
		background: #f8fafc;
		border-radius: 20rpx;
		padding: 22rpx 20rpx;
		margin-bottom: 16rpx;
		border: 1px solid #e8edf7;
	}

	.report-item:last-child {
		margin-bottom: 0;
	}

	.report-item-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 12rpx;
	}

	.report-item-title {
		font-size: 26rpx;
		font-weight: 600;
		color: #1f2a44;
		flex: 1;
		margin-right: 12rpx;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.risk-pill {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: 4rpx 12rpx;
		border-radius: 999rpx;
		font-size: 20rpx;
		font-weight: 500;
		flex-shrink: 0;
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

	.report-item-info {
		display: flex;
		flex-wrap: wrap;
		gap: 12rpx 20rpx;
		margin-bottom: 12rpx;
	}

	.info-item {
		font-size: 22rpx;
		color: #5a6785;
	}

	.report-item-actions {
		display: flex;
		gap: 20rpx;
		justify-content: flex-end;
	}

	.action-btn {
		font-size: 24rpx;
		color: #2f64f5;
		font-weight: 600;
		padding: 8rpx 12rpx;
		border-radius: 12rpx;
	}

	.action-btn.danger {
		color: #e11d48;
	}

	.pager {
		margin-top: 20rpx;
		display: flex;
		align-items: center;
		justify-content: space-between;
		flex-wrap: wrap;
		gap: 12rpx;
	}

	.pager-info {
		font-size: 22rpx;
		color: #8692aa;
	}

	.pager-btns {
		display: flex;
		gap: 12rpx;
	}

	.pager-btn {
		border-radius: 14rpx;
	}


	.preview-line {
		margin-top: 10rpx;
		font-size: 24rpx;
		color: #667189;
		line-height: 1.55;
	}

	.page.theme-guardian {
		background: linear-gradient(180deg, #fff8f8 0%, #ffeeee 42%, #fce8ea 100%) !important;
	}

	.theme-guardian .bg-glow {
		background: radial-gradient(circle, rgba(239, 83, 80, 0.22), rgba(239, 83, 80, 0)) !important;
	}

	.theme-guardian .logo-dot {
		background: linear-gradient(145deg, #ef5350, #c62828) !important;
		box-shadow: 0 12rpx 28rpx rgba(198, 40, 40, 0.35) !important;
	}

	.theme-guardian .sync-link,
	.theme-guardian .action-btn {
		color: #c62828 !important;
	}

	.theme-guardian .loading-spinner {
		border-top-color: #c62828 !important;
	}
</style>
